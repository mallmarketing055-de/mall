const Queue = require('bull');

// Redis connection configuration
// Default: localhost:6379 (typical for local dev)
// For production, set REDIS_URL in environment variables
const redisConfig = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    // Add retry strategy for connection failures
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
};

// Create checkout rewards queue
const checkoutRewardsQueue = new Queue('checkout-rewards', {
    redis: redisConfig,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000
        },
        removeOnComplete: true,
        removeOnFail: false
    }
});

// Queue event listeners for monitoring
checkoutRewardsQueue.on('failed', (job, err) => {
    console.error(`[Queue] Job ${job.id} failed:`, err.message);
});

checkoutRewardsQueue.on('completed', (job) => {
    console.log(`[Queue] Job ${job.id} completed successfully`);
});

checkoutRewardsQueue.on('error', (error) => {
    console.error('[Queue] Queue error:', error);
});

module.exports = {
    checkoutRewardsQueue
};
