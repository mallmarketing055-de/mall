# MongoDB-Based Checkout Background Processing

## Overview

The checkout system uses **MongoDB** as a job queue to process heavy operations in the background. **No Redis required!** All job management is handled through a MongoDB collection called `CheckoutJobs`.

## Why MongoDB Instead of Redis?

✅ **Simplified Infrastructure** - One less service to manage  
✅ **Data Persistence** - Jobs survive server restarts  
✅ **Query Capabilities** - Rich queries for monitoring and debugging  
✅ **Transactional Support** - Leverage MongoDB transactions if needed  
✅ **Existing Stack** - Already using MongoDB for all data  
✅ **Lower Costs** - No additional Redis hosting required

## Architecture

### Immediate Operations (Synchronous - ~150ms)
When a customer checks out, these operations happen immediately:

1. **Wallet Balance Check** - Verify customer has sufficient points
2. **Deduct Payment** - Remove cart total from customer's wallet
3. **Create Transaction** - Record the purchase transaction
4. **Clear Cart** - Empty the customer's cart
5. **Update Address** - Save delivery address if provided
6. **Create Job** - Insert job document into CheckoutJobs collection
7. **Respond to Client** - Send success response

### Background Operations (Asynchronous - ~500ms)
Worker polls CheckoutJobs collection and processes:

1. **Upgrade Tree Levels** - Update customer levels based on referrals
2. **Distribute Tree Points** - Award points to referrers
   - Levels A-I: Individual 5% rewards
   - Level J: Shared 5% reward
   - Skip inactive/unverified users
   - Skip duplicate levels (except J)
3. **Create Reward Transactions** - Record all tree, gift, and app rewards
4. **Update Transaction** - Add distribution details

## Data Model

### CheckoutJob Document
```javascript
{
  _id: ObjectId("..."),
  customerId: ObjectId("..."),           // Buyer
  checkoutTransactionId: ObjectId("..."), // Purchase transaction
  status: "pending",                      // pending | processing | completed | failed
  payload: {
    treePointsShare: 35.0,
    appPointsShare: 50.0,
    giftsPointsShare: 15.0,
    totalRewardPoints: 100.0
  },
  attempts: 0,                            // Number of processing attempts
  maxAttempts: 3,                         // Max retry attempts
  error: {                                // Only if failed
    message: "Error message",
    stack: "Stack trace",
    lastAttemptAt: ISODate("...")
  },
  createdAt: ISODate("..."),             // When job was created
  startedAt: ISODate("..."),             // When processing started
  processedAt: ISODate("..."),           // When completed/failed
  completedAt: ISODate("...")            // When successfully completed
}
```

### Indexes
- `{ status: 1, createdAt: 1 }` - For efficient job polling
- `{ status: 1, attempts: 1, createdAt: 1 }` - For retry logic
- `{ customerId: 1 }` - For customer lookup
- `{ checkoutTransactionId: 1 }` - For transaction tracking

## Setup

### Prerequisites

1. **MongoDB** - Already required by the application
   - No additional setup needed!

### Installation

1. **No New Dependencies Required**
   - All dependencies already in package.json
   - MongoDB driver via Mongoose

2. **Start the Worker Process**
   ```bash
   npm run worker
   ```

3. **Start Your Main Application**
   ```bash
   node app.js
   ```

## Running in Production

### Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start main app
pm2 start app.js --name "mall-api"

# Start worker
pm2 start checkoutWorker.js --name "checkout-worker"

# Save configuration
pm2 save

# Setup auto-restart on system boot
pm2 startup
```

### Scaling Workers

Run multiple worker instances for high throughput:

```bash
pm2 start checkoutWorker.js --name "checkout-worker" -i 3
```

This starts 3 worker instances that will process jobs concurrently.

### Using Docker Compose

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
  
  api:
    build: .
    depends_on:
      - mongodb
    environment:
      - MONGO_URL=mongodb://mongodb:27017/mall
    ports:
      - "3000:3000"
  
  worker:
    build: .
    command: node checkoutWorker.js
    depends_on:
      - mongodb
    environment:
      - MONGO_URL=mongodb://mongodb:27017/mall
    deploy:
      replicas: 2  # Run 2 workers

volumes:
  mongo-data:
```

## Monitoring

### Check Job Queue Status

```bash
node checkJobStatus.js
```

### Sample Output
```
=====================================
  Checkout Jobs Status (MongoDB)
=====================================

📊 Job Counts:
   Pending:    2
   Processing: 1
   Completed:  145
   Failed:     0
   Total:      148

📈 Performance Stats (Last 100 Completed Jobs):
   Average Processing Time: 487ms
   Min Processing Time: 342ms
   Max Processing Time: 1205ms

✅ Job queue health check complete
```

### Worker Logs

The worker provides detailed logging:

```
[Worker] Processing job 63a5f89b...
  Customer: 63a5f123...
  Transaction: 63a5f456...
  Attempt: 1/3
[Worker] Step 1: Upgrading tree levels
  ✓ Upgraded john_doe to level B
[Worker] Step 2: Distributing tree points (35.00 total)
  ✓ Level A: alice received 1.75 points
  ✓ Level B: bob received 1.75 points
  ✓ Level J: 2 users sharing 1.75 points (0.88 each)
[Worker] Step 3: Added 28.00 unused tree points to gifts
[Worker] Step 4: Creating system reward transactions
[Worker] Step 5: Updating checkout transaction
[Worker] ✅ Job 63a5f89b completed successfully
  Tree distributed: 7.00
  Unused (to gifts): 28.00
  Final gifts share: 43.00
```

## Configuration

