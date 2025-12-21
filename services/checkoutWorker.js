/**
 * Checkout Rewards Worker
 * 
 * This worker listens to the checkout-rewards queue and processes
 * background jobs for tree level upgrades and reward distribution.
 * 
 * Run this worker separately: node services/checkoutWorker.js
 */

const { checkoutRewardsQueue } = require('./queueConfig');
const { processCheckoutRewards } = require('./checkoutProcessor');

// Register the job processor
checkoutRewardsQueue.process(async (job) => {
    return await processCheckoutRewards(job);
});

console.log('[Checkout Worker] Started and listening for jobs...');

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('[Checkout Worker] SIGTERM received, closing queue...');
    await checkoutRewardsQueue.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('[Checkout Worker] SIGINT received, closing queue...');
    await checkoutRewardsQueue.close();
    process.exit(0);
});
