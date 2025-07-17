const { validationResult } = require('express-validator');
const ProductModel = require('../model/Product');

// Get All Products
module.exports.getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : undefined;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined;
    const inStock = req.query.inStock === 'true';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build query
    const query = { isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { nameArabic: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) query.category = { $regex: category, $options: 'i' };
    if (minPrice !== undefined) query.price = { ...query.price, $gte: minPrice };
    if (maxPrice !== undefined) query.price = { ...query.price, $lte: maxPrice };
    if (inStock) query.stock = { $gt: 0 };

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder;

    const products = await ProductModel.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const totalProducts = await ProductModel.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalProducts / limit),
          totalItems: totalProducts,
          itemsPerPage: limit
        },
        totalProducts
      }
    });

  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get Product by ID
module.exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await ProductModel.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment view count
    await product.incrementViewCount();

    res.status(200).json({
      success: true,
      data: { product }
    });

  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Create Product
module.exports.createProduct = async (req, res) => {
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

    const productData = req.body;

    // Check if product with same name already exists
    const existingProduct = await ProductModel.findOne({
      $or: [
        { name: productData.name },
        { nameArabic: productData.nameArabic }
      ]
    });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: 'Product with this name already exists'
      });
    }

    const newProduct = new ProductModel(productData);
    await newProduct.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product: newProduct }
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update Product
module.exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const product = await ProductModel.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if another product with same name exists (excluding current product)
    if (updateData.name || updateData.nameArabic) {
      const existingProduct = await ProductModel.findOne({
        _id: { $ne: id },
        $or: [
          ...(updateData.name ? [{ name: updateData.name }] : []),
          ...(updateData.nameArabic ? [{ nameArabic: updateData.nameArabic }] : [])
        ]
      });

      if (existingProduct) {
        return res.status(409).json({
          success: false,
          message: 'Product with this name already exists'
        });
      }
    }

    // Update product
    Object.assign(product, updateData);
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: { product }
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete Product
module.exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await ProductModel.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Soft delete by setting isActive to false
    product.isActive = false;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get Product Categories
module.exports.getCategories = async (req, res) => {
  try {
    const categories = await ProductModel.distinct('category', { isActive: true });

    res.status(200).json({
      success: true,
      data: { categories }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get Product Statistics
module.exports.getProductStats = async (req, res) => {
  try {
    const totalProducts = await ProductModel.countDocuments({ isActive: true });
    const inStockProducts = await ProductModel.countDocuments({ isActive: true, stock: { $gt: 0 } });
    const lowStockProducts = await ProductModel.countDocuments({ isActive: true, stock: { $gt: 0, $lt: 10 } });
    const outOfStockProducts = await ProductModel.countDocuments({ isActive: true, stock: 0 });
    
    const topCategories = await ProductModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalProducts,
          inStockProducts,
          lowStockProducts,
          outOfStockProducts,
          topCategories
        }
      }
    });

  } catch (error) {
    console.error('Get product stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
