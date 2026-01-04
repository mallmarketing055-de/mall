# Gifts Points Pool - Quick Reference Guide

## For Administrators

### Viewing the Gifts Points Balance

1. Log in to the Admin Dashboard
2. Navigate to **Reward Settings** from the sidebar
3. The **Gifts Points Pool** card shows:
   - Current available balance
   - "Add Funds" button

### Adding Funds to the Pool

1. Click the **"Add Funds"** button on the Gifts Points Pool card
2. Enter the amount of points to add
3. Click **"Add Funds"** in the modal
4. The balance will update immediately

### Monitoring Signup Bonuses

When a user makes their first purchase:
- If the pool has sufficient balance → Bonus is granted
- If the pool is insufficient → Bonus is NOT granted (logged in worker console)

**Check the worker logs** for messages like:
```
✓ [Bonus] Signup Gift awarded: 50 points
💰 [Pool] Gifts Points Balance after deduction: 1450.00
```

Or warnings:
```
⚠️ [Warning] Insufficient Gifts Points Balance for signup bonus
💰 [Pool] Available: 25.00, Required: 50
⊘ Signup bonus NOT awarded
```

## For Developers

### Key Database Fields

**RewardSettings Collection**:
```javascript
{
  giftsPointsBalance: Number,  // Current pool balance
  signupPoints: {
    enabled: Boolean,
    amount: Number              // Fixed amount (not percentage)
  }
}
```

### Transaction Types

| Type | When Created | Amount | Description |
|------|--------------|--------|-------------|
| `gifts_reward` | Every checkout | 15% of total reward points | Added to pool |
| `signup_gifts_reward` | First purchase (if balance sufficient) | Fixed amount from settings | Deducted from pool |

### Helper Methods

```javascript
// Add to pool
await RewardSettings.addToGiftsBalance(amount);

// Deduct from pool (throws error if insufficient)
await RewardSettings.deductFromGiftsBalance(amount);

// Get current settings (includes balance)
const settings = await RewardSettings.getSettings();
console.log(settings.giftsPointsBalance);
```

### API Endpoints

**Get Settings** (includes balance):
```bash
GET /api/admin/reward-settings/overview
Authorization: Bearer <admin_token>
```

**Add Funds**:
```bash
POST /api/admin/reward-settings/add-gifts-balance
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "amount": 1000
}
```

## Common Scenarios

### Scenario 1: Initial Setup
**Problem**: New installation, balance is 0
**Solution**:
1. Calculate expected pool based on historical checkouts
2. Use "Add Funds" to initialize the balance
3. Monitor for a few days to ensure adequate funding

### Scenario 2: Pool Running Low
**Problem**: Balance approaching zero
**Solution**:
1. Add funds immediately via admin dashboard
2. Consider increasing the amount added per checkout
3. Review signup bonus amount (reduce if necessary)

### Scenario 3: Audit Trail
**Problem**: Need to verify all pool transactions
**Solution**:
Query the Transaction collection:
```javascript
// All deposits to pool
db.transactions.find({ type: 'gifts_reward' })

// All withdrawals from pool
db.transactions.find({ type: 'signup_gifts_reward' })
```

## Troubleshooting

### Issue: Signup bonuses not being granted
**Check**:
1. Is signup bonus enabled in settings?
2. Is the pool balance sufficient?
3. Check worker logs for error messages
4. Verify user is making their FIRST purchase

### Issue: Balance not updating in dashboard
**Solution**:
1. Refresh the page
2. Check browser console for errors
3. Verify API endpoint is accessible
4. Check admin authentication token

### Issue: Pool balance negative
**This should never happen!** The system prevents this.
If it occurs:
1. Check database directly
2. Review recent transactions
3. Restore from backup if necessary

## Best Practices

1. **Monitor Regularly**: Check pool balance weekly
2. **Maintain Buffer**: Keep balance at least 10x the signup bonus amount
3. **Track Trends**: Monitor how quickly the pool depletes
4. **Document Changes**: Log all manual fund additions
5. **Test First**: Use a test environment before changing signup amounts

## Formulas

**Expected Pool Growth per Checkout**:
```
Pool Increase = Total Reward Points × 0.15
```

**Expected Pool Depletion per New User**:
```
Pool Decrease = Signup Bonus Amount (fixed)
```

**Recommended Minimum Balance**:
```
Min Balance = Signup Bonus × Expected New Users per Week × 2
```

Example:
- Signup Bonus: 50 points
- Expected new users: 20/week
- Minimum balance: 50 × 20 × 2 = 2,000 points

---

**Last Updated**: January 4, 2026
