const { validationResult } = require('express-validator');
const CartModel = require('../model/Cart');
const CustomerModel = require('../model/Customers');

// Add Item to Cart
module.exports.addToCart = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Extract customer ID from JWT token
    const customerId = req.user.Customer_id || req.user.CustomerId || req.user.customer_id || req.user.customerId;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID not found in token',
        debug: req.user
      });
    }

    const { productId, productName, productNameArabic, price, quantity = 1, unit = 'نقطة', image } = req.body;

    // Find or create cart for customer
    let cart = await CartModel.findOne({ customerId });

    if (!cart) {
      cart = new CartModel({ customerId, items: [] });
    }

    // Prepare product data
    const productData = {
      productId,
      productName,
      productNameArabic,
      price,
      quantity,
      unit,
      image
    };

    // Add item to cart
    await cart.addItem(productData);

    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      data: {
        cart: {
          cartId: cart._id,
          totalItems: cart.totalItems,
          totalAmount: cart.totalAmount,
          items: cart.items,
          updatedAt: cart.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// View Cart
module.exports.viewCart = async (req, res) => {
  try {
    const customerId = req.user.Customer_id;

    // Find cart for customer
    const cart = await CartModel.findOne({ customerId });

    if (!cart || cart.items.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Cart is empty',
        data: {
          cart: {
            cartId: null,
            totalItems: 0,
            totalAmount: 0,
            items: [],
            deliveryAddress: null,
            status: 'active'
          }
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cart retrieved successfully',
      data: {
        cart: {
          cartId: cart._id,
          totalItems: cart.totalItems,
          totalAmount: cart.totalAmount,
          items: cart.items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            productNameArabic: item.productNameArabic,
            price: item.price,
            quantity: item.quantity,
            unit: item.unit,
            image: item.image,
            subtotal: item.price * item.quantity
          })),
          deliveryAddress: cart.deliveryAddress,
          status: cart.status,
          createdAt: cart.createdAt,
          updatedAt: cart.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('View cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update Cart Item
module.exports.updateCart = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const customerId = req.user.Customer_id;
    const { productId, quantity } = req.body;

    // Find cart for customer
    const cart = await CartModel.findOne({ customerId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Check if item exists in cart
    const itemExists = cart.items.some(item => item.productId === productId);
    if (!itemExists) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    // Update item quantity
    await cart.updateItem(productId, quantity);

    const action = quantity === 0 ? 'removed from' : 'updated in';

    res.status(200).json({
      success: true,
      message: `Item ${action} cart successfully`,
      data: {
        cart: {
          cartId: cart._id,
          totalItems: cart.totalItems,
          totalAmount: cart.totalAmount,
          items: cart.items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            productNameArabic: item.productNameArabic,
            price: item.price,
            quantity: item.quantity,
            unit: item.unit,
            image: item.image,
            subtotal: item.price * item.quantity
          })),
          updatedAt: cart.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Remove Item from Cart
module.exports.removeFromCart = async (req, res) => {
  try {
    const customerId = req.user.Customer_id;
    const { productId } = req.params;

    // Find cart for customer
    const cart = await CartModel.findOne({ customerId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Check if item exists in cart
    const itemExists = cart.items.some(item => item.productId === productId);
    if (!itemExists) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    // Remove item from cart
    await cart.removeItem(productId);

    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully',
      data: {
        cart: {
          cartId: cart._id,
          totalItems: cart.totalItems,
          totalAmount: cart.totalAmount,
          items: cart.items,
          updatedAt: cart.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Clear Cart
module.exports.clearCart = async (req, res) => {
  try {
    const customerId = req.user.Customer_id;

    // Find cart for customer
    const cart = await CartModel.findOne({ customerId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Clear cart
    await cart.clearCart();

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        cart: {
          cartId: cart._id,
          totalItems: 0,
          totalAmount: 0,
          items: [],
          updatedAt: cart.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports.checkout = async (req, res) => {
  try {
    const customerId = req.user.Customer_id;
    const deliveryAddress = req.body.deliveryAddress || null;

    // Find cart for customer
    const cart = await CartModel.findOne({ customerId });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty or not found'
      });
    }

    // ✅ Optionally update customer’s saved address
    await CustomerModel.findByIdAndUpdate(
      customerId,
      { $set: { deliveryAddress } },
      { new: true }
    );
    // Calculate reward points: 10 points per 1000 L.S
    const totalAmount = cart.totalAmount || 0;
    const earnedPoints = Math.floor(totalAmount / 1000) * 10;

    // Update customer points
    const customer = await CustomerModel.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    customer.points += earnedPoints;
    await customer.save();

    // Optionally: clear cart after checkout
    await cart.clearCart();

    res.status(200).json({
      success: true,
      message: 'Checkout successful',
      data: {
        totalAmount,
        earnedPoints,
        totalPoints: customer.points,
        cart: {
          cartId: cart._id,
          totalItems: 0,
          totalAmount: 0,
          items: []
        }
      }
    });

  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
