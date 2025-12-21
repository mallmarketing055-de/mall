const express = require('express');
const router = express.Router();
const dashboardController = require('../controller/dashboardController');
const authMiddleware = require('../middelwares/authorization');

// Get all checkout jobs for a specific user
router.get('/user-jobs/:customerId', authMiddleware.auth,
    authMiddleware.isAdmin, dashboardController.getUserJobs);

// Get overall checkout jobs statistics (admin only)
router.get('/jobs-stats', authMiddleware.auth,
    authMiddleware.isAdmin, dashboardController.getJobsStats);

module.exports = router;
