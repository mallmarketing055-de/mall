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

module.exports = router;
