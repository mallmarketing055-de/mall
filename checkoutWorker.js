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

const RewardSettings = require('./model/RewardSettings');

// ============================================
// SETTINGS SERVICE
// ============================================
const SettingsModel = {
    async getCheckoutConfig() {
        try {
            const settings = await RewardSettings.getSettings();
            return settings.toObject(); // return plain object
        } catch (error) {
            console.error('[Worker] Failed to fetch reward settings, using defaults:', error);
            // Fallback defaults (Fixed points)
            return {
                levelGifts: { "B": 10, "D": 20, "F": 30, "H": 40, "J": 50 },
                firstPaymentReferral: 0.05,
                signupPoints: { enabled: true, amount: 50 },
                enableLevelGifts: true
            };
        }
    }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function isActiveCustomer(customer) {
    return customer.referralStatus === 'active' && customer.isVerified === true;
}

/**
 * Checks if a user has made any previous completed purchases.
 * Returns true if this is their first purchase.
 */
async function isFirstPurchase(customerId, currentTransactionId) {
    const count = await TransactionModel.countDocuments({
        customerId: customerId,
        status: 'completed',
        type: 'purchase',
        _id: { $ne: currentTransactionId }
    });
    console.log(count)
    return count === 0;
}

async function upgradeTreeLevels(startCustomerId, checkoutTransaction, config) {
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
                // 1. Upgrade Level
                customer.levelLetter = nextLevel;

                // 2. Level Upgrade Gift (Rule 1)
                // NOW A FIXED AMOUNT DEDUCTED FROM GLOBAL POOL
                if (config.enableLevelGifts && config.levelGifts && config.levelGifts[nextLevel]) {
                    const bonusAmount = config.levelGifts[nextLevel];

                    if (bonusAmount > 0) {
                        try {
                            // Check if gifts points balance is sufficient (system expense from pool)
                            const balanceCheck = await RewardSettings.checkGiftsBalance(bonusAmount);

                            if (balanceCheck.sufficient) {
                                customer.points = Math.round((customer.points + bonusAmount) * 100) / 100;

                                // Log Transaction as debit from pool
                                await TransactionModel.create({
                                    customerId: customer._id,
                                    userName: customer.username,
                                    userEmail: customer.email,
                                    amount: bonusAmount,
                                    type: 'level_gift_reward',
                                    status: 'completed',
                                    description: `Level Upgrade Gift - Reached Level ${nextLevel} (Deducted from Global Gifts Pool)`,
                                    relatedTransaction: checkoutTransaction._id,
                                    processedAt: new Date()
                                });

                                console.log(`  🎁 [Level] ${customer.username} reached Level ${nextLevel}, awarded ${bonusAmount} pts`);
                            } else {
                                console.log(`  ⚠️ [Level] Insufficient Gifts Pool Balance for ${customer.username}`);
                            }
                        } catch (err) {
                            console.error(`  ❌ [Level] Error:`, err.message);
                        }
                    }
                }

                await customer.save();
                console.log(`  ✓ Upgraded ${customer.username} to level ${nextLevel}`);
                break; // One upgrade per check
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

        if (!parent) break;
        currentParentId = parent.parentCustomer;

        // Skip inactive / unverified users
        if (!isActiveCustomer(parent)) {
            console.log(`  ⊘ [Tree] Skipped inactive user ${parent.username}`);
            continue;
        }

        const level = parent.levelLetter;

        // LEVEL J → collect for sharing
        if (level === 'J') {
            jUsers.push(parent);
            continue;
        }

        // Skip duplicated levels (Rule: one payment per level A-I)
        if (paidLevels.has(level)) {
            console.log(`  ⊘ [Tree] Skipped duplicate level ${level} for ${parent.username}`);
            continue;
        }

        // Calculate and round reward (10% of Tree Share = 5% of Total Checkout)
        const rawReward = treePointsShare * TREE_LEVEL_PERCENTAGE;
        const reward = Math.round(rawReward * 100) / 100;

        if (reward > 0) {
            parent.points = Math.round((parent.points + reward) * 100) / 100;
            await parent.save();

            paidLevels.add(level);
            totalDistributed += reward;

            distributionLog.push({
                recipientId: parent._id,
                recipientUsername: parent.username,
                level,
                amount: reward
            });

            await TransactionModel.create({
                customerId: parent._id,
                userName: parent.username,
                userEmail: parent.email,
                amount: reward,
                type: 'tree_reward',
                status: 'completed',
                description: `Tree reward - Level ${level} (Rounded)`,
                relatedTransaction: checkoutTransaction._id,
                processedAt: new Date()
            });

            console.log(`  ✓ [Tree] Level ${level}: ${parent.username} +${reward.toFixed(2)} pts`);
        }
    }

    // DISTRIBUTE LEVEL J (Shared among all Level J users in upline)
    if (jUsers.length > 0) {
        const rawJShare = treePointsShare * TREE_LEVEL_PERCENTAGE;
        const jShare = Math.round(rawJShare * 100) / 100;

        // Exact division and rounding for each user
        const perUser = Math.round((jShare / jUsers.length) * 100) / 100;

        console.log(`  ✓ [Tree] Level J: ${jUsers.length} users sharing ${jShare.toFixed(2)} pts (${perUser.toFixed(2)} each)`);

        for (const user of jUsers) {
            if (perUser > 0) {
                user.points = Math.round((user.points + perUser) * 100) / 100;
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
                    description: `Tree reward - Level J shared (${jUsers.length} users)`,
                    relatedTransaction: checkoutTransaction._id,
                    processedAt: new Date()
                });
            }
        }
    }

    // Round total distributed to avoid floating point residue
    totalDistributed = Math.round(totalDistributed * 100) / 100;

    return {
        totalDistributed,
        distributionLog,
        unused: Math.max(0, Math.round((treePointsShare - totalDistributed) * 100) / 100)
    };
}

