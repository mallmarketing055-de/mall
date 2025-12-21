const mongoose = require('mongoose');

const checkoutJobSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
        index: true
    },
    checkoutTransactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending',
        index: true
    },
    payload: {
        treePointsShare: { type: Number, required: true },
        appPointsShare: { type: Number, required: true },
        giftsPointsShare: { type: Number, required: true },
        totalRewardPoints: { type: Number, required: true }
    },
    attempts: {
        type: Number,
        default: 0
    },
    maxAttempts: {
        type: Number,
        default: 3
    },
    error: {
        message: String,
        stack: String,
        lastAttemptAt: Date
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    processedAt: {
        type: Date
    },
    startedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for efficient job polling
checkoutJobSchema.index({ status: 1, createdAt: 1 });
checkoutJobSchema.index({ status: 1, attempts: 1, createdAt: 1 });

// Method to mark job as processing
checkoutJobSchema.methods.markProcessing = async function () {
    this.status = 'processing';
    this.startedAt = new Date();
    this.attempts += 1;
    await this.save();
};

// Method to mark job as completed
checkoutJobSchema.methods.markCompleted = async function (result) {
    this.status = 'completed';
    this.completedAt = new Date();
    this.processedAt = new Date();
    await this.save();
};

// Method to mark job as failed
checkoutJobSchema.methods.markFailed = async function (error) {
    this.error = {
        message: error.message,
        stack: error.stack,
        lastAttemptAt: new Date()
    };

    // Mark as failed if max attempts reached
    if (this.attempts >= this.maxAttempts) {
        this.status = 'failed';
        this.processedAt = new Date();
    } else {
        // Reset to pending for retry
        this.status = 'pending';
    }

    await this.save();
};

// Static method to get next pending job
checkoutJobSchema.statics.getNextPendingJob = async function () {
    return await this.findOneAndUpdate(
        {
            status: 'pending',
            attempts: { $lt: 3 }
        },
        {
            $set: {
                status: 'processing',
                startedAt: new Date()
            },
            $inc: { attempts: 1 }
        },
        {
            new: true,
            sort: { createdAt: 1 } // FIFO - First In First Out
        }
    );
};

// Static method to reset stale processing jobs
checkoutJobSchema.statics.resetStaleJobs = async function (timeoutMinutes = 5) {
    const staleTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);

    const result = await this.updateMany(
        {
            status: 'processing',
            startedAt: { $lt: staleTime }
        },
        {
            $set: { status: 'pending' }
        }
    );

    return result.modifiedCount;
};

const CheckoutJob = mongoose.model('CheckoutJob', checkoutJobSchema);

module.exports = CheckoutJob;
