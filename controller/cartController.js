const { validationResult } = require('express-validator');
const CartModel = require('../model/Cart');
const CustomerModel = require('../model/Customers');
const ProductModel = require('../model/Product');


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

// module.exports.checkout = async (req, res) => {
//   try {
//     console.log('Checkout request body:', req.user);
//     const customerId = req.user.Customer_id;
//     const deliveryAddress = req.body.deliveryAddress || null;

//     // Find cart for customer
//     const cart = await CartModel.findOne({ customerId });

//     if (!cart || cart.items.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Cart is empty or not found'
//       });
//     }

//     // ✅ Optionally update customer’s saved address
//     await CustomerModel.findByIdAndUpdate(
//       customerId,
//       { $set: { deliveryAddress } },
//       { new: true }
//     );
//     // Calculate reward points: 10 points per 1000 L.S
//     const totalAmount = cart.totalAmount || 0;
//     const earnedPoints = Math.floor(totalAmount / 1000) * 10;

//     console.log(`Customer ${customerId} earned ${earnedPoints} points for spending ${totalAmount} L.S`);
//     // Update customer points
//     const customer = await CustomerModel.findById(customerId);
//     if (!customer) {
//       return res.status(404).json({
//         success: false,
//         message: 'Customer not found'
//       });
//     }

//     customer.points += earnedPoints;
//     await customer.save();

//     // Optionally: clear cart after checkout
//     await cart.clearCart();

//     res.status(200).json({
//       success: true,
//       message: 'Checkout successful',
//       data: {
//         totalAmount,
//         earnedPoints,
//         totalPoints: customer.points,
//         cart: {
//           cartId: cart._id,
//           totalItems: 0,
//           totalAmount: 0,
//           items: []
//         }
//       }
//     });

//   } catch (error) {
//     console.error('Checkout error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error.message
//     });
//   }
// };


module.exports.checkout = async (req, res) => {
  try {
    const customerId = req.user.Customer_id;
    const deliveryAddress = req.body.deliveryAddress || null;

    // Find cart
    const cart = await CartModel.findOne({ customerId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty or not found'
      });
    }

    // Get customer
    const checkoutCustomer = await CustomerModel.findById(customerId);
    if (!checkoutCustomer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // -------------------------
    // 1) CHECK WALLET BALANCE & DEDUCT PAYMENT
    // -------------------------
    const cartTotal = cart.totalAmount || 0;

    if (checkoutCustomer.points < cartTotal) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance',
        required: cartTotal,
        available: checkoutCustomer.points
      });
    }

    // Deduct payment from wallet
    checkoutCustomer.points -= cartTotal;

    // -------------------------
    // 2) CALCULATE REWARD POINTS
    // -------------------------
    const productIds = cart.items.map(i => i.productId);
    const products = await ProductModel.find({ _id: { $in: productIds } });

    let totalRewardPoints = 0;

    for (const item of cart.items) {
      const product = products.find(p => p._id.toString() === item.productId);
      if (product) {
        const productPoints = (product.percentage || 0) * item.quantity;
        totalRewardPoints += productPoints;
      }
    }

    // -------------------------
    // 3) SPLIT REWARD POINTS (50% / 15% / 35%)
    // -------------------------
    const appPointsShare = totalRewardPoints * 0.50;   // 50% for app
    const giftsPointsShare = totalRewardPoints * 0.15; // 15% for gifts
    let treePointsShare = totalRewardPoints * 0.35;    // 35% for tree distribution

    // -------------------------
    // 4) DISTRIBUTE TREE POINTS (35% pool)
    // -------------------------
    const treeDistributionLog = [];
    let remainingTreePoints = treePointsShare;
    let currentLevel = 0;

    // Give 10% of tree share to buyer
    const buyerReward = treePointsShare * 0.10;
    checkoutCustomer.points += buyerReward;
    remainingTreePoints -= buyerReward;

    treeDistributionLog.push({
      recipientId: checkoutCustomer._id,
      recipientUsername: checkoutCustomer.username,
      amount: buyerReward,
      level: currentLevel
    });

    // Traverse up the referral tree
    let currentParentId = checkoutCustomer.parentCustomer;

    while (currentParentId && remainingTreePoints > 0) {
      const parent = await CustomerModel.findById(currentParentId);
      if (!parent) break;

      currentLevel++;
      const parentReward = remainingTreePoints * 0.10; // 10% of remaining
      parent.points += parentReward;
      await parent.save();

      treeDistributionLog.push({
        recipientId: parent._id,
        recipientUsername: parent.username,
        amount: parentReward,
        level: currentLevel
      });

      remainingTreePoints -= parentReward;
      currentParentId = parent.parentCustomer;
    }

    // Save buyer with updated points
    await checkoutCustomer.save();

    // -------------------------
    // 5) CREATE TRANSACTION RECORD
    // -------------------------
    const TransactionModel = require('../model/Transaction');

    const transaction = new TransactionModel({
      customerId: checkoutCustomer._id,
      userName: checkoutCustomer.username,
      userEmail: checkoutCustomer.email,
      amount: cartTotal,
      type: 'purchase',
      status: 'completed',
      description: `Purchase - ${cart.items.length} item(s)`,
      paymentMethod: 'wallet',
      items: cart.items.map(item => ({
        productId: item.productId,
        productName: item.productName || item.productNameArabic,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity
      })),
      shippingAddress: {
        street: deliveryAddress || checkoutCustomer.Address
      },
      processedAt: new Date(),
      // Points tracking fields
      cartTotal: cartTotal,
      rewardPointsEarned: totalRewardPoints,
      appPointsShare: appPointsShare,
      giftsPointsShare: giftsPointsShare,
      treePointsShare: treePointsShare,
      treeDistribution: treeDistributionLog
    });

    await transaction.save();

    // -------------------------
    // 6) CLEAR CART
    // -------------------------
    await cart.clearCart();

    // Update delivery address
    if (deliveryAddress) {
      checkoutCustomer.Address = deliveryAddress;
      await checkoutCustomer.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Checkout successful',
      data: {
        transactionId: transaction._id,
        reference: transaction.reference,
        cartTotal: cartTotal,
        pointsDeducted: cartTotal,
        newWalletBalance: checkoutCustomer.points,
        rewards: {
          totalRewardPoints: totalRewardPoints,
          appShare: appPointsShare,
          giftsShare: giftsPointsShare,
          treeShare: treePointsShare,
          distributedToTree: treePointsShare - remainingTreePoints,
          undistributed: remainingTreePoints
        },
        distributionDetails: treeDistributionLog
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
