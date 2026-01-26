const RewardSettings = require('../model/RewardSettings');
const Transaction = require('../model/Transaction');

// Get Reward Settings and Pool Statistics
exports.getRewardSettings = async (req, res) => {
    try {
        const settings = await RewardSettings.getSettings();

        console.log(settings);
        // Calculate Statistics (derived from transaction ledger)
        const incomeTypes = ['gifts_reward'];
        const expenseTypes = ['signup_gifts_reward', 'level_gift_reward'];

        const stats = await Transaction.aggregate([
            {
                $match: {
                    type: { $in: [...incomeTypes, ...expenseTypes, 'app_reward', 'tree_reward', 'tree_reward_shared', 'direct_referral_reward'] },
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: null,
                    totalGiftsIncome: { $sum: { $cond: [{ $in: ['$type', incomeTypes] }, '$amount', 0] } },
                    totalSignupSpent: { $sum: { $cond: [{ $eq: ['$type', 'signup_gifts_reward'] }, '$amount', 0] } },
                    totalLevelSpent: { $sum: { $cond: [{ $eq: ['$type', 'level_gift_reward'] }, '$amount', 0] } },
                    totalAppRevenue: { $sum: { $cond: [{ $eq: ['$type', 'app_reward'] }, '$amount', 0] } },
                    totalUserPointsDistributed: {
                        $sum: {
                            $cond: [
                                { $in: ['$type', ['tree_reward', 'tree_reward_shared', 'direct_referral_reward', 'signup_gifts_reward', 'level_gift_reward']] },
                                '$amount',
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        const poolData = stats.length > 0 ? stats[0] : {
            totalGiftsIncome: 0,
            totalSignupSpent: 0,
            totalLevelSpent: 0,
            totalAppRevenue: 0,
            totalUserPointsDistributed: 0
        };

        const totalSpent = poolData.totalSignupSpent + poolData.totalLevelSpent;
        const balance = poolData.totalGiftsIncome - totalSpent;

        res.status(200).json({
            success: true,
            data: {
                ...settings.toObject(),
                levelGifts: settings.levelGifts,
                poolStats: {
                    balance,
                    totalEarned: poolData.totalGiftsIncome,
                    totalSpent: totalSpent,
                    signupSpent: poolData.totalSignupSpent,
                    levelSpent: poolData.totalLevelSpent
                },
                appStats: {
                    totalRevenue: poolData.totalAppRevenue
                },
                userStats: {
                    totalDistributed: poolData.totalUserPointsDistributed
                }
            }
        });
    } catch (error) {
        console.error('Get reward settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Update Reward Settings
exports.updateRewardSettings = async (req, res) => {
    try {
        const {
            levelGifts,
            firstPaymentReferral,
            signupPoints,
            enableLevelGifts
        } = req.body;

        // Validation
        if (firstPaymentReferral !== undefined) {
            if (typeof firstPaymentReferral !== 'number' || firstPaymentReferral < 0 || firstPaymentReferral > 1) {
                return res.status(400).json({
                    success: false,
                    message: 'First payment referral must be a number between 0 and 1'
                });
            }
        }

        if (signupPoints) {
            if (typeof signupPoints.amount !== 'number' || signupPoints.amount < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Signup points amount must be a positive number'
                });
            }
        }

        if (levelGifts) {
            const validLevels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
            for (const [level, percentage] of Object.entries(levelGifts)) {
                if (!validLevels.includes(level)) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid level letter: ${level}`
                    });
                }
                if (typeof percentage !== 'number' || percentage < 0 || percentage > 1) {
                    return res.status(400).json({
                        success: false,
                        message: `Percentage for level ${level} must be between 0 and 1`
                    });
                }
            }
        }

        const settings = await RewardSettings.getSettings();

        if (levelGifts) settings.levelGifts = levelGifts;
        if (firstPaymentReferral !== undefined) settings.firstPaymentReferral = firstPaymentReferral;
        if (signupPoints) settings.signupPoints = { ...settings.signupPoints, ...signupPoints };
        if (enableLevelGifts !== undefined) settings.enableLevelGifts = enableLevelGifts;

        await settings.save();

        res.status(200).json({
            success: true,
            message: 'Reward settings updated successfully',
            data: settings
        });

    } catch (error) {
        console.error('Update reward settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Add Manual Funds to Gifts Pool
exports.addManualPoolFunds = async (req, res) => {
    try {
        const { amount, description } = req.body;

        if (typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
        }

        // Create a gifts_reward transaction to increase pool balance
        await Transaction.create({
            customerId: req.admin ? req.admin._id : null,
            userName: 'Admin',
            userEmail: 'admin@system.com',
            amount,
            type: 'gifts_reward',
            status: 'completed',
            description: description || 'Manual addition to Gifts Pool by Admin',
            processedAt: new Date()
        });

        res.status(200).json({
            success: true,
            message: `Successfully added ${amount} to Gifts Points Pool`
        });
    } catch (error) {
        console.error('Add manual pool funds error:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};
