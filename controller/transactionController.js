const { validationResult } = require('express-validator');
const TransactionModel = require('../model/Transaction');
const CustomerModel = require('../model/Customers');

// Get All Transactions (Admin)
module.exports.getAllTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const type = req.query.type || '';
    const dateFrom = req.query.dateFrom;
    const dateTo = req.query.dateTo;
    const minAmount = req.query.minAmount ? parseFloat(req.query.minAmount) : undefined;
    const maxAmount = req.query.maxAmount ? parseFloat(req.query.maxAmount) : undefined;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { reference: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) query.status = status;
    if (type) query.type = type;
    if (minAmount !== undefined) query.amount = { ...query.amount, $gte: minAmount };
    if (maxAmount !== undefined) query.amount = { ...query.amount, $lte: maxAmount };
    
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder;

    const transactions = await TransactionModel.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('customerId', 'name username email');

    const totalTransactions = await TransactionModel.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalTransactions / limit),
          totalItems: totalTransactions,
          itemsPerPage: limit
        }
      }
    });

  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get Transaction by ID
module.exports.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await TransactionModel.findById(id)
      .populate('customerId', 'name username email phone');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { transaction }
    });

  } catch (error) {
    console.error('Get transaction by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get User Transactions
module.exports.getUserTransactions = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status || '';
    const type = req.query.type || '';

    const query = { customerId: userId };
    if (status) query.status = status;
    if (type) query.type = type;

    const transactions = await TransactionModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalTransactions = await TransactionModel.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalTransactions / limit),
          totalItems: totalTransactions,
          itemsPerPage: limit
        }
      }
    });

  } catch (error) {
    console.error('Get user transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Create Transaction
module.exports.createTransaction = async (req, res) => {
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

    const transactionData = req.body;

    // Verify customer exists
    const customer = await CustomerModel.findById(transactionData.customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Add customer info to transaction
    transactionData.userName = customer.name;
    transactionData.userEmail = customer.email;

    const newTransaction = new TransactionModel(transactionData);
    await newTransaction.save();

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: { transaction: newTransaction }
    });

  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update Transaction Status
module.exports.updateTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, failureReason, notes } = req.body;

    const transaction = await TransactionModel.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Update transaction
    transaction.status = status;
    if (failureReason) transaction.failureReason = failureReason;
    if (notes) transaction.notes = notes;

    await transaction.save();

    res.status(200).json({
      success: true,
      message: 'Transaction status updated successfully',
      data: { transaction }
    });

  } catch (error) {
    console.error('Update transaction status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Export Transactions
module.exports.exportTransactions = async (req, res) => {
  try {
    const search = req.query.search || '';
    const status = req.query.status || '';
    const type = req.query.type || '';
    const dateFrom = req.query.dateFrom;
    const dateTo = req.query.dateTo;

    // Build query (same as getAllTransactions)
    const query = {};
    
    if (search) {
      query.$or = [
        { reference: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) query.status = status;
    if (type) query.type = type;
    
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const transactions = await TransactionModel.find(query)
      .sort({ createdAt: -1 })
      .populate('customerId', 'name username email');

    // Generate CSV
    const csvHeader = 'Reference,User Name,Email,Amount,Status,Type,Payment Method,Created Date\n';
    const csvData = transactions.map(t => 
      `${t.reference},${t.userName},"${t.userEmail}",${t.amount},${t.status},${t.type},${t.paymentMethod},${t.createdAt.toISOString()}`
    ).join('\n');

    const csv = csvHeader + csvData;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=transactions_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);

  } catch (error) {
    console.error('Export transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get Transaction Statistics
module.exports.getTransactionStats = async (req, res) => {
  try {
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const stats = await TransactionModel.getStats({ startDate, endDate });
    
    // Get monthly growth
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const thisMonthStats = await TransactionModel.getStats({ 
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1) 
    });
    
    const lastMonthStats = await TransactionModel.getStats({ 
      startDate: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 0)
    });

    const monthlyGrowth = lastMonthStats[0] && lastMonthStats[0].totalTransactions > 0
      ? ((thisMonthStats[0]?.totalTransactions || 0) - lastMonthStats[0].totalTransactions) / lastMonthStats[0].totalTransactions * 100
      : 0;

    res.status(200).json({
      success: true,
      data: {
        stats: stats[0] || {
          totalTransactions: 0,
          totalAmount: 0,
          completedTransactions: 0,
          pendingTransactions: 0,
          failedTransactions: 0,
          averageAmount: 0
        },
        monthlyGrowth: Math.round(monthlyGrowth * 100) / 100
      }
    });

  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


// Get User Transactions
module.exports.getUserTransactionsMobile = async (req, res) => {
  try {
    console.log('User ID from token:', req.user);
    const userId = req.user.Customer_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status || '';
    const type = req.query.type || '';

    const query = { customerId: userId };
    if (status) query.status = status;
    if (type) query.type = type;

    const transactions = await TransactionModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalTransactions = await TransactionModel.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalTransactions / limit),
          totalItems: totalTransactions,
          itemsPerPage: limit
        }
      }
    });

  } catch (error) {
    console.error('Get user transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};