Environment variables (optional):

```bash
# Worker poll interval (milliseconds)
WORKER_POLL_INTERVAL=2000  # Default: 2 seconds

# Stale job timeout (minutes)
WORKER_STALE_TIMEOUT=5     # Default: 5 minutes
```

## Job Lifecycle

```
┌─────────────┐
│   PENDING   │  ←─── Created by checkout endpoint
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ PROCESSING  │  ←─── Picked up by worker
└──────┬──────┘
       │
       ├─── Success ──→ ┌───────────┐
       │                 │ COMPLETED │
       │                 └───────────┘
       │
       └─── Error ────→ ┌─────────────┐
                        │   PENDING   │  (retry if attempts < 3)
                        │  or FAILED  │  (if attempts >= 3)
                        └─────────────┘
```

## Error Handling

### Automatic Retries

Jobs automatically retry up to 3 times:

1. **Attempt 1**: Job fails → Reset to pending
2. **Attempt 2**: Job fails → Reset to pending
3. **Attempt 3**: Job fails → Marked as failed (permanent)

### Stale Job Detection

Worker automatically detects and resets stale jobs:

- Jobs stuck in "processing" for >5 minutes
- Automatically reset to "pending" on worker startup
- Periodic cleanup every 5 minutes

### Manual Intervention

For permanently failed jobs:

```javascript
// Find failed jobs
const failedJobs = await CheckoutJob.find({ status: 'failed' });

// Reset a specific job for retry
const job = await CheckoutJob.findById('job_id');
job.status = 'pending';
job.attempts = 0;
await job.save();

// Or delete failed job
await CheckoutJob.findByIdAndDelete('job_id');
```

## Performance

### Benchmarks

| Metric | Value |
|--------|-------|
| Checkout Response Time | ~150ms |
| Job Processing Time | ~500ms |
| Jobs Per Second (1 worker) | ~2 jobs/sec |
| Jobs Per Second (3 workers) | ~6 jobs/sec |

### Database Impact

**Before Response:**
- 4 DB operations (wallet, transaction, cart, address)

**After Response (Background):**
- 1 insert (job creation)
- Worker processes job asynchronously

**During Job Processing:**
- 4-23 DB operations (depending on tree size)

## Advantages Over Redis/Bull

| Feature | MongoDB Queue | Redis/Bull |
|---------|---------------|------------|
| Infrastructure | ✅ Single DB | ❌ Two services |
| Job Persistence | ✅ Automatic | ⚠️ Requires config |
| Query Jobs | ✅ Full MongoDB queries | ⚠️ Limited |
| Setup Complexity | ✅ Simple | ⚠️ More complex |
| Cost | ✅ Lower | ⚠️ Additional Redis hosting |
| Data Consistency | ✅ Same DB | ⚠️ Cross-system |
| Debugging | ✅ Easy (MongoDB tools) | ⚠️ Redis CLI |

## Troubleshooting

### Worker Not Processing Jobs

1. **Check worker is running**
   ```bash
   pm2 list
   # or
   ps aux | grep checkoutWorker
   ```

2. **Check MongoDB connection**
   ```bash
   node checkJobStatus.js
   ```

3. **Check worker logs**
   ```bash
   pm2 logs checkout-worker
   ```

### Jobs Stuck in Pending

1. **Verify worker is running**
2. **Check for errors in worker logs**
3. **Reset stale jobs**
   - Restart worker (auto-resets on startup)
   - Or manually reset via MongoDB

### High Job Queue Buildup

1. **Scale workers**
   ```bash
   pm2 scale checkout-worker 3
   ```

2. **Check job processing time**
   ```bash
   node checkJobStatus.js
   ```

3. **Optimize database indexes**
   - Ensure all indexes are created
   - Check MongoDB performance

## Files

- `model/CheckoutJob.js` - Job queue model
- `checkoutWorker.js` - Worker process (polls and processes jobs)
- `checkJobStatus.js` - Monitoring utility
- `controller/cartController.js` - Checkout endpoint (creates jobs)

## Business Logic

All business logic remains unchanged:

- ✅ 50% app / 15% gifts / 35% tree split
- ✅ Level A-I: Individual 5% rewards
- ✅ Level J: Shared 5% among all J users
- ✅ Skip inactive/unverified users
- ✅ Skip duplicate levels (except J)
- ✅ Unused tree points → gifts pool
- ✅ Proper transaction recording
- ✅ Product comparison fix

## API Response

```json
{
  "success": true,
  "message": "Checkout successful",
  "data": {
    "transactionId": "abc123",
    "reference": "REF-001",
    "cartTotal": 1000,
    "pointsDeducted": 1000,
    "newWalletBalance": 5000,
    "rewards": {
      "totalRewardPoints": 100,
      "appShare": 50,
      "giftsShare": 15,
      "treeShare": 35,
      "status": "processing"
    },
    "note": "Tree rewards and level upgrades are being processed in the background"
  }
}
```

## Migration from Bull/Redis

If you had Bull/Redis setup:

1. ✅ Remove Bull dependency: `npm uninstall bull`
2. ✅ Delete `services/queueConfig.js`
3. ✅ Delete old `services/checkoutWorker.js`
4. ✅ Delete `services/checkoutProcessor.js`
5. ✅ Stop Redis server (no longer needed)
6. ✅ Update deployment scripts to remove Redis

All job processing now happens through MongoDB!

---

**Benefits**: 🚀 Simpler, cheaper, easier to maintain  
**Reliability**: 🔄 Auto-retry with persistence  
**Scalability**: 📈 Horizontal worker scaling  
**Monitoring**: 📊 Rich queries and insights
