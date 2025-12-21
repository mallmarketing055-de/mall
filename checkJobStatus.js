/**
 * MongoDB Job Queue Status Monitor
 * 
 * Quick script to check the status of checkout jobs in MongoDB
 * Usage: node checkJobStatus.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({
    path: './config/.env',
});

console.log(process.env.MONGO_URL);

const CheckoutJob = require('./model/CheckoutJob');

async function checkJobStatus() {
    try {
        console.log('=====================================');
        console.log('  Checkout Jobs Status (MongoDB)');
        console.log('=====================================\n');

        // Connect to MongoDB
        await mongoose.connect("mongodb+srv://mallmarketing055_db_user:IrTiZGbIqeRPFrOB@cluster0.xnjgmxa.mongodb.net/Node_project?retryWrites=true&w=majority", {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // Get job counts by status
        const pending = await CheckoutJob.countDocuments({ status: 'pending' });
        const processing = await CheckoutJob.countDocuments({ status: 'processing' });
        const completed = await CheckoutJob.countDocuments({ status: 'completed' });
        const failed = await CheckoutJob.countDocuments({ status: 'failed' });

        console.log('📊 Job Counts:');
        console.log(`   Pending:    ${pending}`);
        console.log(`   Processing: ${processing}`);
        console.log(`   Completed:  ${completed}`);
        console.log(`   Failed:     ${failed}`);
        console.log('');

        // Get total jobs
        const total = pending + processing + completed + failed;
        console.log(`   Total:      ${total}`);
        console.log('');

        // Show recent pending jobs
        if (pending > 0) {
            console.log('⏳ Recent Pending Jobs (up to 5):');
            const pendingJobs = await CheckoutJob.find({ status: 'pending' })
                .sort({ createdAt: 1 })
                .limit(5)
                .populate('customerId', 'username email')
                .lean();

            pendingJobs.forEach((job, index) => {
                const waitTime = Math.floor((Date.now() - job.createdAt.getTime()) / 1000);
                console.log(`\n   [${index + 1}] Job ID: ${job._id}`);
                console.log(`       Customer: ${job.customerId?.username || 'N/A'}`);
                console.log(`       Transaction: ${job.checkoutTransactionId}`);
                console.log(`       Waiting: ${waitTime}s`);
                console.log(`       Attempts: ${job.attempts}/${job.maxAttempts}`);
            });
            console.log('');
        }

        // Show active processing jobs
        if (processing > 0) {
            console.log('⚡ Active Processing Jobs:');
            const processingJobs = await CheckoutJob.find({ status: 'processing' })
                .sort({ startedAt: -1 })
                .limit(5)
                .populate('customerId', 'username email')
                .lean();

            processingJobs.forEach((job, index) => {
                const elapsed = Math.floor((Date.now() - job.startedAt.getTime()) / 1000);
                console.log(`\n   [${index + 1}] Job ID: ${job._id}`);
                console.log(`       Customer: ${job.customerId?.username || 'N/A'}`);
                console.log(`       Transaction: ${job.checkoutTransactionId}`);
                console.log(`       Elapsed: ${elapsed}s`);
                console.log(`       Attempt: ${job.attempts}/${job.maxAttempts}`);
            });
            console.log('');
        }

        // Show recent failed jobs
        if (failed > 0) {
            console.log('❌ Recent Failed Jobs (up to 5):');
            const failedJobs = await CheckoutJob.find({ status: 'failed' })
                .sort({ processedAt: -1 })
                .limit(5)
                .populate('customerId', 'username email')
                .lean();

            failedJobs.forEach((job, index) => {
                console.log(`\n   [${index + 1}] Job ID: ${job._id}`);
                console.log(`       Customer: ${job.customerId?.username || 'N/A'}`);
                console.log(`       Transaction: ${job.checkoutTransactionId}`);
                console.log(`       Error: ${job.error?.message || 'Unknown'}`);
                console.log(`       Attempts: ${job.attempts}/${job.maxAttempts}`);
                console.log(`       Failed At: ${job.processedAt?.toISOString() || 'N/A'}`);
            });
            console.log('');
        }

        // Show performance stats for completed jobs
        if (completed > 0) {
            console.log('📈 Performance Stats (Last 100 Completed Jobs):');
            const completedJobs = await CheckoutJob.find({ status: 'completed' })
                .sort({ completedAt: -1 })
                .limit(100)
                .lean();

            const processingTimes = completedJobs
                .filter(j => j.startedAt && j.completedAt)
                .map(j => j.completedAt.getTime() - j.startedAt.getTime());

            if (processingTimes.length > 0) {
                const avgTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
                const minTime = Math.min(...processingTimes);
                const maxTime = Math.max(...processingTimes);

                console.log(`   Average Processing Time: ${Math.round(avgTime)}ms`);
                console.log(`   Min Processing Time: ${Math.round(minTime)}ms`);
                console.log(`   Max Processing Time: ${Math.round(maxTime)}ms`);
            }
            console.log('');
        }

        // Check for stale jobs
        const staleThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes
        const staleJobs = await CheckoutJob.countDocuments({
            status: 'processing',
            startedAt: { $lt: staleThreshold }
        });

        if (staleJobs > 0) {
            console.log(`⚠️  Warning: ${staleJobs} stale job(s) detected (processing for >5 minutes)`);
            console.log('   These may need to be reset or investigated.');
            console.log('');
        }

        console.log('✅ Job queue health check complete\n');

        // Close connection
        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error checking job status:', error.message);
        await mongoose.connection.close();
        process.exit(1);
    }
}

checkJobStatus();
