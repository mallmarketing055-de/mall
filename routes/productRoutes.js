const express = require('express');
const router = express.Router();
const productController = require('../controller/productController');
const { validateProduct } = require('../validation/signup');
const authMiddleware = require('../middelwares/authorization');

// Public Routes (for customers to view products)

// Get All Products
router.get('/', productController.getAllProducts);

// Get Product by ID
router.get('/:id', productController.getProductById);

// Get Product Categories
router.get('/categories/list', productController.getCategories);

// Admin Routes (Protected)

// Create Product
router.post('/', 
  authMiddleware.auth, 
  authMiddleware.isAdmin, 
  validateProduct(), 
  productController.createProduct
);

// Update Product
router.put('/:id', 
  authMiddleware.auth, 
  authMiddleware.isAdmin, 
  productController.updateProduct
);

// Delete Product
router.delete('/:id', 
  authMiddleware.auth, 
  authMiddleware.isAdmin, 
  productController.deleteProduct
);

// Get Product Statistics
router.get('/stats/overview', 
  authMiddleware.auth, 
  authMiddleware.isAdmin, 
  productController.getProductStats
);

module.exports = router;
