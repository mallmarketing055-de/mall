const express = require('express');
const router = express.Router();
const transactionController = require('../controller/transactionController');
const { validateTransaction } = require('../validation/signup');
const authMiddleware = require('../middelwares/authorization');

// All transaction routes require admin authentication
router.use(authMiddleware.auth);
router.use(authMiddleware.isAdmin);

// Get All Transactions
router.get('/', transactionController.getAllTransactions);

// Get Transaction Statistics (must be before /:id route)
router.get('/stats', transactionController.getTransactionStats);

// Export Transactions
router.get('/export/csv', transactionController.exportTransactions);

// Get User Transactions
router.get('/user/:userId', transactionController.getUserTransactions);

// Get Transaction by ID (must be after specific routes)
router.get('/:id', transactionController.getTransactionById);

// Create Transaction
router.post('/', validateTransaction(), transactionController.createTransaction);

// Update Transaction Status
router.put('/:id/status', transactionController.updateTransactionStatus);

module.exports = router;
