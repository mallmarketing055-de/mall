# Deployment Checklist

## ✅ Pre-Deployment

### Code Review
- [ ] Review refactored `checkout` function in `controller/cartController.js`
- [ ] Verify `distributeTreePoints` logic in `services/checkoutProcessor.js`
- [ ] Check queue configuration in `services/queueConfig.js`
- [ ] Review worker setup in `services/checkoutWorker.js`

### Dependencies
- [ ] Run `npm install` to ensure Bull is installed
- [ ] Verify package.json includes `"bull": "^4.16.5"`

### Redis Setup
- [ ] Install Redis server (if not already installed)
- [ ] Test Redis connection: `redis-cli ping` → Should return `PONG`
- [ ] Configure Redis for production (persistence, password, etc.)

### Environment Variables
- [ ] Set `REDIS_HOST` (default: 127.0.0.1)
- [ ] Set `REDIS_PORT` (default: 6379)
- [ ] Set `REDIS_PASSWORD` (if required)

## 🧪 Testing

### Local Testing
- [ ] Start Redis: `redis-server`
- [ ] Start worker: `npm run worker`
- [ ] Start API: `node app.js`
- [ ] Test checkout with real cart
- [ ] Verify immediate response (~150ms)
- [ ] Verify background processing completes
- [ ] Check queue status: `node services/queueStatus.js`

### Verify Database Updates
- [ ] Check Customer wallet deduction (immediate)
- [ ] Check Transaction created (immediate)
- [ ] Check Cart cleared (immediate)
- [ ] Check tree rewards distributed (background)
- [ ] Check level upgrades applied (background)
- [ ] Check all transactions created (background)

### Error Scenarios
- [ ] Test with Redis offline → Should log error but not fail checkout
- [ ] Test with worker offline → Jobs should queue up
- [ ] Test with invalid customer → Should handle gracefully
- [ ] Test with insufficient balance → Should reject properly

## 🚀 Production Deployment

### Infrastructure
- [ ] Set up Redis server (managed service recommended)
  - AWS ElastiCache
  - Redis Labs
  - Azure Cache for Redis
- [ ] Configure Redis for high availability
- [ ] Set up monitoring for Redis

### Application Deployment
- [ ] Deploy updated code to production
- [ ] Install PM2 globally: `npm install -g pm2`
- [ ] Start API with PM2: `pm2 start app.js --name mall-api`
- [ ] Start worker with PM2: `pm2 start services/checkoutWorker.js --name checkout-worker`
- [ ] Save PM2 configuration: `pm2 save`
- [ ] Enable PM2 startup: `pm2 startup`

### Scaling Workers
- [ ] Determine worker count based on load
- [ ] Scale workers: `pm2 scale checkout-worker +2`
- [ ] Monitor queue metrics

### Monitoring Setup
- [ ] Set up Bull Board or Arena for queue monitoring
- [ ] Configure alerts for:
  - Redis connection failures
  - Worker crashes
  - Queue buildup (>100 jobs)
  - Failed jobs (>10)
- [ ] Set up logging aggregation (CloudWatch, Datadog, etc.)

## 📊 Performance Verification

### Benchmarks
- [ ] Measure checkout response time (target: <200ms)
- [ ] Measure background job completion (target: <1s)
- [ ] Load test with concurrent checkouts
- [ ] Verify queue doesn't build up under load

### Metrics to Track
- [ ] Average checkout response time
- [ ] P95/P99 checkout response time
- [ ] Queue wait time
- [ ] Job processing time
- [ ] Failed job rate
- [ ] Worker CPU/memory usage

## 🔐 Security

- [ ] Secure Redis with password authentication
- [ ] Use Redis over TLS in production
- [ ] Limit Redis network access (firewall rules)
- [ ] Review queue job data (no sensitive info logged)
- [ ] Ensure worker logs don't expose customer data

## 📚 Documentation

- [ ] Update API documentation with new response format
- [ ] Document Redis setup for team
- [ ] Document worker deployment process
- [ ] Document monitoring procedures
- [ ] Document troubleshooting steps

## 🔄 Rollback Plan

### If Issues Occur
- [ ] Keep old code version available
- [ ] Document rollback steps:
  1. Stop workers: `pm2 stop checkout-worker`
  2. Deploy old code
  3. Restart API: `pm2 restart mall-api`
  4. Process pending jobs manually or with script

### Data Integrity
- [ ] Verify no partial checkouts (transaction exists, no rewards)
- [ ] Create script to reprocess failed jobs if needed
- [ ] Document manual intervention procedures

## 🎯 Post-Deployment

### Immediate (Day 1)
- [ ] Monitor checkout API response times
- [ ] Monitor worker logs for errors
- [ ] Monitor queue length
- [ ] Monitor Redis CPU/memory
- [ ] Check for failed jobs

### First Week
- [ ] Analyze performance metrics
- [ ] Review customer feedback
- [ ] Check for any edge cases
- [ ] Tune worker count if needed
- [ ] Review and address any failed jobs

### Ongoing
- [ ] Weekly queue health check
- [ ] Monthly performance review
- [ ] Scale workers based on traffic patterns
- [ ] Optimize job processing if needed

## 📞 Support Contacts

### Team Responsibilities
- [ ] Assign on-call for checkout issues
- [ ] Document escalation process
- [ ] Create runbook for common issues

### Quick Commands
```bash
# Check queue status
node services/queueStatus.js

# View worker logs
pm2 logs checkout-worker

# Restart worker
pm2 restart checkout-worker

# Scale workers
pm2 scale checkout-worker 5

# Check Redis
redis-cli ping
redis-cli info stats
```

## ✨ Optional Enhancements

### Future Improvements
- [ ] Add Bull Board UI for visual monitoring
- [ ] Implement job priority based on customer tier
- [ ] Add webhook to notify customers when rewards processed
- [ ] Implement job scheduling for off-peak processing
- [ ] Add Prometheus metrics for Grafana dashboards
- [ ] Implement circuit breaker for Redis failures

### Performance Optimizations
- [ ] Batch database operations in processor
- [ ] Cache frequently accessed customer data
- [ ] Implement connection pooling
- [ ] Add Redis cluster for high availability

---

## Sign-Off

- [ ] Developer tested and verified
- [ ] Code reviewed by peer
- [ ] QA tested end-to-end
- [ ] DevOps reviewed infrastructure
- [ ] Product owner approved
- [ ] Documentation complete
- [ ] Ready for production ✅

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Verified By**: _______________
