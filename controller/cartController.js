const { validationResult } = require('express-validator');
const CartModel = require('../model/Cart');
const CustomerModel = require('../model/Customers');
const ProductModel = require('../model/Product');
const TransactionModel = require('../model/Transaction');
const CheckoutJob = require('../model/CheckoutJob');
const RewardSettings = require('../model/RewardSettings');
// const ProductModel = require('../model/Product');


// Add Item to Cart
module.exports.addToCart = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Extract customer ID from token
    const customerId =
      req.user.Customer_id ||
      req.user.CustomerId ||
      req.user.customer_id ||
      req.user.customerId;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID not found in token'
      });
    }

    const { productId, quantity = 1 } = req.body;

    // 🔴 Fetch product from DB (SOURCE OF TRUTH)
    const product = await ProductModel.findById(productId);

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or inactive'
      });
    }

    // Find or create cart
    let cart = await CartModel.findOne({ customerId });
    if (!cart) {
      cart = new CartModel({ customerId, items: [] });
    }

    // ✅ Product data ONLY from DB
    const productData = {
      productId: product._id,
      productName: product.name,
      productNameArabic: product.nameArabic,
      price: product.price,          // SAFE
      quantity,
      unit: product.unit || 'نقطة',
      image: product.image
    };

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

// ✅ CHECKOUT CLEAN VERSION (FINAL)
// - Max level: J
// - Levels A → I: one user per level gets 5%
// - Level J: ALL users share the same 5%
// - Skip inactive / unverified users
// - Skip duplicated levels (except J)

const LEVELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const TREE_LEVEL_PERCENTAGE = 0.05; // 5%

function isActiveCustomer(customer) {
  return customer.referralStatus === 'active' && customer.isVerified === true;
}

async function distributeTreePoints({ buyer, treePointsShare, checkoutTransaction }) {
  const paidLevels = new Set();
  const jUsers = [];
  let currentParentId = buyer.parentCustomer;
  let totalDistributed = 0;
  const distributionLog = [];

  while (currentParentId) {
    const parent = await CustomerModel.findById(currentParentId)
      .select('parentCustomer levelLetter referralStatus isVerified points username email');

    if (!parent) break;
    currentParentId = parent.parentCustomer;

    // ❌ skip inactive
    if (!isActiveCustomer(parent)) continue;

    const level = parent.levelLetter;

    // 🔴 LEVEL J → collect only
    if (level === 'J') {
      jUsers.push(parent);
      continue;
    }

    // ❌ skip duplicated levels
    if (paidLevels.has(level)) continue;

    const reward = treePointsShare * TREE_LEVEL_PERCENTAGE;
    parent.points += reward;
    await parent.save();

    paidLevels.add(level);
    totalDistributed += reward;

    distributionLog.push({
      recipientId: parent._id,
      recipientUsername: parent.username,
      level,
      amount: reward
    });

    await TransactionModel.create({
      customerId: parent._id,
      userName: parent.username,
      userEmail: parent.email,
      amount: reward,
      type: 'tree_reward',
      status: 'completed',
      description: `Tree reward - Level ${level}`,
      relatedTransaction: checkoutTransaction._id,
      processedAt: new Date()
    });
  }

  // 🟢 DISTRIBUTE LEVEL J (shared)
  if (jUsers.length > 0) {
    const jShare = treePointsShare * TREE_LEVEL_PERCENTAGE;
    const perUser = jShare / jUsers.length;

    for (const user of jUsers) {
      user.points += perUser;
      await user.save();

      totalDistributed += perUser;

      distributionLog.push({
        recipientId: user._id,
        recipientUsername: user.username,
        level: 'J',
        amount: perUser,
        sharedWith: jUsers.length
      });

      await TransactionModel.create({
        customerId: user._id,
        userName: user.username,
        userEmail: user.email,
        amount: perUser,
        type: 'tree_reward_shared',
        status: 'completed',
        description: `Tree reward - Level J shared (${jUsers.length})`,
        relatedTransaction: checkoutTransaction._id,
        processedAt: new Date()
      });
    }
  }

  return {
    totalDistributed,
    distributionLog,
    unused: treePointsShare - totalDistributed
  };
}


async function upgradeTreeLevels(startCustomerId) {
  let currentCustomerId = startCustomerId;

  while (currentCustomerId) {
    const customer = await CustomerModel.findById(currentCustomerId);
    if (!customer) break;

    // هات direct referrals
    const directs = await CustomerModel.find({
      parentCustomer: customer._id
    }).select('levelLetter');

    if (directs.length < 2) {
      currentCustomerId = customer.parentCustomer;
      continue;
    }

    // عد المستويات
    const countByLevel = {};
    for (const d of directs) {
      countByLevel[d.levelLetter] = (countByLevel[d.levelLetter] || 0) + 1;
    }

    // شوف هل يترقى
    for (let i = 0; i < LEVELS.length - 1; i++) {
      const level = LEVELS[i];
      const nextLevel = LEVELS[i + 1];

      if (
        countByLevel[level] >= 2 &&
        LEVELS.indexOf(nextLevel) > LEVELS.indexOf(customer.levelLetter)
      ) {
        customer.levelLetter = nextLevel;
        await customer.save();
        break;
      }
    }

    currentCustomerId = customer.parentCustomer;
  }
}



