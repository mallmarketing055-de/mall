const CustomerModel = require('../model/Customers');

// Get customer's referral information
module.exports.getReferralInfo = async (req, res) => {
  try {
    const customerId = req.user.Customer_id || req.user.CustomerId || req.user.customer_id || req.user.customerId;
    
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID not found in token'
      });
    }

    const customer = await CustomerModel.findById(customerId)
      .populate('parentCustomer', 'name username referenceNumber')
      .select('name username referenceNumber referredBy parentCustomer referralLevel totalReferrals directReferrals referralStatus');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        referralInfo: {
          myReferenceNumber: customer.referenceNumber,
          referralLevel: customer.referralLevel,
          totalReferrals: customer.totalReferrals,
          directReferrals: customer.directReferrals,
          referralStatus: customer.referralStatus,
          referredBy: customer.referredBy,
          parentCustomer: customer.parentCustomer ? {
            name: customer.parentCustomer.name,
            username: customer.parentCustomer.username,
            referenceNumber: customer.parentCustomer.referenceNumber
          } : null
        }
      }
    });

  } catch (error) {
    console.error('Get referral info error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get customer's referral network (hierarchical tree structure)
module.exports.getReferralNetwork = async (req, res) => {
  try {
    const customerId = req.user.Customer_id || req.user.CustomerId || req.user.customer_id || req.user.customerId;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID not found in token'
      });
    }

    // Get customer's own info
    const customer = await CustomerModel.findById(customerId)
      .select('name username referenceNumber totalReferrals directReferrals');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Recursive function to build the referral tree
    const buildReferralTree = async (parentId, visited = new Set()) => {
      if (visited.has(parentId.toString())) return [];
      visited.add(parentId.toString());

      const children = await CustomerModel.find({ parentCustomer: parentId })
        .select('_id name username referenceNumber referralLevel totalReferrals directReferrals createdAt profilePicture')
        .sort({ createdAt: -1 });

      const childrenWithSubtree = [];

      for (const child of children) {
        const childData = {
          id: child._id.toString(),
          name: child.name,
          username: child.username,
          referenceNumber: child.referenceNumber,
          referralLevel: child.referralLevel,
          totalReferrals: child.totalReferrals,
          directReferrals: child.directReferrals,
          joinedDate: child.createdAt,
          profilePicture: child.profilePicture ? {
            filename: child.profilePicture.filename,
            url: `/api/uploads/profile-pictures/${child.profilePicture.filename}`
          } : null,
          children: await buildReferralTree(child._id, visited) // Recursive call for children
        };

        childrenWithSubtree.push(childData);
      }

      return childrenWithSubtree;
    };

    // Build the complete referral tree starting from current customer
    const referralTree = await buildReferralTree(customerId);

    res.status(200).json({
      success: true,
      data: {
        id: customer._id.toString(),
        name: customer.name,
        username: customer.username,
        referenceNumber: customer.referenceNumber,
        totalReferrals: customer.totalReferrals,
        directReferrals: customer.directReferrals,
        children: referralTree
      }
    });

  } catch (error) {
    console.error('Get referral network error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get customer's direct referrals only (flat list with pagination)
module.exports.getDirectReferrals = async (req, res) => {
  try {
    const customerId = req.user.Customer_id || req.user.CustomerId || req.user.customer_id || req.user.customerId;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID not found in token'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get direct referrals only
    const directReferrals = await CustomerModel.find({ parentCustomer: customerId })
      .select('name username referenceNumber referralLevel totalReferrals directReferrals createdAt profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalDirectReferrals = await CustomerModel.countDocuments({ parentCustomer: customerId });

    // Get customer's own info
    const customer = await CustomerModel.findById(customerId)
      .select('name username referenceNumber totalReferrals directReferrals');

    res.status(200).json({
      success: true,
      data: {
        myInfo: {
          id: customer._id.toString(),
          name: customer.name,
          username: customer.username,
          referenceNumber: customer.referenceNumber,
          totalReferrals: customer.totalReferrals,
          directReferrals: customer.directReferrals
        },
        directReferrals: directReferrals.map(referral => ({
          id: referral._id.toString(),
          name: referral.name,
          username: referral.username,
          referenceNumber: referral.referenceNumber,
          referralLevel: referral.referralLevel,
          totalReferrals: referral.totalReferrals,
          directReferrals: referral.directReferrals,
          joinedDate: referral.createdAt,
          profilePicture: {
            filename: referral.profilePicture.filename,
            url: `/api/uploads/profile-pictures/${referral.profilePicture.filename}`
          }
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalDirectReferrals / limit),
          totalItems: totalDirectReferrals,
          itemsPerPage: limit
        }
      }
    });

  } catch (error) {
    console.error('Get direct referrals error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Validate referral code
module.exports.validateReferralCode = async (req, res) => {
  try {
    const { referenceNumber } = req.body;

    if (!referenceNumber) {
      return res.status(400).json({
        success: false,
        message: 'Reference number is required'
      });
    }

    // Check if referral code is valid 6-digit number
    if (!/^\d{6}$/.test(referenceNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Reference number must be a 6-digit number'
      });
    }

    // Check if referral code exists
    const referralCustomer = await CustomerModel.findOne({ referenceNumber })
      .select('name username referenceNumber referralLevel');

    if (!referralCustomer) {
      return res.status(404).json({
        success: false,
        message: 'Invalid reference number'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Valid reference number',
      data: {
        referralCustomer: {
          name: referralCustomer.name,
          username: referralCustomer.username,
          referenceNumber: referralCustomer.referenceNumber,
          referralLevel: referralCustomer.referralLevel
        }
      }
    });

  } catch (error) {
    console.error('Validate referral code error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get referral statistics
module.exports.getReferralStats = async (req, res) => {
  try {
    const customerId = req.user.Customer_id || req.user.CustomerId || req.user.customer_id || req.user.customerId;
    
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID not found in token'
      });
    }

    const customer = await CustomerModel.findById(customerId);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get referrals by level
    const referralsByLevel = await CustomerModel.aggregate([
      {
        $match: {
          $or: [
            { parentCustomer: customer._id },
            { referredBy: customer.referenceNumber }
          ]
        }
      },
      {
        $group: {
          _id: '$referralLevel',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get recent referrals (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentReferrals = await CustomerModel.countDocuments({
      parentCustomer: customerId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          myReferenceNumber: customer.referenceNumber,
          totalReferrals: customer.totalReferrals,
          directReferrals: customer.directReferrals,
          referralLevel: customer.referralLevel,
          recentReferrals: recentReferrals,
          referralsByLevel: referralsByLevel
        }
      }
    });

  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
