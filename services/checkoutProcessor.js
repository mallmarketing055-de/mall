const CustomerModel = require('../model/Customers');
const TransactionModel = require('../model/Transaction');

const LEVELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const TREE_LEVEL_PERCENTAGE = 0.05; // 5%

function isActiveCustomer(customer) {
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

        if (!parent) break;
        currentParentId = parent.parentCustomer;

        // Skip inactive users
        if (!isActiveCustomer(parent)) continue;

        const level = parent.levelLetter;

        // LEVEL J → collect only
        if (level === 'J') {
            jUsers.push(parent);
            continue;
        }

        // Skip duplicated levels
        if (paidLevels.has(level)) continue;

        const reward = treePointsShare * TREE_LEVEL_PERCENTAGE;
        parent.points += reward;
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
            description: `Tree reward - Level ${level}`,
            relatedTransaction: checkoutTransaction._id,
            processedAt: new Date()
        });
    }

    // DISTRIBUTE LEVEL J (shared)
    if (jUsers.length > 0) {
        const jShare = treePointsShare * TREE_LEVEL_PERCENTAGE;
        const perUser = jShare / jUsers.length;

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

/**
 * Process checkout rewards in the background
 * This job handles:
 * - Upgrading tree levels
 * - Distributing tree points
 * - Creating gift and app reward transactions
 */
async function processCheckoutRewards(job) {
    const {
        customerId,
        treePointsShare,
        appPointsShare,
        giftsPointsShare,
        checkoutTransactionId
    } = job.data;

    try {
        console.log(`[Checkout Processor] Starting job ${job.id} for customer ${customerId}`);

        // Fetch buyer and checkout transaction
        const buyer = await CustomerModel.findById(customerId);
        if (!buyer) {
            throw new Error(`Customer ${customerId} not found`);
        }

        const checkoutTransaction = await TransactionModel.findById(checkoutTransactionId);
        if (!checkoutTransaction) {
            throw new Error(`Checkout transaction ${checkoutTransactionId} not found`);
        }

        // Step 1: Upgrade tree levels
        console.log(`[Checkout Processor] Upgrading tree levels for ${customerId}`);
        await upgradeTreeLevels(customerId);

        // Step 2: Distribute tree points
        console.log(`[Checkout Processor] Distributing tree points`);
        const treeResult = await distributeTreePoints({
            buyer,
            treePointsShare,
            checkoutTransaction
        });

        // Step 3: Add unused to gifts
        let finalGiftsShare = giftsPointsShare;
        if (treeResult.unused > 0) {
            finalGiftsShare += treeResult.unused;
            console.log(`[Checkout Processor] Added ${treeResult.unused} unused tree points to gifts`);
        }

        // Step 4: Create Gifts & App Transactions
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
        checkoutTransaction.treeDistribution = treeResult.distributionLog;
        checkoutTransaction.giftsPointsShare = finalGiftsShare;
        await checkoutTransaction.save();

        console.log(`[Checkout Processor] Job ${job.id} completed successfully`);

        return {
            success: true,
            distributedToTree: treeResult.totalDistributed,
            unused: treeResult.unused,
            finalGiftsShare
        };

    } catch (error) {
        console.error(`[Checkout Processor] Job ${job.id} failed:`, error);
        throw error; // Will trigger retry
    }
}

module.exports = {
    processCheckoutRewards
};
