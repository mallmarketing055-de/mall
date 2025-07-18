const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  nameArabic: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  descriptionArabic: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  image: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  specifications: {
    type: Map,
    of: String
  },
  weight: {
    type: Number,
    min: 0
  },
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 }
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  manufacturer: {
    type: String,
    trim: true,
    maxlength: 100
  },
  warranty: {
    type: String,
    trim: true,
    maxlength: 100
  },
  rating: {
    average: { type: Number, min: 0, max: 5, default: 0 },
    count: { type: Number, min: 0, default: 0 }
  },
  salesCount: {
    type: Number,
    min: 0,
    default: 0
  },
  viewCount: {
    type: Number,
    min: 0,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better performance
productSchema.index({ name: 'text', nameArabic: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ sku: 1 });
productSchema.index({ barcode: 1 });

// Virtual for checking if product is in stock
productSchema.virtual('inStock').get(function() {
  return this.stock > 0;
});

// Virtual for checking if product is low stock (less than 10)
productSchema.virtual('lowStock').get(function() {
  return this.stock > 0 && this.stock < 10;
});

// Method to update stock
productSchema.methods.updateStock = function(quantity, operation = 'subtract') {
  if (operation === 'subtract') {
    this.stock = Math.max(0, this.stock - quantity);
  } else if (operation === 'add') {
    this.stock += quantity;
  }
  return this.save();
};

// Method to increment view count
productSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Method to update rating
productSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.rating.average * this.rating.count) + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

// Static method to find products by category
productSchema.statics.findByCategory = function(category) {
  return this.find({ category, isActive: true });
};

// Static method to search products
productSchema.statics.searchProducts = function(searchTerm, options = {}) {
  const {
    category,
    minPrice,
    maxPrice,
    inStock = true,
    limit = 20,
    skip = 0,
    sort = { createdAt: -1 }
  } = options;

  const query = {
    isActive: true,
    $text: { $search: searchTerm }
  };

  if (category) query.category = category;
  if (minPrice !== undefined) query.price = { ...query.price, $gte: minPrice };
  if (maxPrice !== undefined) query.price = { ...query.price, $lte: maxPrice };
  if (inStock) query.stock = { $gt: 0 };

  return this.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Pre-save middleware to generate SKU if not provided
productSchema.pre('save', function(next) {
  if (!this.sku && this.isNew) {
    // Generate SKU based on category and timestamp
    const categoryCode = this.category.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    this.sku = `${categoryCode}-${timestamp}`;
  }
  next();
});

// Transform output
productSchema.methods.toJSON = function() {
  const product = this.toObject();
  
  // Add virtual fields
  product.inStock = this.inStock;
  product.lowStock = this.lowStock;
  
  // Add image URL if image exists
  if (product.image) {
    product.imageUrl = `/api/uploads/products/${product.image}`;
  }
  
  return product;
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
