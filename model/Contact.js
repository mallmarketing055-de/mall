const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  idNumber: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 20
  },
  communicationType: {
    type: String,
    required: true,
    enum: ['email', 'phone', 'both', 'بريد إلكتروني', 'هاتف', 'كلاهما']
  },
  message: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 1000
  },

  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^[\+]?[1-9][\d]{0,15}$/.test(v);
      },
      message: 'Please enter a valid phone number'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'closed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  adminResponse: {
    type: String,
    trim: true,
    default: null
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  respondedAt: {
    type: Date,
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
contactSchema.index({ email: 1 });
contactSchema.index({ status: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ priority: 1 });

module.exports = mongoose.model('Contact', contactSchema);