// ============================================
// JOB PROCESSOR
// ============================================

async function processJob(job) {
    console.log(`\n[Worker] ⚙️ Processing job ${job._id} for ${job.payload.cartTotal} pts`);

    try {
        await job.markProcessing();

        const config = await SettingsModel.getCheckoutConfig();
        const buyer = await CustomerModel.findById(job.customerId);
        if (!buyer) throw new Error(`Customer ${job.customerId} not found`);

        const checkoutTransaction = await TransactionModel.findById(job.checkoutTransactionId);
        if (!checkoutTransaction) throw new Error(`Transaction ${job.checkoutTransactionId} not found`);

        // Extract shares safely
        const treePointsShare = Number(job.payload.treePointsShare) || 0;
        const appPointsShare = Number(job.payload.appPointsShare) || 0;
        const giftsPointsShare = Number(job.payload.giftsPointsShare) || 0;
        const directReferralShare = Number(job.payload.directReferralShare) || 0;

        // 1. Distribute Tree points
        console.log(`[Worker] Step 1: Distributing tree points`);
        const treeResult = await distributeTreePoints({
            buyer,
            treePointsShare,
            checkoutTransaction
        });

        // 2. Determine First Purchase status
        const isFirst = await isFirstPurchase(buyer._id, checkoutTransaction._id);

        // 3. Calculate App points (App revenue + unused tree)
        let finalAppPointsShare = Math.round((appPointsShare + treeResult.unused) * 100) / 100;

        console.log("------------------------------------------------")
        console.log(isFirst)
        console.log(directReferralShare)
        console.log(job.payload)
        console.log(!isFirst && directReferralShare > 0)
        console.log("------------------------------------------------")
        // 4. Add referral points for non-first purchase directly to buyer points
        if (!isFirst && directReferralShare > 0) {
            buyer.points = Math.round((buyer.points + directReferralShare) * 100) / 100;
            await buyer.save();
            console.log(`  ✓ [Referral] Added ${directReferralShare} pts to buyer ${buyer.username} (non-first purchase)`);

            // Include referral points in app revenue for system log
            finalAppPointsShare = Math.round((finalAppPointsShare + directReferralShare) * 100) / 100;
        }

        // 5. Log system income transactions
        console.log(`[Worker] Step 2: Logging system income`);

        // A) Gifts Pool Income
        await TransactionModel.create({
            customerId: buyer._id,
            userName: 'System',
            userEmail: 'system@mall.com',
            amount: giftsPointsShare,
            type: 'gifts_reward',
            status: 'completed',
            description: 'Income to Gifts Pool from checkout split',
            relatedTransaction: checkoutTransaction._id,
            processedAt: new Date()
        });

        // B) App Revenue (including referral points if non-first)
        await TransactionModel.create({
            customerId: buyer._id,
            userName: 'System',
            userEmail: 'system@mall.com',
            amount: finalAppPointsShare,
            type: 'app_reward',
            status: 'completed',
            description: isFirst
                ? 'App revenue split from checkout'
                : 'App revenue split including referral points (non-first purchase)',
            relatedTransaction: checkoutTransaction._id,
            processedAt: new Date()
        });

        // 6. First Purchase Bonuses
        if (isFirst) {
            console.log(`[Worker] ✨ Processing first purchase bonuses for ${buyer.username}`);

            // Referral Bonus to Parent
            if (buyer.parentCustomer && directReferralShare > 0) {
                const parent = await CustomerModel.findById(buyer.parentCustomer);
                if (parent && isActiveCustomer(parent)) {
                    const bonus = Math.round(directReferralShare * 100) / 100;
                    parent.points = Math.round((parent.points + bonus) * 100) / 100;
                    await parent.save();

                    await TransactionModel.create({
                        customerId: parent._id,
                        userName: parent.username,
                        userEmail: parent.email,
                        amount: bonus,
                        type: 'direct_referral_reward',
                        status: 'completed',
                        description: `Direct Referral Reward - First purchase bonus for referring ${buyer.username}`,
                        relatedTransaction: checkoutTransaction._id,
                        processedAt: new Date()
                    });
                    console.log(`  ✓ [Referral] Gifted ${bonus} pts to parent ${parent.username}`);
                }
            }

            // Signup Bonus from Gifts Pool
            if (config.signupPoints.enabled && config.signupPoints.amount > 0) {
                const signupBonus = config.signupPoints.amount;
                try {
                    const balanceCheck = await RewardSettings.checkGiftsBalance(signupBonus);
                    if (balanceCheck.sufficient) {
                        buyer.points = Math.round((buyer.points + signupBonus) * 100) / 100;
                        await buyer.save();

                        await TransactionModel.create({
                            customerId: buyer._id,
                            userName: buyer.username,
                            userEmail: buyer.email,
                            amount: signupBonus,
                            type: 'signup_gifts_reward',
                            status: 'completed',
                            description: `Signup Bonus - Welcome gift (Deducted from Gifts Pool)`,
                            relatedTransaction: checkoutTransaction._id,
                            processedAt: new Date()
                        });
                        console.log(`  ✓ [Signup] Gifted ${signupBonus} pts to buyer ${buyer.username} from Pool`);
                    } else {
                        console.log(`  ⚠️ [Signup] Insufficient Gifts Pool balance (${balanceCheck.available})`);
                    }
                } catch (err) {
                    console.error(`  ❌ [Signup] Error:`, err.message);
                }
            }
        }

        // 7. Check for Tree Level Upgrades
        console.log(`[Worker] Step 3: Checking for level upgrades`);
        await upgradeTreeLevels(job.customerId, checkoutTransaction, config);

        // 8. Update original transaction
        checkoutTransaction.treeDistribution = treeResult.distributionLog;
        checkoutTransaction.giftsPointsShare = giftsPointsShare;
        checkoutTransaction.appPointsShare = finalAppPointsShare;
        await checkoutTransaction.save();

        await job.markCompleted();
        console.log(`[Worker] ✅ Job ${job._id} finalized successfully`);

        return {
            success: true,
            isFirst,
            totalAppRevenue: finalAppPointsShare,
            treeDistributed: treeResult.totalDistributed
        };

    } catch (error) {
        console.error(`[Worker] ❌ Job ${job._id} failed:`, error.message);
        await job.markFailed(error);
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