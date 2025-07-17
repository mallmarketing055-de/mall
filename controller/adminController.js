const { validationResult } = require('express-validator');
const AdminModel = require('../model/Admin');
const jwt = require('jsonwebtoken');

// Admin Registration/Signup
module.exports.signup = async (req, res) => {
  try {
    console.log('Admin signup request received:', req.body);

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, email, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await AdminModel.findOne({
      $or: [{ email }, { username }]
    });

    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: existingAdmin.email === email ? 'Email already exists' : 'Username already exists'
      });
    }

    // Create new admin
    const newAdmin = new AdminModel({
      username,
      email,
      password
    });

    await newAdmin.save();

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: {
        admin: {
          id: newAdmin._id,
          username: newAdmin.username,
          email: newAdmin.email,
          createdAt: newAdmin.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Admin signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Admin Login/Signin
module.exports.signin = async (req, res) => {
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

    const { email, password } = req.body;

    // Find admin by email
    const admin = await AdminModel.findOne({ email });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        AdminId: admin._id,
        username: admin.username,
        Type: 'Admin'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email
        }
      }
    });

  } catch (error) {
    console.error('Admin signin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get All Admins
module.exports.getAllAdmins = async (req, res) => {
  try {
    console.log('getAllAdmins called');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    console.log('Fetching admins from database...');
    const admins = await AdminModel.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalAdmins = await AdminModel.countDocuments();
    console.log(`Found ${admins.length} admins, total: ${totalAdmins}`);

    res.status(200).json({
      success: true,
      data: {
        admins,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalAdmins / limit),
          totalItems: totalAdmins,
          itemsPerPage: limit
        }
      }
    });

  } catch (error) {
    console.error('Get all admins error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get Admin by ID
module.exports.getAdminById = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await AdminModel.findById(id).select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { admin }
    });

  } catch (error) {
    console.error('Get admin by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update Admin
module.exports.updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password } = req.body;

    const admin = await AdminModel.findById(id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Check if username or email already exists (excluding current admin)
    if (username || email) {
      const existingAdmin = await AdminModel.findOne({
        _id: { $ne: id },
        $or: [
          ...(username ? [{ username }] : []),
          ...(email ? [{ email }] : [])
        ]
      });

      if (existingAdmin) {
        return res.status(409).json({
          success: false,
          message: existingAdmin.email === email ? 'Email already exists' : 'Username already exists'
        });
      }
    }

    // Update fields
    if (username) admin.username = username;
    if (email) admin.email = email;
    if (password) admin.password = password; // Will be hashed by pre-save middleware

    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Admin updated successfully',
      data: {
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          updatedAt: admin.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete Admin
module.exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await AdminModel.findById(id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    await AdminModel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Admin deleted successfully'
    });

  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
