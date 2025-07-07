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

module.exports = router;
