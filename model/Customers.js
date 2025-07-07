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
  }
}, {
  timestamps: true
});

// Index for faster queries
customerSchema.index({ email: 1 });
customerSchema.index({ username: 1 });

module.exports = mongoose.model('Customer', customerSchema);
