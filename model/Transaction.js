const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  userName: {
    type: String,
    required: true,
    trim: true
  },
  userEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'SAR', 'AED', 'EGP']
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  type: {
    type: String,
    required: true,
    enum: ['purchase', 'refund', 'payment', 'withdrawal', 'deposit', 'credit'],
    default: 'purchase'
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash', 'wallet', "admin"],
    default: 'credit_card'
  },
  reference: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  externalTransactionId: {
    type: String,
    trim: true
  },
  items: [{
    productId: {
      type: String,
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  fees: {
    processingFee: { type: Number, default: 0 },
    serviceFee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 }
  },
  discounts: {
    couponCode: { type: String, trim: true },
    discountAmount: { type: Number, default: 0 },
    discountPercentage: { type: Number, default: 0 }
  },
  billingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  metadata: {
    type: Map,
    of: String
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  processedAt: {
    type: Date
  },
  failureReason: {
    type: String,
    trim: true
  },
  refundAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  refundedAt: {
    type: Date
  },
  // 🟢 Points Distribution Tracking (for checkout purchases)
  cartTotal: {
    type: Number,
    min: 0,
    default: 0
  },
  rewardPointsEarned: {
    type: Number,
    min: 0,
    default: 0
  },
  appPointsShare: {
    type: Number,
    min: 0,
    default: 0
  },
  giftsPointsShare: {
    type: Number,
    min: 0,
    default: 0
  },
  treePointsShare: {
    type: Number,
    min: 0,
    default: 0
  },
  treeDistribution: [{
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    },
    recipientUsername: String,
    amount: Number,
    level: Number
  }]
}, {
  timestamps: true
});

// Indexes for better performance
transactionSchema.index({ customerId: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ reference: 1 });
transactionSchema.index({ externalTransactionId: 1 });
transactionSchema.index({ userEmail: 1 });

// Virtual for total fees
transactionSchema.virtual('totalFees').get(function () {
  return (this.fees.processingFee || 0) +
    (this.fees.serviceFee || 0) +
    (this.fees.tax || 0) +
    (this.fees.shipping || 0);
});

// Virtual for total discount
transactionSchema.virtual('totalDiscount').get(function () {
  return this.discounts.discountAmount || 0;
});

// Virtual for net amount (amount + fees - discounts)
transactionSchema.virtual('netAmount').get(function () {
  return this.amount + this.totalFees - this.totalDiscount;
});

// Virtual for checking if transaction is refundable
transactionSchema.virtual('isRefundable').get(function () {
  return this.status === 'completed' && this.refundAmount < this.amount;
});

// Pre-save middleware to generate reference number
transactionSchema.pre('save', function (next) {
  if (!this.reference && this.isNew) {
    // Generate reference number: TXN + timestamp + random 4 digits
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(1000 + Math.random() * 9000);
    this.reference = `TXN${timestamp}${random}`;
  }
  next();
});

// Pre-save middleware to set processedAt when status changes to completed
transactionSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'completed' && !this.processedAt) {
    this.processedAt = new Date();
  }
  next();
});

// Method to mark transaction as completed
transactionSchema.methods.markCompleted = function () {
  this.status = 'completed';
  this.processedAt = new Date();
  return this.save();
};

// Method to mark transaction as failed
transactionSchema.methods.markFailed = function (reason) {
  this.status = 'failed';
  this.failureReason = reason;
  return this.save();
};

// Method to process refund
transactionSchema.methods.processRefund = function (refundAmount, reason) {
  if (this.status !== 'completed') {
    throw new Error('Only completed transactions can be refunded');
  }

  if (refundAmount > (this.amount - this.refundAmount)) {
    throw new Error('Refund amount exceeds available amount');
  }

  this.refundAmount += refundAmount;
  this.refundedAt = new Date();
  this.notes = this.notes ? `${this.notes}\nRefund: ${reason}` : `Refund: ${reason}`;

  if (this.refundAmount >= this.amount) {
    this.status = 'refunded';
  }

  return this.save();
};

// Static method to get transactions by user
transactionSchema.statics.findByUser = function (customerId, options = {}) {
  const {
    status,
    type,
    startDate,
    endDate,
    limit = 20,
    skip = 0,
    sort = { createdAt: -1 }
  } = options;

  const query = { customerId };

  if (status) query.status = status;
  if (type) query.type = type;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  return this.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get transaction statistics
transactionSchema.statics.getStats = function (options = {}) {
  const { startDate, endDate } = options;

  const matchStage = {};
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        completedTransactions: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        pendingTransactions: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        failedTransactions: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        averageAmount: { $avg: '$amount' }
      }
    }
  ]);
};

// Transform output
transactionSchema.methods.toJSON = function () {
  const transaction = this.toObject();

  // Add virtual fields
  transaction.totalFees = this.totalFees;
  transaction.totalDiscount = this.totalDiscount;
  transaction.netAmount = this.netAmount;
  transaction.isRefundable = this.isRefundable;

  return transaction;
};

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
