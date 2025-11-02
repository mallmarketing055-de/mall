const { validationResult } = require('express-validator');
const authService = require('../services/auth');
const CustomerModel = require('../model/Customers');

// Customer Signup
module.exports.signup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, username, email, password, phone, Address, DOB, Gender, communicationType, referredBy } = req.body;

    // Check if user already exists
    const userExists = await authService.doesUserExist(username, email);
    if (userExists) {
      return res.status(409).json({
        success: false,
        message: 'User with this username or email already exists'
      });
    }

    // Check if email already exists
    const emailExists = await authService.doesEmailExist(email);
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Validate referral code if provided
    if (referredBy) {
      if (!/^\d{6}$/.test(referredBy)) {
        return res.status(400).json({
          success: false,
          message: 'Referral code must be a 6-digit number'
        });
      }

      const referralExists = await authService.doesReferralCodeExist(referredBy);
      if (!referralExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid referral code'
        });
      }
    }

    // Handle profile picture upload
    let profilePictureData = {
      filename: 'default-avatar.png',
      originalName: null,
      mimetype: null,
      size: null,
      uploadDate: null
    };

    if (req.file) {
      profilePictureData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        uploadDate: new Date()
      };
    }

    // 🟢 Create new user with initial points = 0
    const customerInfo = {
      name,
      username,
      email,
      password,
      phone,
      Address,
      DOB,
      Gender,
      communicationType,
      profilePicture: profilePictureData,
      referredBy: referredBy.toString() || null,
      points: 0 // ✅ Add this line for initial points
    };

    console.log('Creating user with info:', customerInfo);
    const newUser = await authService.createUser(customerInfo);

    // Generate JWT token
    const token = authService.generateCJWT(newUser);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: newUser._id,
          name: newUser.name,
          username: newUser.username,
          email: newUser.email,
          phone: newUser.phone,
          Address: newUser.Address,
          DOB: newUser.DOB,
          Gender: newUser.Gender,
          communicationType: newUser.communicationType,
          referenceNumber: newUser.referenceNumber,
          referralLevel: newUser.referralLevel,
          points: newUser.points, // ✅ Return it in response
          profilePicture: {
            filename: newUser.profilePicture.filename,
            url: `/api/uploads/profile-pictures/${newUser.profilePicture.filename}`
          }
        },
        token
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


