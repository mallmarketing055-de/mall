# Quick Start Guide - MongoDB Queue System

## 🚀 Getting Started in 3 Steps

### 1. Start the Worker

```bash
npm run worker
```

**Expected Output:**
```
=====================================
  Checkout Worker (MongoDB Queue)
=====================================

[Worker] ✓ Connected to MongoDB
[Worker] Poll interval: 2000ms
[Worker] Stale job timeout: 5 minutes
[Worker] Started and listening for jobs...
```

### 2. Start the API

```bash
node app.js
```

### 3. Test It!

Make a checkout request and verify:

```bash
# Check job was created
node checkJobStatus.js
```

---

## ✅ System Requirements

- ✅ **MongoDB** - Already required (no change)
- ❌ **Redis** - NOT required (removed!)

---

## 📋 What Happens During Checkout

### Immediate (~150ms)
1. Wallet balance checked ✓
2. Payment deducted ✓
3. Purchase transaction created ✓
4. Cart cleared ✓
5. Job created in MongoDB ✓
6. **Client receives response** ✓

### Background (~500ms)
7. Worker picks up job
8. Tree levels upgraded
9. Points distributed to referrers
10. All reward transactions created
11. Job marked as completed

---

## 🔍 Monitoring

### Check Queue Status
```bash
node checkJobStatus.js
```

### View Worker Logs
```bash
# If using PM2
pm2 logs checkout-worker

# Or watch terminal output
```

### Query MongoDB Directly
```javascript
// MongoDB Shell or Compass
db.checkoutjobs.find({ status: 'pending' })
db.checkoutjobs.find({ status: 'failed' })
```

---

## 🛠️ Common Commands

| Command | Purpose |
|---------|---------|
| `npm run worker` | Start worker |
| `node checkJobStatus.js` | Check queue |
| `pm2 start checkoutWorker.js --name checkout-worker` | Start with PM2 |
| `pm2 scale checkout-worker 3` | Run 3 workers |
| `pm2 logs checkout-worker` | View logs |
| `pm2 restart checkout-worker` | Restart worker |

---

## 📊 Sample Job Document

```javascript
{
  _id: ObjectId("63a5f123abc..."),
  customerId: ObjectId("63a5f456def..."),
  checkoutTransactionId: ObjectId("63a5f789ghi..."),
  status: "pending",  // → processing → completed
  payload: {
    treePointsShare: 35.0,
    appPointsShare: 50.0,
    giftsPointsShare: 15.0,
    totalRewardPoints: 100.0
  },
  attempts: 0,
  maxAttempts: 3,
  createdAt: ISODate("2025-12-21T15:30:00Z")
}
```

---

## 🎯 API Response

```json
{
  "success": true,
  "message": "Checkout successful",
  "data": {
    "transactionId": "...",
    "cartTotal": 1000,
    "newWalletBalance": 4000,
    "rewards": {
      "status": "processing"
    },
    "note": "Tree rewards and level upgrades are being processed in the background"
  }
}
```

---

## 🚨 Troubleshooting

### Problem: Worker not processing jobs

**Solution:**
```bash
# 1. Check worker is running
pm2 list

# 2. Check MongoDB connection
node checkJobStatus.js

# 3. Restart worker
pm2 restart checkout-worker
```

### Problem: Jobs stuck in "pending"

**Solution:**
```bash
# Restart worker to reset stale jobs
pm2 restart checkout-worker
```

### Problem: Jobs failing repeatedly

**Solution:**
```bash
# Check worker logs for errors
pm2 logs checkout-worker

# Check failed jobs in MongoDB
node checkJobStatus.js
```

---

## 📈 Production Setup

```bash
# Install PM2
npm install -g pm2

# Start API
pm2 start app.js --name "mall-api"

# Start 3 workers
pm2 start checkoutWorker.js --name "checkout-worker" -i 3

# Save config
pm2 save

# Auto-start on boot
pm2 startup
```

---

## 🎉 Key Benefits

✅ **No Redis Required** - Uses MongoDB only  
✅ **Simple Setup** - Just start the worker  
✅ **Fast Checkout** - ~150ms response time  
✅ **Reliable** - Auto-retry on failure  
✅ **Scalable** - Add more workers easily  
✅ **Easy Monitoring** - MongoDB queries

---

## 📚 Full Documentation

- **`CHECKOUT_BACKGROUND_PROCESSING.md`** - Complete guide
- **`MIGRATION_BULL_TO_MONGODB.md`** - Migration from Redis
- **`REFACTORING_SUMMARY.md`** - Full summary

---

**That's it!** 🎊

You now have a MongoDB-based background job processing system with no Redis dependency.
