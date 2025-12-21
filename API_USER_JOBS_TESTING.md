# User Jobs API - Testing Guide

## Endpoint Information

**Base URL**: `http://localhost:3000` (or your production URL)

**Route**: `GET /api/dashboard/user-jobs/:customerId`

**Authentication**: Required (JWT Token + Admin privileges)

---

## API Specification

### Request

**Method**: GET  
**Path**: `/api/dashboard/user-jobs/:customerId`  
**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Path Parameters**:
- `customerId` (string, required) - The MongoDB ObjectId of the customer

### Response

**Success Response (200 OK)**:
```json
{
  "success": true,
  "totalJobs": 10,
  "statusSummary": {
    "pending": 0,
    "processing": 0,
    "completed": 9,
    "failed": 1
  },
  "jobs": [
    {
      "id": "63a5f123abc...",
      "transactionId": "63a5f456def...",
      "transactionReference": "TXN-20251221-001",
      "transactionAmount": 1000,
      "status": "completed",
      "attempts": 1,
      "maxAttempts": 3,
      "payload": {
        "treePointsShare": 35,
        "appPointsShare": 50,
        "giftsPointsShare": 15,
        "totalRewardPoints": 100
      },
      "error": null,
      "createdAt": "2025-12-21T15:30:00.000Z",
      "startedAt": "2025-12-21T15:30:02.000Z",
      "completedAt": "2025-12-21T15:30:03.000Z",
      "processedAt": "2025-12-21T15:30:03.000Z"
    }
    // ... more jobs
  ]
}
```

**No Jobs Found (200 OK)**:
```json
{
  "success": true,
  "totalJobs": 0,
  "statusSummary": {
    "pending": 0,
    "processing": 0,
    "completed": 0,
    "failed": 0
  },
  "jobs": []
}
```

**Error Response (400 Bad Request)**:
```json
{
  "success": false,
  "message": "Customer ID is required"
}
```

**Error Response (500 Internal Server Error)**:
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details..."
}
```

---

## Testing with cURL

### 1. Get Auth Token First

```bash
# Login as admin
curl -X POST http://localhost:3000/api/Admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_password"
  }'
```

Save the token from the response.

### 2. Test User Jobs Endpoint

```bash
# Replace YOUR_TOKEN and CUSTOMER_ID
curl -X GET http://localhost:3000/api/dashboard/user-jobs/63a5f123abc456def789 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Testing with Postman

### Setup

1. **Create New Request**:
   - Method: `GET`
   - URL: `http://localhost:3000/api/dashboard/user-jobs/{{customerId}}`

2. **Set Headers**:
   ```
   Authorization: Bearer {{token}}
   ```

3. **Set Path Variable**:
   - Key: `customerId`
   - Value: `63a5f123abc456def789` (use real customer ID)

### Expected Results

**Scenario 1: Customer with Jobs**
- Status: `200 OK`
- Response includes `totalJobs > 0`
- `jobs` array contains job objects
- `statusSummary` shows counts

**Scenario 2: Customer with No Jobs**
- Status: `200 OK`
- `totalJobs = 0`
- `jobs = []`
- All status counts are 0

**Scenario 3: Invalid Customer ID**
- Status: `400 Bad Request`
- Error message about invalid ID

**Scenario 4: No Auth Token**
- Status: `401 Unauthorized`
- Authentication error

---

## Testing with Frontend

The frontend component already handles this endpoint:

```javascript
// From UserJobsDashboard.js
const response = await axios.get(
  `/api/dashboard/user-jobs/${customerId}`,
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);
```

### Frontend Testing Steps

1. Start backend: `node app.js`
2. Start frontend: `cd admin-dashboard && npm start`
3. Login as admin
4. Navigate to "User Jobs" in sidebar
5. Enter a valid customer ID
6. Click "Search Jobs"
7. Verify:
   - Summary cards show correct counts
   - Table displays jobs
   - All data matches backend response

---

## Database Query

To find a valid customer ID for testing:

```javascript
// In MongoDB shell or Compass
db.customers.findOne({}, { _id: 1 })
// Use the _id from this result
```

Or find customers with checkout jobs:

```javascript
db.checkoutjobs.findOne({}, { customerId: 1 })
// Use the customerId from this result
```

---

## Common Issues & Solutions

### Issue 1: "Customer ID is required"
**Cause**: Missing or empty customerId parameter  
**Solution**: Ensure you're passing a valid ObjectId in the URL

### Issue 2: 401 Unauthorized
**Cause**: Missing or invalid authentication token  
**Solution**: Login first and use the token from login response

### Issue 3: 403 Forbidden
**Cause**: User is not an admin  
**Solution**: Use admin account credentials

### Issue 4: Empty jobs array
**Cause**: Customer has no checkout jobs in database  
**Solution**: This is normal - try a different customer ID or create a test checkout

### Issue 5: Transaction data is null
**Cause**: Transaction was deleted or doesn't exist  
**Solution**: This is handled - shows "N/A" for missing data

---

## Verification Checklist

- [ ] Backend server is running
- [ ] Dashboard route is registered in app.js
- [ ] Auth middleware is working
- [ ] MongoDB connection is active
- [ ] CheckoutJob model is accessible
- [ ] Transaction population works
- [ ] Frontend can call the endpoint
- [ ] Auth token is passed correctly
- [ ] Response format matches spec
- [ ] Error handling works
- [ ] Empty state works (no jobs)

---

## Example Test Scenarios

### Test Scenario 1: Success Path

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/Admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  | jq -r '.token')

# 2. Get user jobs
curl -X GET http://localhost:3000/api/dashboard/user-jobs/63a5f123abc \
  -H "Authorization: Bearer $TOKEN" \
  | jq
```

### Test Scenario 2: No Jobs

```bash
# Use a new customer ID that has no checkouts
curl -X GET http://localhost:3000/api/dashboard/user-jobs/NEW_CUSTOMER_ID \
  -H "Authorization: Bearer $TOKEN" \
  | jq
```

---

## Production Deployment

When deploying to production:

1. **Update CORS**: Ensure frontend domain is in allowed origins
   ```javascript
   // In app.js
   const allowedOrigins = [
     'http://localhost:3001',
     'https://your-frontend-domain.com'
   ];
   ```

2. **Environment Variables**: Use proper MongoDB connection string
   ```bash
   MONGO_URL=mongodb+srv://...
   ```

3. **Security**: Ensure auth middleware is properly configured
   
4. **Logging**: Monitor endpoint usage and errors

---

**Endpoint Status**: ✅ Ready  
**Authentication**: ✅ Required  
**Frontend Integration**: ✅ Complete  
**Testing**: Manual testing recommended
