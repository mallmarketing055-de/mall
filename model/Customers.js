const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  Address: {
    type: String,
    required: true,
    trim: true
  },
  DOB: {
    type: Date,
    required: true
  },
  Gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'ذكر', 'أنثى']
  },
  communicationType: {
    type: String,
    required: true,
    enum: ['email', 'phone', 'both', 'بريد إلكتروني', 'هاتف', 'كلاهما']
  },
  profilePicture: {
    filename: {
      type: String,
      default: 'default-avatar.png'
    },
    originalName: {
      type: String,
      default: null
    },
    mimetype: {
      type: String,
      default: null
    },
    size: {
      type: Number,
      default: null
    },
    uploadDate: {
      type: Date,
      default: null
    }
  },
  profilePictureURL: {
    type: String,
    default: null
  },
  FrontIDImageURL: {
    type: String,
    default: null
  },
  BackIDImageURL: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  // Referral System - Every user gets their own reference number
  referenceNumber: {
    type: String,
    unique: true,
    length: 6
    // Auto-generated in pre-save middleware, not required in schema
  },
  // 🟢 Points system
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  // Optional: Reference number of the person who invited this user
  referredBy: {
    type: String,
    default: null,
    validate: {
      validator: function (v) {
        // If referredBy is provided, it should be a valid 6-digit reference number
        return !v || /^\d{6}$/.test(v);
      },
      message: 'Referred by must be a 6-digit reference number'
    }
  },
  parentCustomer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null
  },
  referralLevel: {
    type: Number,
    default: 0,
    min: 0
  },
  totalReferrals: {
    type: Number,
    default: 0,
    min: 0
  },
  directReferrals: {
    type: Number,
    default: 0,
    min: 0
  },
  referralStatus: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  levelLetter: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
    default: 'A'
  }
}, {
  timestamps: true
});

// Generate unique 6-digit reference number before saving
customerSchema.pre('save', async function (next) {
  if (this.isNew && !this.referenceNumber) {
    let referenceNumber;
    let isUnique = false;

    while (!isUnique) {
      // Generate 6-digit random number
      referenceNumber = Math.floor(100000 + Math.random() * 900000).toString();

      // Check if this reference number already exists
      const existingCustomer = await mongoose.model('Customer').findOne({ referenceNumber });
      if (!existingCustomer) {
        isUnique = true;
      }
    }

    this.referenceNumber = referenceNumber;
  }

  // If this customer was referred by someone, find the parent and update hierarchy
  if (this.isNew && this.referredBy) {
    try {
      const parentCustomer = await mongoose.model('Customer').findOne({ referenceNumber: this.referredBy });
      if (parentCustomer) {
        this.parentCustomer = parentCustomer._id;
        this.referralLevel = parentCustomer.referralLevel + 1;

        // Update parent's referral counts
        await mongoose.model('Customer').findByIdAndUpdate(parentCustomer._id, {
          $inc: {
            directReferrals: 1,
            totalReferrals: 1
          }
        });

        // Update all ancestors' total referral counts
        let currentParent = parentCustomer.parentCustomer;
        while (currentParent) {
          const ancestor = await mongoose.model('Customer').findByIdAndUpdate(currentParent, {
            $inc: { totalReferrals: 1 }
          });
          currentParent = ancestor ? ancestor.parentCustomer : null;
        }
      }
    } catch (error) {
      console.error('Error processing referral hierarchy:', error);
    }
  }

  next();
});

// Index for faster queries
customerSchema.index({ email: 1 });
customerSchema.index({ username: 1 });
customerSchema.index({ referenceNumber: 1 });
customerSchema.index({ parentCustomer: 1 });
customerSchema.index({ referredBy: 1 });

module.exports = mongoose.model('Customer', customerSchema);
