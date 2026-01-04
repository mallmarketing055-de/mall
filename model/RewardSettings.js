const mongoose = require('mongoose');

const rewardSettingsSchema = new mongoose.Schema({
    levelGifts: {
        type: Map,
        of: Number,
        default: {
            "B": 10,
            "D": 20,
            "F": 30,
            "H": 40,
            "J": 50
        }
    },
    firstPaymentReferral: {
        type: Number,
        default: 0.05, // 5%
        min: 0,
        max: 1
    },
    treeShare: {
        type: Number,
        default: 0.50, // 50%
        min: 0,
        max: 1
    },
    giftsShare: {
        type: Number,
        default: 0.15, // 15%
        min: 0,
        max: 1
    },
    appShare: {
        type: Number,
        default: 0.30, // 30%
        min: 0,
        max: 1
    },
    signupPoints: {
        enabled: {
            type: Boolean,
            default: true
        },
        amount: {
            type: Number,
            default: 50,
            min: 0
        }
    },
    enableLevelGifts: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Singleton pattern helper: ensuring only one settings document exists
rewardSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

// Helper method to calculate current Gifts Points balance from transactions (Ledge Source of Truth)
rewardSettingsSchema.statics.getGiftsPointsBalance = async function () {
    const TransactionModel = require('./Transaction');

    // System Income: credits to pool
    const incomeTypes = ['gifts_reward'];
    // System Expense: debits from pool
    const expenseTypes = ['signup_gifts_reward', 'level_gift_reward'];

    const result = await TransactionModel.aggregate([
        {
            $match: {
                type: { $in: [...incomeTypes, ...expenseTypes] },
                status: 'completed'
            }
        },
        {
            $group: {
                _id: null,
                totalIncome: {
                    $sum: { $cond: [{ $in: ['$type', incomeTypes] }, '$amount', 0] }
                },
                totalExpense: {
                    $sum: { $cond: [{ $in: ['$type', expenseTypes] }, '$amount', 0] }
                }
            }
        }
    ]);

    if (result.length === 0) return 0;
    const balance = result[0].totalIncome - result[0].totalExpense;
    return balance;
};

// Helper method to check if sufficient balance exists and return current balance
rewardSettingsSchema.statics.checkGiftsBalance = async function (requiredAmount) {
    const currentBalance = await this.getGiftsPointsBalance();
    return {
        available: currentBalance,
        sufficient: currentBalance >= requiredAmount
    };
};

module.exports = mongoose.model('RewardSettings', rewardSettingsSchema);
