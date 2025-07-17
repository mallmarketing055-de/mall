const express = require('express');
const router = express.Router();
const customerController = require('../controller/customerController');
const { validatePostUser, validateLogin, validateUpdateProfile } = require('../validation/signup');
const authMiddleware = require('../middelwares/authorization');
const { uploadProfilePicture, handleUploadError } = require('../middelwares/fileUpload');

// Customer Registration (with optional profile picture upload)
router.post('/signup',
  uploadProfilePicture,
  handleUploadError,
  validatePostUser(),
  customerController.signup
);

// Customer Login
router.post('/signin', validateLogin(), customerController.login);

// Get Customer Profile (Protected Route)
router.get('/profile', authMiddleware.auth, customerController.getProfile);

// Update Customer Profile (Protected Route)
router.put('/profile',
  authMiddleware.auth,
  validateUpdateProfile(),
  customerController.updateProfile
);

// Update Profile Picture (Protected Route)
router.put('/profile/picture',
  authMiddleware.auth,
  uploadProfilePicture,
  handleUploadError,
  customerController.updateProfilePicture
);

// Admin Routes (Protected)

// Get All Customers (Admin only)
router.get('/all',
  authMiddleware.auth,
  authMiddleware.isAdmin,
  customerController.getAllCustomers
);

// Get Customer Stats (Admin only)
router.get('/stats',
  authMiddleware.auth,
  authMiddleware.isAdmin,
  customerController.getCustomerStats
);

// Get Customer by ID (Admin only)
router.get('/admin/:id',
  authMiddleware.auth,
  authMiddleware.isAdmin,
  customerController.getCustomerById
);

// Get Customer by ID (Alternative route for frontend compatibility)
router.get('/:id',
  authMiddleware.auth,
  authMiddleware.isAdmin,
  customerController.getCustomerById
);

// Delete Customer (Admin only)
router.delete('/:id',
  authMiddleware.auth,
  authMiddleware.isAdmin,
  customerController.deleteCustomer
);

// Get Customer Statistics (Admin only)
router.get('/stats/overview',
  authMiddleware.auth,
  authMiddleware.isAdmin,
  customerController.getCustomerStats
);

module.exports = router;