// Customer Login
module.exports.login = async (req, res) => {
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

    const { username, password } = req.body;

    // Check credentials
    const customer = await authService.checkCredentials(username, password);

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Generate JWT token
    const token = authService.generateCJWT(customer);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: customer._id,
          name: customer.name,
          username: customer.username,
          email: customer.email,
          phone: customer.phone,
          Address: customer.Address,
          DOB: customer.DOB,
          Gender: customer.Gender,
          communicationType: customer.communicationType,
          profilePicture: {
            filename: customer.profilePicture.filename,
            url: `/api/uploads/profile-pictures/${customer.profilePicture.filename}`
          }
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get Customer Profile
module.exports.getProfile = async (req, res) => {
  try {
    const customerId = req.user.Customer_id;
    const CustomerModel = require('../model/Customers');

    const customer = await CustomerModel.findById(customerId).select('-password');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Add profile picture URL
    const customerData = customer.toObject();
    if (customerData.profilePicture && customerData.profilePicture.filename) {
      customerData.profilePicture.url = `/api/uploads/profile-pictures/${customerData.profilePicture.filename}`;
    }

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: customerData
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update Profile Picture
module.exports.updateProfilePicture = async (req, res) => {
  try {
    const customerId = req.user.Customer_id;
    const CustomerModel = require('../model/Customers');
    const { deleteOldProfilePicture } = require('../middelwares/fileUpload');

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Find the customer
    const customer = await CustomerModel.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Delete old profile picture if it exists and is not the default
    if (customer.profilePicture && customer.profilePicture.filename) {
      deleteOldProfilePicture(customer.profilePicture.filename);
    }

    // Update profile picture data
    const profilePictureData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadDate: new Date()
    };

    // Update customer
    customer.profilePicture = profilePictureData;
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      data: {
        profilePicture: {
          filename: profilePictureData.filename,
          url: `/api/uploads/profile-pictures/${profilePictureData.filename}`,
          originalName: profilePictureData.originalName,
          size: profilePictureData.size,
          uploadDate: profilePictureData.uploadDate
        }
      }
    });

  } catch (error) {
    console.error('Update profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update Customer Profile
module.exports.updateProfile = async (req, res) => {
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
    const CustomerModel = require('../model/Customers');

    // Find the customer
    const customer = await CustomerModel.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Extract fields that can be updated
    const { name, username, email, phone, Address, DOB, Gender, communicationType } = req.body;

    // Check if username is being changed and if it already exists
    if (username && username !== customer.username) {
      const usernameExists = await CustomerModel.findOne({
        username: username,
        _id: { $ne: customerId }
      });

      if (usernameExists) {
        return res.status(409).json({
          success: false,
          message: 'Username already exists'
        });
      }
    }

    // Check if email is being changed and if it already exists
    if (email && email !== customer.email) {
      const emailExists = await CustomerModel.findOne({
        email: email,
        _id: { $ne: customerId }
      });

      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Update only provided fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (Address !== undefined) updateData.Address = Address;
    if (DOB !== undefined) updateData.DOB = DOB;
    if (Gender !== undefined) updateData.Gender = Gender;
    if (communicationType !== undefined) updateData.communicationType = communicationType;

    // Update the customer
    const updatedCustomer = await CustomerModel.findByIdAndUpdate(
      customerId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    // Add profile picture URL
    const customerData = updatedCustomer.toObject();
    if (customerData.profilePicture && customerData.profilePicture.filename) {
      customerData.profilePicture.url = `/api/uploads/profile-pictures/${customerData.profilePicture.filename}`;
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: customerData
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get All Customers (Admin only)
module.exports.getAllCustomers = async (req, res) => {
  try {
    console.log('getAllCustomers called - Request received!');
    console.log('Request headers:', req.headers);
    console.log('Request query:', req.query);
    console.log('Request user:', req.user);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder;

    console.log('Fetching customers with query:', query);
    const customers = await CustomerModel.find(query)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const totalCustomers = await CustomerModel.countDocuments(query);
    console.log(`Found ${customers.length} customers, total: ${totalCustomers}`);

    // Add profile picture URLs
    const customersWithUrls = customers.map(customer => {
      const customerData = customer.toObject();
      if (customerData.profilePicture && customerData.profilePicture.filename) {
        customerData.profilePicture.url = `/api/uploads/profile-pictures/${customerData.profilePicture.filename}`;
      }
      return customerData;
    });

    res.status(200).json({
      success: true,
      data: {
        users: customersWithUrls,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCustomers / limit),
          totalItems: totalCustomers,
          itemsPerPage: limit
        }
      }
    });

  } catch (error) {
    console.error('Get all customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};



// Get Customer by ID (Admin only)
module.exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await CustomerModel.findById(id).select('-password');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Add profile picture URL
    const customerData = customer.toObject();
    if (customerData.profilePicture && customerData.profilePicture.filename) {
      customerData.profilePicture.url = `/api/uploads/profile-pictures/${customerData.profilePicture.filename}`;
    }

    res.status(200).json({
      success: true,
      data: { user: customerData }
    });

  } catch (error) {
    console.error('Get customer by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete Customer (Admin only)
module.exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await CustomerModel.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    await CustomerModel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });

  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get Customer Statistics (Admin only)
module.exports.getCustomerStats = async (req, res) => {
  try {
    const totalUsers = await CustomerModel.countDocuments();

    // Get users registered this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const newUsersThisMonth = await CustomerModel.countDocuments({
      createdAt: { $gte: thisMonth }
    });

    // Get users registered last month for growth calculation
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    lastMonth.setDate(1);
    lastMonth.setHours(0, 0, 0, 0);

    const lastMonthEnd = new Date(thisMonth);
    lastMonthEnd.setDate(0);
    lastMonthEnd.setHours(23, 59, 59, 999);

    const newUsersLastMonth = await CustomerModel.countDocuments({
      createdAt: { $gte: lastMonth, $lte: lastMonthEnd }
    });

    // Calculate monthly growth
    const monthlyGrowth = newUsersLastMonth > 0
      ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100
      : 0;

    // Get active users (users who have logged in recently or have referrals)
    const activeUsers = await CustomerModel.countDocuments({
      $or: [
        { totalReferrals: { $gt: 0 } },
        { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } // Last 30 days
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeUsers,
          newUsersThisMonth
        },
        totalUsers,
        monthlyGrowth: Math.round(monthlyGrowth * 100) / 100
      }
    });

  } catch (error) {
    console.error('Get customer stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
