/**
 * MongoDB-based Checkout Worker
 * 
 * Polls the CheckoutJobs collection for pending jobs and processes them.
 * No Redis dependency required - uses MongoDB as the job queue.
 * 
 * Usage: node checkoutWorker.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const CheckoutJob = require('./model/CheckoutJob');
const CustomerModel = require('./model/Customers');
const TransactionModel = require('./model/Transaction');

// Configuration
const POLL_INTERVAL = process.env.WORKER_POLL_INTERVAL || 2000; // 2 seconds
const STALE_JOB_TIMEOUT = process.env.WORKER_STALE_TIMEOUT || 5; // 5 minutes

const LEVELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const TREE_LEVEL_PERCENTAGE = 0.10; // 10%

let isShuttingDown = false;
let activeJob = null;

// ============================================
// HELPER FUNCTIONS
// ============================================

function isActiveCustomer(customer) {
    // return true
    return customer.referralStatus === 'active' && customer.isVerified === true;
}

async function upgradeTreeLevels(startCustomerId) {
    let currentCustomerId = startCustomerId;

    while (currentCustomerId) {
        const customer = await CustomerModel.findById(currentCustomerId);
        if (!customer) break;

        // Get direct referrals
        const directs = await CustomerModel.find({
            parentCustomer: customer._id
        }).select('levelLetter');

        if (directs.length < 2) {
            currentCustomerId = customer.parentCustomer;
            continue;
        }

        // Count by level
        const countByLevel = {};
        for (const d of directs) {
            countByLevel[d.levelLetter] = (countByLevel[d.levelLetter] || 0) + 1;
        }

        // Check if upgrade is possible
        for (let i = 0; i < LEVELS.length - 1; i++) {
            const level = LEVELS[i];
            const nextLevel = LEVELS[i + 1];

            if (
                countByLevel[level] >= 2 &&
                LEVELS.indexOf(nextLevel) > LEVELS.indexOf(customer.levelLetter)
            ) {
                customer.levelLetter = nextLevel;
                await customer.save();
                console.log(`  ✓ Upgraded ${customer.username} to level ${nextLevel}`);
                break;
            }
        }

        currentCustomerId = customer.parentCustomer;
    }
}

async function distributeTreePoints({ buyer, treePointsShare, checkoutTransaction }) {
    const paidLevels = new Set();
    const jUsers = [];
    let currentParentId = buyer.parentCustomer;
    let totalDistributed = 0;
    const distributionLog = [];

    while (currentParentId) {
        const parent = await CustomerModel.findById(currentParentId)
            .select('parentCustomer levelLetter referralStatus isVerified points username email');

        console.log(parent)
        if (!parent) break;
        currentParentId = parent.parentCustomer;

        // Skip inactive users
        if (!isActiveCustomer(parent)) {
            console.log(`  ⊘ Skipped inactive user ${parent.username} (Level ${parent.levelLetter})`);
            continue;
        }

        const level = parent.levelLetter;

        console.log(level)
        // LEVEL J → collect only
        if (level === 'J') {
            jUsers.push(parent);
            continue;
        }

        // Skip duplicated levels
        if (paidLevels.has(level)) {
            console.log(`  ⊘ Skipped duplicate level ${level} for ${parent.username}`);
            continue;
        }

        const reward = treePointsShare * TREE_LEVEL_PERCENTAGE;
        parent.points += reward;
        console.log(parent)
        await parent.save();

        paidLevels.add(level);
        totalDistributed += reward;

        distributionLog.push({
            recipientId: parent._id,
            recipientUsername: parent.username,
            level,
            amount: reward
        });

        console.log(`  ✓ Level ${level}: ${parent.username} received ${reward.toFixed(2)} points`);

        await TransactionModel.create({
            customerId: parent._id,
            userName: parent.username,
            userEmail: parent.email,
            amount: reward,
            type: 'tree_reward',
            status: 'completed',
            description: `Tree reward - Level ${level}`,
            relatedTransaction: checkoutTransaction._id,
            processedAt: new Date()
        });
    }

    // DISTRIBUTE LEVEL J (shared)
    if (jUsers.length > 0) {
        const jShare = treePointsShare * TREE_LEVEL_PERCENTAGE;
        const perUser = jShare / jUsers.length;

        console.log(`  ✓ Level J: ${jUsers.length} users sharing ${jShare.toFixed(2)} points (${perUser.toFixed(2)} each)`);

        for (const user of jUsers) {
            user.points += perUser;
            await user.save();

            totalDistributed += perUser;

            distributionLog.push({
                recipientId: user._id,
                recipientUsername: user.username,
                level: 'J',
                amount: perUser,
                sharedWith: jUsers.length
            });

            await TransactionModel.create({
                customerId: user._id,
                userName: user.username,
                userEmail: user.email,
                amount: perUser,
                type: 'tree_reward_shared',
                status: 'completed',
                description: `Tree reward - Level J shared (${jUsers.length})`,
                relatedTransaction: checkoutTransaction._id,
                processedAt: new Date()
            });
        }
    }

    return {
        totalDistributed,
        distributionLog,
        unused: treePointsShare - totalDistributed
    };
}

// ============================================
// JOB PROCESSOR
// ============================================

async function processJob(job) {
    console.log(`\n[Worker] Processing job ${job._id}`);
    console.log(`  Customer: ${job.customerId}`);
    console.log(`  Transaction: ${job.checkoutTransactionId}`);
    console.log(`  Attempt: ${job.attempts}/${job.maxAttempts}`);

    try {
        // Mark job as processing
        await job.markProcessing();

        // Fetch buyer and checkout transaction
        const buyer = await CustomerModel.findById(job.customerId);
        if (!buyer) {
            throw new Error(`Customer ${job.customerId} not found`);
        }

        const checkoutTransaction = await TransactionModel.findById(job.checkoutTransactionId);
        if (!checkoutTransaction) {
            throw new Error(`Checkout transaction ${job.checkoutTransactionId} not found`);
        }

        const { treePointsShare, appPointsShare, giftsPointsShare } = job.payload;

        // Step 1: Upgrade tree levels
        console.log(`[Worker] Step 1: Upgrading tree levels`);
        await upgradeTreeLevels(job.customerId);

        // Step 2: Distribute tree points
        console.log(`[Worker] Step 2: Distributing tree points (${treePointsShare.toFixed(2)} total)`);
        const treeResult = await distributeTreePoints({
            buyer,
            treePointsShare,
            checkoutTransaction
        });

        // Step 3: Add unused to gifts
        let finalGiftsShare = giftsPointsShare;
        if (treeResult.unused > 0) {
            finalGiftsShare += treeResult.unused;
            console.log(`[Worker] Step 3: Added ${treeResult.unused.toFixed(2)} unused tree points to gifts`);
        }

        // Step 4: Create Gifts & App Transactions
        console.log(`[Worker] Step 4: Creating system reward transactions`);

        await TransactionModel.create({
            customerId: buyer._id,
            userName: 'System',
            userEmail: 'system@mall.com',
            amount: finalGiftsShare,
            type: 'gifts_reward',
            status: 'completed',
            description: 'Gifts points from checkout',
            relatedTransaction: checkoutTransaction._id,
            processedAt: new Date()
        });

        await TransactionModel.create({
            customerId: buyer._id,
            userName: 'System',
            userEmail: 'system@mall.com',
            amount: appPointsShare,
            type: 'app_reward',
            status: 'completed',
            description: 'App revenue points from checkout',
            relatedTransaction: checkoutTransaction._id,
            processedAt: new Date()
        });

        // Step 5: Update checkout transaction with final details
        console.log(`[Worker] Step 5: Updating checkout transaction`);
        checkoutTransaction.treeDistribution = treeResult.distributionLog;
        checkoutTransaction.giftsPointsShare = finalGiftsShare;
        await checkoutTransaction.save();

        // Mark job as completed
        await job.markCompleted();

        console.log(`[Worker] ✅ Job ${job._id} completed successfully`);
        console.log(`  Tree distributed: ${treeResult.totalDistributed.toFixed(2)}`);
        console.log(`  Unused (to gifts): ${treeResult.unused.toFixed(2)}`);
        console.log(`  Final gifts share: ${finalGiftsShare.toFixed(2)}`);

        return {
            success: true,
            distributedToTree: treeResult.totalDistributed,
            unused: treeResult.unused,
            finalGiftsShare
        };

    } catch (error) {
        console.error(`[Worker] ❌ Job ${job._id} failed:`, error.message);

        await job.markFailed(error);

        if (job.attempts >= job.maxAttempts) {
            console.error(`[Worker] Job ${job._id} permanently failed after ${job.attempts} attempts`);
        } else {
            console.log(`[Worker] Job ${job._id} will be retried (attempt ${job.attempts}/${job.maxAttempts})`);
        }

        throw error;
    }
}

// ============================================
// WORKER LOOP
// ============================================

async function pollForJobs() {
    if (isShuttingDown) {
        return;
    }

    try {
        // Get next pending job
        const job = await CheckoutJob.getNextPendingJob();

        if (job) {
            activeJob = job;
            await processJob(job);
            activeJob = null;
        }

    } catch (error) {
        console.error('[Worker] Error in poll cycle:', error);
        activeJob = null;
    }

    // Schedule next poll
    if (!isShuttingDown) {
        setTimeout(pollForJobs, POLL_INTERVAL);
    }
}

async function resetStaleJobs() {
    try {
        const count = await CheckoutJob.resetStaleJobs(STALE_JOB_TIMEOUT);
        if (count > 0) {
            console.log(`[Worker] Reset ${count} stale job(s)`);
        }
    } catch (error) {
        console.error('[Worker] Error resetting stale jobs:', error);
    }
}

// ============================================
// STARTUP & SHUTDOWN
// ============================================

async function start() {
    console.log('=====================================');
    console.log('  Checkout Worker (MongoDB Queue)');
    console.log('=====================================\n');

    // Connect to MongoDB
    try {
        await mongoose.connect("mongodb+srv://mallmarketing055_db_user:IrTiZGbIqeRPFrOB@cluster0.xnjgmxa.mongodb.net/Node_project?retryWrites=true&w=majority", {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('[Worker] ✓ Connected to MongoDB');
    } catch (error) {
        console.error('[Worker] ✗ MongoDB connection failed:', error);
        process.exit(1);
    }

    // Reset any stale jobs on startup
    await resetStaleJobs();

    console.log(`[Worker] Poll interval: ${POLL_INTERVAL}ms`);
    console.log(`[Worker] Stale job timeout: ${STALE_JOB_TIMEOUT} minutes`);
    console.log('[Worker] Started and listening for jobs...\n');

    // Start polling
    pollForJobs();

    // Periodic stale job cleanup (every 5 minutes)
    setInterval(resetStaleJobs, 5 * 60 * 1000);
}

async function shutdown() {
    if (isShuttingDown) return;

    isShuttingDown = true;
    console.log('\n[Worker] Shutting down gracefully...');

    // Wait for active job to complete (with timeout)
    if (activeJob) {
        console.log('[Worker] Waiting for active job to complete...');
        let waited = 0;
        while (activeJob && waited < 30000) { // 30 second timeout
            await new Promise(resolve => setTimeout(resolve, 500));
            waited += 500;
        }
        if (activeJob) {
            console.log('[Worker] Active job timeout - forcing shutdown');
        }
    }

    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('[Worker] MongoDB connection closed');
    console.log('[Worker] Shutdown complete');
    process.exit(0);
}

// Handle graceful shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('SIGUSR2', shutdown); // For nodemon

// // Start the worker
// start().catch(error => {
//     console.error('[Worker] Fatal error:', error);
//     process.exit(1);
// });

// في آخر checkoutWorker.js
module.exports = {
    startWorker: start,
    shutdownWorker: shutdown
};