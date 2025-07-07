const { validationResult } = require('express-validator');
const authService = require('../services/auth');

// Customer Signup
module.exports.signup = async (req, res) => {
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

    const { name, username, email, password, phone, Address, DOB, Gender, communicationType } = req.body;

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

    // Create new user
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
      profilePicture: profilePictureData
    };

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
