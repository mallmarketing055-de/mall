const express = require('express');
const router = express.Router();
const cartController = require('../controller/cartController');
const { validateAddToCart, validateUpdateCart } = require('../validation/signup');
const authMiddleware = require('../middelwares/authorization');

// All cart routes require authentication
router.use(authMiddleware.auth);

// Add Item to Cart
router.post('/add', validateAddToCart(), cartController.addToCart);

// View Cart
router.get('/view', cartController.viewCart);

// Update Cart Item Quantity
router.put('/update', validateUpdateCart(), cartController.updateCart);

// Remove Item from Cart
router.delete('/remove/:productId', cartController.removeFromCart);

// Clear Cart
router.delete('/clear', cartController.clearCart);

module.exports = router;
