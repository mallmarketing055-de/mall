const CheckoutJob = require('../model/CheckoutJob');

/**
 * Get all checkout jobs for a specific user
 * GET /dashboard/user-jobs/:customerId
 */
module.exports.getUserJobs = async (req, res) => {
    try {
        const { customerId } = req.params;

        // Validate customerId
        if (!customerId) {
            return res.status(400).json({
                success: false,
                message: 'Customer ID is required'
            });
        }

        // Get all jobs for this user
        const jobs = await CheckoutJob.find({ customerId: customerId })
            .populate('checkoutTransactionId', 'reference amount createdAt')
            .sort({ createdAt: -1 }) // Most recent first
            .lean();

        // Calculate status summary
        const statusSummary = {
            pending: 0,
            processing: 0,
            completed: 0,
            failed: 0
        };

        jobs.forEach(job => {
            statusSummary[job.status]++;
        });

        // Format jobs for response
        const formattedJobs = jobs.map(job => ({
            id: job._id,
            transactionId: job.checkoutTransactionId?._id || null,
            transactionReference: job.checkoutTransactionId?.reference || 'N/A',
            transactionAmount: job.checkoutTransactionId?.amount || 0,
            status: job.status,
            attempts: job.attempts,
            maxAttempts: job.maxAttempts,
            payload: job.payload,
            error: job.error || null,
            createdAt: job.createdAt,
            startedAt: job.startedAt || null,
            completedAt: job.completedAt || null,
            processedAt: job.processedAt || null
        }));

        res.status(200).json({
            success: true,
            totalJobs: jobs.length,
            statusSummary,
            jobs: formattedJobs
        });

    } catch (error) {
        console.error('Get user jobs error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Get checkout job statistics for all users (admin only)
 * GET /dashboard/jobs-stats
 */
module.exports.getJobsStats = async (req, res) => {
    try {
        // Get overall stats
        const totalJobs = await CheckoutJob.countDocuments();
        const pendingJobs = await CheckoutJob.countDocuments({ status: 'pending' });
        const processingJobs = await CheckoutJob.countDocuments({ status: 'processing' });
        const completedJobs = await CheckoutJob.countDocuments({ status: 'completed' });
        const failedJobs = await CheckoutJob.countDocuments({ status: 'failed' });

        // Get average processing time for completed jobs
        const completedJobsWithTiming = await CheckoutJob.find({
            status: 'completed',
            startedAt: { $exists: true },
            completedAt: { $exists: true }
        })
            .select('startedAt completedAt')
            .limit(100)
            .lean();

        let avgProcessingTime = 0;
        if (completedJobsWithTiming.length > 0) {
            const totalTime = completedJobsWithTiming.reduce((sum, job) => {
                return sum + (job.completedAt.getTime() - job.startedAt.getTime());
            }, 0);
            avgProcessingTime = Math.round(totalTime / completedJobsWithTiming.length);
        }

        // Get recent failed jobs
        const recentFailedJobs = await CheckoutJob.find({ status: 'failed' })
            .populate('customerId', 'username email')
            .sort({ processedAt: -1 })
            .limit(10)
            .lean();

        res.status(200).json({
            success: true,
            stats: {
                total: totalJobs,
                pending: pendingJobs,
                processing: processingJobs,
                completed: completedJobs,
                failed: failedJobs,
                avgProcessingTime: avgProcessingTime
            },
            recentFailedJobs: recentFailedJobs.map(job => ({
                id: job._id,
                customerId: job.customerId?._id,
                customerUsername: job.customerId?.username || 'N/A',
                error: job.error?.message || 'Unknown error',
                attempts: job.attempts,
                processedAt: job.processedAt
            }))
        });

    } catch (error) {
        console.error('Get jobs stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
