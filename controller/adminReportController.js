const TransactionModel = require('../model/Transaction');

// Get Admin Monthly Report (Points Distribution)
module.exports.getAdminMonthlyReport = async (req, res) => {
    try {
        const { year, month } = req.query;

        // Default to current month if not provided
        const targetDate = new Date();
        const targetYear = year ? parseInt(year) : targetDate.getFullYear();
        const targetMonth = month ? parseInt(month) : targetDate.getMonth() + 1;

        // Calculate date range for the month
        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

        // Aggregate purchases for the month
        const monthlyStats = await TransactionModel.aggregate([
            {
                $match: {
                    type: 'purchase',
                    status: 'completed',
                    createdAt: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalPurchases: { $sum: 1 },
                    totalPointsCharged: { $sum: '$cartTotal' },
                    totalRewardPoints: { $sum: '$rewardPointsEarned' },
                    totalAppPoints: { $sum: '$appPointsShare' },
                    totalGiftsPoints: { $sum: '$giftsPointsShare' },
                    totalTreePoints: { $sum: '$treePointsShare' },
                    totalRevenue: { $sum: '$amount' }
                }
            }
        ]);

        const stats = monthlyStats[0] || {
            totalPurchases: 0,
            totalPointsCharged: 0,
            totalRewardPoints: 0,
            totalAppPoints: 0,
            totalGiftsPoints: 0,
            totalTreePoints: 0,
            totalRevenue: 0
        };

        // Aggregate totals for all time
        const totalStats = await TransactionModel.aggregate([
            {
                $match: { type: 'purchase', status: 'completed' }
            },
            {
                $group: {
                    _id: null,
                    totalAppPoints: { $sum: '$appPointsShare' },
                    totalGiftsPoints: { $sum: '$giftsPointsShare' },
                    totalTreePoints: { $sum: '$treePointsShare' }
                }
            }
        ]);

        const cumulativeStats = totalStats[0] || {
            totalAppPoints: 0,
            totalGiftsPoints: 0,
            totalTreePoints: 0
        };

        // Get detailed purchases list
        const purchases = await TransactionModel.find({
            type: 'purchase',
            status: 'completed',
            createdAt: {
                $gte: startDate,
                $lte: endDate
            }
        })
            .select('reference userName userEmail amount cartTotal rewardPointsEarned appPointsShare giftsPointsShare treePointsShare createdAt')
            .sort({ createdAt: -1 })
            .limit(100);

        res.status(200).json({
            success: true,
            data: {
                period: {
                    year: targetYear,
                    month: targetMonth,
                    monthName: new Date(targetYear, targetMonth - 1).toLocaleString('en-US', { month: 'long' }),
                    dateRange: {
                        start: startDate,
                        end: endDate
                    }
                },
                summary: {
                    totalPurchases: stats.totalPurchases,
                    totalPointsCharged: Math.round(stats.totalPointsCharged * 100) / 100,
                    totalRewardPoints: Math.round(stats.totalRewardPoints * 100) / 100,
                    totalAppPoints: Math.round(stats.totalAppPoints * 100) / 100,
                    totalGiftsPoints: Math.round(stats.totalGiftsPoints * 100) / 100,
                    totalTreePoints: Math.round(stats.totalTreePoints * 100) / 100,
                    totalRevenue: Math.round(stats.totalRevenue * 100) / 100
                },
                cumulativePoints: {
                    totalAppPoints: Math.round(cumulativeStats.totalAppPoints * 100) / 100,
                    totalGiftsPoints: Math.round(cumulativeStats.totalGiftsPoints * 100) / 100,
                    totalTreePoints: Math.round(cumulativeStats.totalTreePoints * 100) / 100
                },
                purchases: purchases
            }
        });

    } catch (error) {
        console.error('Get admin monthly report error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

