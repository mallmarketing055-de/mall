# User Jobs Dashboard Feature

## Overview

This feature allows administrators to view checkout job status and history for any user in the system. It provides a complete view of background job processing for checkout operations.

## Features Implemented

### Backend

#### 1. Dashboard Controller (`controller/dashboardController.js`)

**Endpoints:**

- **`GET /api/dashboard/user-jobs/:userId`**
  - Get all checkout jobs for a specific user
  - Returns job history, status summary, and detailed information
  - Requires authentication

- **`GET /api/dashboard/jobs-stats`**
  - Get overall system statistics for all checkout jobs
  - Includes average processing time and recent failures
  - Admin only

**Response Format:**
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
      "id": "...",
      "transactionId": "...",
      "transactionReference": "TXN-001",
      "transactionAmount": 1000,
      "status": "completed",
      "attempts": 1,
      "maxAttempts": 3,
      "payload": {...},
      "createdAt": "2025-12-21T...",
      "completedAt": "2025-12-21T..."
    }
  ]
}
```

#### 2. Dashboard Routes (`routes/dashboardRoutes.js`)

- Registered at `/api/dashboard`
- Protected with JWT authentication
- All routes require valid admin token

### Frontend

#### 1. User Jobs Dashboard Component (`admin-dashboard/src/components/UserJobsDashboard.js`)

**Features:**

- **Search by User ID**: Enter customer ID to fetch their jobs
- **Summary Cards**: Visual summary of job counts by status
- **Job History Table**: Detailed table with:
  - Transaction reference and ID
  - Job status with color-coded badges
  - Attempt count
  - Created and completed timestamps
  - View details button

- **Loading States**: Spinner while fetching data
- **Error Handling**: Clear error messages
- **Empty States**: Helpful messages when no data

**Component Structure:**

```javascript
const UserJobsDashboard = () => {
  // State management
  const [userId, setUserId] = useState('');
  const [jobsData, setJobsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch data from backend
  const fetchUserJobs = async (customerId) => {
    // API call to /api/dashboard/user-jobs/:userId
  };

  // Render UI with cards and table
};
```

#### 2. Styling (`admin-dashboard/src/components/UserJobsDashboard.css`)

**Design Features:**

- **Modern Card Layout**: Summary cards with hover effects
- **Color-Coded Status**: Visual distinction for each job status
  - Pending: Yellow (#f39c12)
  - Processing: Blue (#3498db)
  - Completed: Green (#27ae60)
  - Failed: Red (#e74c3c)

- **Responsive Design**: Works on all screen sizes
- **Clean Table**: Easy to read job history
- **Smooth Animations**: Loading spinner and hover effects

#### 3. Routing

- **Route**: `/user-jobs`
- **Protected**: Requires authentication
- **Navigation**: Added to sidebar menu with clipboard icon

## Installation & Setup

### Backend

1. **Routes are already registered** in `app.js`:
   ```javascript
   app.use('/api/dashboard', dashboardRoutes);
   ```

2. **No database migrations needed** - uses existing CheckoutJob collection

### Frontend

1. **Component is registered** in `App.js`:
   ```javascript
   <Route path="/user-jobs" element={
     <ProtectedRoute>
       <UserJobsDashboard />
     </ProtectedRoute>
   } />
   ```

2. **Navigation added** to Layout.js sidebar

## Usage

### For Administrators

1. **Navigate to User Jobs**:
   - Click "User Jobs" in the sidebar

2. **Search for User**:
   - Enter customer ID in the search field
   - Click "Search Jobs"

3. **View Results**:
   - See summary cards showing job counts
   - Browse job history table
   - Click "View" button for detailed job information

### API Usage

**Get User Jobs:**
```bash
curl -X GET \
  http://localhost:3000/api/dashboard/user-jobs/63a5f123abc \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get System Stats:**
```bash
curl -X GET \
  http://localhost:3000/api/dashboard/jobs-stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Data Flow

```
User enters ID in Frontend
        ↓
Frontend calls /api/dashboard/user-jobs/:userId
        ↓
Backend queries CheckoutJob collection
        ↓
Returns jobs with status summary
        ↓
Frontend displays cards and table
```

## Status Meanings

| Status | Description |
|--------|-------------|
| **Pending** | Job created, waiting for worker to process |
| **Processing** | Worker is currently processing this job |
| **Completed** | Job successfully processed, rewards distributed |
| **Failed** | Job failed after max attempts (3) |

## Error Handling

### Backend

- **400**: Invalid user ID
- **404**: User not found
- **500**: Server error

### Frontend

- **Network errors**: Displays error message
- **No results**: Shows "No jobs found" message
- **Invalid input**: Prompts for valid user ID

## Monitoring

### Admin Dashboard View

The User Jobs Dashboard provides:

- **Quick Overview**: Total jobs at a glance
- **Status Distribution**: How many jobs in each state
- **Recent Activity**: Latest jobs first
- **Failure Tracking**: See failed jobs and retry attempts

### System Stats Endpoint

For overall monitoring, use `/api/dashboard/jobs-stats`:

```json
{
  "stats": {
    "total": 1000,
    "pending": 5,
    "processing": 2,
    "completed": 980,
    "failed": 13,
    "avgProcessingTime": 487
  },
  "recentFailedJobs": [...]
}
```

## Future Enhancements

Potential additions:

1. **Real-time Updates**: WebSocket for live job status
2. **Filters**: Filter by date range, status
3. **Export**: Download job history as CSV
4. **Retry Button**: Manually retry failed jobs
5. **Charts**: Visual graphs of job trends
6. **Job Details Modal**: Full job payload in modal instead of alert

## Files Created/Modified

### Backend
- ✅ `controller/dashboardController.js` (new)
- ✅ `routes/dashboardRoutes.js` (new)
- ✅ `app.js` (modified - added route registration)

### Frontend
- ✅ `admin-dashboard/src/components/UserJobsDashboard.js` (new)
- ✅ `admin-dashboard/src/components/UserJobsDashboard.css` (new)
- ✅ `admin-dashboard/src/App.js` (modified - added route)
- ✅ `admin-dashboard/src/components/Layout.js` (modified - added menu item)

## Testing

### Backend Testing

```bash
# Test user jobs endpoint
curl http://localhost:3000/api/dashboard/user-jobs/USER_ID \
  -H "Authorization: Bearer TOKEN"

# Test stats endpoint
curl http://localhost:3000/api/dashboard/jobs-stats \
  -H "Authorization: Bearer TOKEN"
```

### Frontend Testing

1. Start the app: `npm start`
2. Login as admin
3. Navigate to "User Jobs" in sidebar
4. Enter a valid customer ID
5. Verify:
   - Summary cards show correct counts
   - Table displays jobs
   - Status badges have correct colors
   - Dates are formatted properly

## Troubleshooting

### "Failed to fetch user jobs"

- Check backend is running
- Verify authentication token is valid
- Check CORS settings in `app.js`

### No jobs showing

- Verify the customer ID is correct
- Check if customer has made any checkouts
- Look for jobs in MongoDB: `db.checkoutjobs.find({ customerId: ObjectId('...') })`

### Styling issues

- Clear browser cache
- Check CSS file is imported in component
- Verify no CSS conflicts with existing styles

---

**Status**: ✅ Feature Complete  
**Backend**: Ready  
**Frontend**: Ready  
**Documentation**: Complete  
**Testing**: Manual testing recommended
