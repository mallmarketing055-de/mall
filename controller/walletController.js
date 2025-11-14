const Customer = require('../model/Customers');

// ✅ Get wallet balance for the logged-in user
exports.getWalletBalance = async (req, res) => {
  try {
    console.log('Checkout request body:', req.user);
    const customerId = req.user.Customer_id;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Missing customer ID from token'
      });
    }

    const customer = await Customer.findById(customerId).select('username points email');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Wallet balance fetched successfully',
      data: {
        username: customer.username,
        email: customer.email,
        balance: customer.points
      }
    });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching balance',
      error: error.message
    });
  }
};
