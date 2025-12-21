/**
 * Queue Status Monitor
 * 
 * Quick script to check the status of the checkout rewards queue
 * Usage: node services/queueStatus.js
 */

const { checkoutRewardsQueue } = require('./queueConfig');

async function checkQueueStatus() {
    try {
        console.log('=== Checkout Rewards Queue Status ===\n');

        // Get job counts
        const waiting = await checkoutRewardsQueue.getWaitingCount();
        const active = await checkoutRewardsQueue.getActiveCount();
        const completed = await checkoutRewardsQueue.getCompletedCount();
        const failed = await checkoutRewardsQueue.getFailedCount();
        const delayed = await checkoutRewardsQueue.getDelayedCount();

        console.log(`📊 Job Counts:`);
        console.log(`   Waiting:   ${waiting}`);
        console.log(`   Active:    ${active}`);
        console.log(`   Completed: ${completed}`);
        console.log(`   Failed:    ${failed}`);
        console.log(`   Delayed:   ${delayed}`);
        console.log('');

        // Get recent failed jobs
        if (failed > 0) {
            console.log('❌ Recent Failed Jobs:');
            const failedJobs = await checkoutRewardsQueue.getFailed(0, 5);

            failedJobs.forEach((job, index) => {
                console.log(`\n   [${index + 1}] Job ID: ${job.id}`);
                console.log(`       Customer: ${job.data.customerId}`);
                console.log(`       Transaction: ${job.data.checkoutTransactionId}`);
                console.log(`       Error: ${job.failedReason || 'Unknown'}`);
                console.log(`       Attempts: ${job.attemptsMade}/${job.opts.attempts}`);
            });
            console.log('');
        }

        // Get recent active jobs
        if (active > 0) {
            console.log('⚡ Active Jobs:');
            const activeJobs = await checkoutRewardsQueue.getActive(0, 5);

            activeJobs.forEach((job, index) => {
                console.log(`\n   [${index + 1}] Job ID: ${job.id}`);
                console.log(`       Customer: ${job.data.customerId}`);
                console.log(`       Transaction: ${job.data.checkoutTransactionId}`);
            });
            console.log('');
        }

        console.log('✅ Queue check complete\n');

        // Close queue connection
        await checkoutRewardsQueue.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error checking queue status:', error.message);
        process.exit(1);
    }
}

checkQueueStatus();
