const express = require('express');
const router = express.Router();
const contactController = require('../controller/contactController');
const { validateContactForm } = require('../validation/signup');
const authMiddleware = require('../middelwares/authorization');

// Public Routes

// Submit Contact Form (Public - No authentication required)
router.post('/submit', validateContactForm(), contactController.submitContact);

// Admin Routes (Protected)

// Get All Contact Messages (Admin only)
router.get('/messages', 
  authMiddleware.auth, 
  authMiddleware.isAdmin, 
  contactController.getContactMessages
);

// Get Single Contact Message (Admin only)
router.get('/messages/:id', 
  authMiddleware.auth, 
  authMiddleware.isAdmin, 
  contactController.getContactById
);

// Update Contact Status/Response (Admin only)
router.put('/messages/:id', 
  authMiddleware.auth, 
  authMiddleware.isAdmin, 
  contactController.updateContactStatus
);

// Get Contact Statistics (Admin only)
router.get('/stats', 
  authMiddleware.auth, 
  authMiddleware.isAdmin, 
  contactController.getContactStats
);

module.exports = router;