module.exports.checkout = async (req, res) => {
  try {
    const customerId = req.user.Customer_id;
    const deliveryAddress = req.body.deliveryAddress || null;

    // =========================================
    // IMMEDIATE OPERATIONS (Synchronous)
    // =========================================

    // 1) Find cart
    const cart = await CartModel.findOne({ customerId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty or not found'
      });
    }

    // 4) FETCH PRODUCT DATA (Source of Truth for price & rewards)
    const productIds = cart.items.map(i => i.productId);
    const products = await ProductModel.find({ _id: { $in: productIds } });

    // Recalculate actual amount to deduct (Prevent price manipulation)
    let actualCartTotal = 0;
    let totalRewardPoints = 0;

    for (const item of cart.items) {
      const product = products.find(p => p._id.toString() === item.productId.toString());
      if (product) {
        // Use DB price, IGNORE cart.totalAmount
        actualCartTotal += product.price * item.quantity;
        // Calculate rewards based on product percentage
        const productPoints = (product.percentage || 0) * item.quantity;
        totalRewardPoints += productPoints;
      }
    }

    // 5) Deduct Payment using Atomic Operation
    // ATOMIC UPDATE: Check balance and deduct in one operation
    const checkoutCustomer = await CustomerModel.findOneAndUpdate(
      {
        _id: customerId,
        points: { $gte: actualCartTotal }
      },
      { $inc: { points: -actualCartTotal } },
      { new: true }
    );

    // Handle failure cases
    if (!checkoutCustomer) {
      const existingCustomer = await CustomerModel.findById(customerId).select('points');
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance',
        required: actualCartTotal,
        available: existingCustomer?.points || 0
      });
    }

    // 6) FETCH REWARD CONFIG & SPLIT
    const config = await RewardSettings.getSettings();
    const treePointsShare = totalRewardPoints * (config.treeShare || 0.50);
    const giftsPointsShare = totalRewardPoints * (config.giftsShare || 0.15);
    const appPointsShare = totalRewardPoints * (config.appShare || 0.30);
    const directReferralShare = totalRewardPoints * (config.firstPaymentReferral || 0.05);

    console.log('Total Reward Points:', totalRewardPoints);
    console.log('App Points Share:', appPointsShare);
    console.log('Gifts Points Share:', giftsPointsShare);
    console.log('Tree Points Share:', treePointsShare);
    console.log('Direct Referral Share:', directReferralShare);
    // 7) CREATE CHECKOUT TRANSACTION
    const checkoutTransaction = new TransactionModel({
      customerId: checkoutCustomer._id,
      userName: checkoutCustomer.username,
      userEmail: checkoutCustomer.email,
      amount: actualCartTotal,
      type: 'purchase',
      status: 'completed',
      description: `Purchase - ${cart.items.length} item(s)`,
      paymentMethod: 'wallet',
      items: cart.items.map(item => ({
        productId: item.productId,
        productName: item.productName || item.productNameArabic,
        quantity: item.quantity,
        price: item.price, // Note: This might still show cart price in history, but actual deduction used DB price above
        subtotal: item.price * item.quantity
      })),
      shippingAddress: {
        street: deliveryAddress || checkoutCustomer.Address
      },
      processedAt: new Date(),
      // Points tracking fields
      cartTotal: actualCartTotal,
      rewardPointsEarned: totalRewardPoints,
      appPointsShare: appPointsShare,
      giftsPointsShare: giftsPointsShare,
      treePointsShare: treePointsShare,
      directReferralShare: directReferralShare
    });

    await checkoutTransaction.save();

    // 7) CLEAR CART
    await cart.clearCart();

    // 8) UPDATE DELIVERY ADDRESS (if provided)
    if (deliveryAddress) {
      await CustomerModel.findByIdAndUpdate(checkoutCustomer._id, {
        Address: deliveryAddress
      });
    }

    // =========================================
    // ENQUEUE BACKGROUND JOB (MongoDB)
    // =========================================
    // This will handle:
    // - upgradeTreeLevels()
    // - distributeTreePoints()
    // - Creating tree_reward, tree_reward_shared, gifts_reward, app_reward transactions
    // - Updating checkoutTransaction with final details

    try {
      await CheckoutJob.create({
        customerId: checkoutCustomer._id,
        checkoutTransactionId: checkoutTransaction._id,
        status: 'pending',
        payload: {
          treePointsShare,
          appPointsShare,
          giftsPointsShare,
          directReferralShare,
          totalRewardPoints
        }
      });
      console.log(`[Checkout] Created background job for transaction ${checkoutTransaction._id}`);
    } catch (jobError) {
      // Log error but don't fail the checkout
      console.error('[Checkout] Failed to create background job:', jobError);
      // Could optionally send notification to admin
    }

    // =========================================
    // RESPOND TO CLIENT IMMEDIATELY
    // =========================================
    res.status(200).json({
      success: true,
      message: 'Checkout successful',
      data: {
        transactionId: checkoutTransaction._id,
        reference: checkoutTransaction.reference,
        cartTotal: actualCartTotal,
        pointsDeducted: actualCartTotal,
        newWalletBalance: checkoutCustomer.points,
        rewards: {
          totalRewardPoints: totalRewardPoints,
          appShare: appPointsShare,
          giftsShare: giftsPointsShare,
          treeShare: treePointsShare,
          referralShare: directReferralShare,
          status: 'processing' // Indicates rewards are being processed in background
        },
        note: 'Tree rewards and level upgrades are being processed in the background'
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
