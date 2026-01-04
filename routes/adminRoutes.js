const express = require('express');
const router = express.Router();
const adminController = require('../controller/adminController');
const { validateAdminSignup, validateAdminLogin } = require('../validation/signup');
const authMiddleware = require('../middelwares/authorization');

// Public Routes

// Admin Registration/Signup
router.post('/signup', validateAdminSignup(), adminController.signup);

// Admin Login/Signin
router.post('/signin', validateAdminLogin(), adminController.signin);

// Protected Routes (Admin only)

// Get All Admins
router.get('/all',
  authMiddleware.auth,
  authMiddleware.isAdmin,
  adminController.getAllAdmins
);

// Get Admin by ID
router.get('/:id',
  authMiddleware.auth,
  authMiddleware.isAdmin,
  adminController.getAdminById
);

// Update Admin
router.put('/:id',
  authMiddleware.auth,
  authMiddleware.isAdmin,
  adminController.updateAdmin
);

// Delete Admin
router.delete('/:id',
  authMiddleware.auth,
  authMiddleware.isAdmin,
  adminController.deleteAdmin
);

// Add Points to User Wallet
router.post('/add-points',
  authMiddleware.auth,
  authMiddleware.isAdmin,
  adminController.addPointsToUser
);

// Get App Points Stats
router.get('/app-points-stats/overview',
  authMiddleware.auth,
  authMiddleware.isAdmin,
  adminController.getAppPointsStats
);

// Reward Settings Routes
const rewardSettingsController = require('../controller/rewardSettingsController');

router.get('/reward-settings/overview',
  authMiddleware.auth,
  authMiddleware.isAdmin,
  rewardSettingsController.getRewardSettings
);

router.post('/reward-settings/overview',
  authMiddleware.auth,
  authMiddleware.isAdmin,
  rewardSettingsController.updateRewardSettings
);

router.post('/reward-settings/add-gifts-balance',
  authMiddleware.auth,
  authMiddleware.isAdmin,
  rewardSettingsController.addManualPoolFunds
);

module.exports = router;


