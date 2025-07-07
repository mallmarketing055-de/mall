const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    trim: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  productNameArabic: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  unit: {
    type: String,
    required: true,
    trim: true,
    default: 'نقطة' // points in Arabic
  },
  image: {
    type: String,
    default: null
  }
});

const cartSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  totalAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalItems: {
    type: Number,
    default: 0,
    min: 0
  },
  deliveryAddress: {
    type: String,
    trim: true,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'checkout', 'completed', 'abandoned'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for faster queries
cartSchema.index({ customerId: 1 });
cartSchema.index({ status: 1 });

// Calculate totals before saving
cartSchema.pre('save', function(next) {
  this.totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
  this.totalAmount = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  next();
});

// Method to add item to cart
cartSchema.methods.addItem = function(productData) {
  const existingItemIndex = this.items.findIndex(item => item.productId === productData.productId);

  if (existingItemIndex > -1) {
    // Update existing item quantity
    this.items[existingItemIndex].quantity += productData.quantity || 1;
  } else {
    // Add new item
    this.items.push(productData);
  }

  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItem = function(productId, quantity) {
  const itemIndex = this.items.findIndex(item => item.productId === productId);

  if (itemIndex > -1) {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      this.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      this.items[itemIndex].quantity = quantity;
    }
  }

  return this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = function(productId) {
  this.items = this.items.filter(item => item.productId !== productId);
  return this.save();
};

// Method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  return this.save();
};

module.exports = mongoose.model('Cart', cartSchema);
