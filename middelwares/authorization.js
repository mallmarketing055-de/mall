const authService = require('../services/auth');

module.exports.auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Extract token from "Bearer TOKEN"
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format.'
      });
    }

    // Verify token
    const decoded = await authService.auth(token);
    req.user = decoded;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token.',
      error: error.message
    });
  }
};

// Middleware to check if user is customer
module.exports.isCustomer = (req, res, next) => {
  if (req.user && req.user.Type === 'Customer') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Customer role required.'
    });
  }
};

// Middleware to check if user is admin
module.exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.Type === 'Admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
};
