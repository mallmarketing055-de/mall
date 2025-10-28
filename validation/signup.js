const {check}=require('express-validator');

module.exports.validatePostUser=()=>{
    const validationMiddleware=[
        check('name')
            .notEmpty()
            .withMessage('Name cannot be empty')
            .isLength({ min: 2, max: 50 })
            .withMessage('Name must be between 2 and 50 characters'),

        check('username')
            .notEmpty()
            .withMessage('Username cannot be empty')
            .isLength({ min: 3, max: 30 })
            .withMessage('Username must be between 3 and 30 characters')
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Username can only contain letters, numbers, and underscores'),

        check('email')
            .isEmail()
            .withMessage('Email is invalid')
            .normalizeEmail(),

        check('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long')
            .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
            .withMessage('Password must contain at least one letter and one number'),

        check('phone')
            .notEmpty()
            .withMessage('Phone number cannot be empty')
            .isMobilePhone()
            .withMessage('Please provide a valid phone number'),

        check('Address')
            .notEmpty()
            .withMessage('Address cannot be empty')
            .isLength({ min: 5, max: 200 })
            .withMessage('Address must be between 5 and 200 characters'),

        check('DOB')
            .notEmpty()
            .withMessage('Date of birth cannot be empty')
            .isISO8601()
            .withMessage('Please provide a valid date format (YYYY-MM-DD)'),

        check('Gender')
            .notEmpty()
            .withMessage('Gender cannot be empty')
            .isIn(['male', 'female', 'ذكر', 'أنثى'])
            .withMessage('Gender must be either male, female, ذكر, or أنثى'),

        check('communicationType')
            .notEmpty()
            .withMessage('Communication type cannot be empty')
            .isIn(['email', 'phone', 'both', 'بريد إلكتروني', 'هاتف', 'كلاهما'])
            .withMessage('Invalid communication type'),

        check('referredBy')
            .optional()
            .matches(/^\d{6}$/)
            .withMessage('Referral code must be a 6-digit number')

        // Note: profilePicture is handled as file upload, not in body validation
    ]
    return validationMiddleware;
}

module.exports.validateLogin=()=>{
    const validationMiddleware=[
        check('username')
            .notEmpty()
            .withMessage('Username cannot be empty'),

        check('password')
            .notEmpty()
            .withMessage('Password cannot be empty')
    ]
    return validationMiddleware;
}

module.exports.validateUpdateProfile=()=>{
    const validationMiddleware=[
        check('name')
            .optional()
            .isLength({ min: 2, max: 50 })
            .withMessage('Name must be between 2 and 50 characters'),

        check('username')
            .optional()
            .isLength({ min: 3, max: 30 })
            .withMessage('Username must be between 3 and 30 characters')
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Username can only contain letters, numbers, and underscores'),

        check('email')
            .optional()
            .isEmail()
            .withMessage('Email is invalid')
            .normalizeEmail(),

        check('phone')
            .optional()
            .isMobilePhone()
            .withMessage('Please provide a valid phone number'),

        check('Address')
            .optional()
            .isLength({ min: 5, max: 200 })
            .withMessage('Address must be between 5 and 200 characters'),

        check('DOB')
            .optional()
            .isISO8601()
            .withMessage('Please provide a valid date format (YYYY-MM-DD)'),

        check('Gender')
            .optional()
            .isIn(['male', 'female', 'ذكر', 'أنثى'])
            .withMessage('Gender must be either male, female, ذكر, or أنثى'),

        check('communicationType')
            .optional()
            .isIn(['email', 'phone', 'both', 'بريد إلكتروني', 'هاتف', 'كلاهما'])
            .withMessage('Invalid communication type')
    ]
    return validationMiddleware;
}

module.exports.validateContactForm=()=>{
    const validationMiddleware=[
        check('email')
            .isEmail()
            .withMessage('Please provide a valid email address')
            .normalizeEmail(),

        check('idNumber')
            .notEmpty()
            .withMessage('ID number cannot be empty')
            .isLength({ min: 5, max: 20 })
            .withMessage('ID number must be between 5 and 20 characters')
            .matches(/^[a-zA-Z0-9]+$/)
            .withMessage('ID number can only contain letters and numbers'),

        check('communicationType')
            .notEmpty()
            .withMessage('Communication type cannot be empty')
            .isIn(['email', 'phone', 'both', 'بريد إلكتروني', 'هاتف', 'كلاهما'])
            .withMessage('Invalid communication type'),

        check('message')
            .notEmpty()
            .withMessage('Message cannot be empty')
            .isLength({ min: 10, max: 1000 })
            .withMessage('Message must be between 10 and 1000 characters'),

        check('phone')
            .optional()
            .isMobilePhone()
            .withMessage('Please provide a valid phone number'),

        check('priority')
            .optional()
            .isIn(['low', 'medium', 'high', 'urgent'])
            .withMessage('Invalid priority level')
    ]
    return validationMiddleware;
}

module.exports.validateAddToCart=()=>{
    const validationMiddleware=[
        check('productId')
            .notEmpty()
            .withMessage('Product ID cannot be empty')
            .isString()
            .withMessage('Product ID must be a string'),

        check('productName')
            .notEmpty()
            .withMessage('Product name cannot be empty')
            .isLength({ min: 1, max: 200 })
            .withMessage('Product name must be between 1 and 200 characters'),

        check('productNameArabic')
            .notEmpty()
            .withMessage('Arabic product name cannot be empty')
            .isLength({ min: 1, max: 200 })
            .withMessage('Arabic product name must be between 1 and 200 characters'),

        check('price')
            .notEmpty()
            .withMessage('Price cannot be empty')
            .isNumeric()
            .withMessage('Price must be a number')
            .custom((value) => {
                if (value < 0) {
                    throw new Error('Price cannot be negative');
                }
                return true;
            }),

        check('quantity')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Quantity must be a positive integer'),

        check('unit')
            .optional()
            .isLength({ max: 50 })
            .withMessage('Unit cannot exceed 50 characters'),

        check('image')
            .optional()
            .isString()
            .withMessage('Image must be a string')
    ]
    return validationMiddleware;
}

module.exports.validateUpdateCart=()=>{
    const validationMiddleware=[
        check('productId')
            .notEmpty()
            .withMessage('Product ID cannot be empty')
            .isString()
            .withMessage('Product ID must be a string'),

        check('quantity')
            .notEmpty()
            .withMessage('Quantity cannot be empty')
            .isInt({ min: 0 })
            .withMessage('Quantity must be a non-negative integer')
    ]
    return validationMiddleware;
}

module.exports.validateAddCard=()=>{
    const validationMiddleware=[
        check('cardNumber')
            .notEmpty()
            .withMessage('Card number cannot be empty')
            .matches(/^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/)
            .withMessage('Card number must be 16 digits (spaces optional)'),

        check('cardHolderName')
            .notEmpty()
            .withMessage('Card holder name cannot be empty')
            .isLength({ min: 2, max: 100 })
            .withMessage('Card holder name must be between 2 and 100 characters'),

        check('expiryMonth')
            .notEmpty()
            .withMessage('Expiry month cannot be empty')
            .matches(/^(0[1-9]|1[0-2])$/)
            .withMessage('Expiry month must be between 01 and 12'),

        check('expiryYear')
            .notEmpty()
            .withMessage('Expiry year cannot be empty')
            .matches(/^\d{2}$/)
            .withMessage('Expiry year must be 2 digits (YY format)'),

        check('cvv')
            .notEmpty()
            .withMessage('CVV cannot be empty')
            .matches(/^\d{3,4}$/)
            .withMessage('CVV must be 3 or 4 digits'),

        check('billingAddress.street')
            .notEmpty()
            .withMessage('Billing street address cannot be empty')
            .isLength({ max: 200 })
            .withMessage('Street address cannot exceed 200 characters'),

        check('billingAddress.city')
            .notEmpty()
            .withMessage('Billing city cannot be empty')
            .isLength({ max: 100 })
            .withMessage('City cannot exceed 100 characters'),

        check('billingAddress.state')
            .notEmpty()
            .withMessage('Billing state cannot be empty')
            .isLength({ max: 100 })
            .withMessage('State cannot exceed 100 characters'),

        check('billingAddress.zipCode')
            .notEmpty()
            .withMessage('Billing zip code cannot be empty')
            .isLength({ max: 20 })
            .withMessage('Zip code cannot exceed 20 characters'),

        check('billingAddress.country')
            .optional()
            .isLength({ max: 100 })
            .withMessage('Country cannot exceed 100 characters'),

        check('isDefault')
            .optional()
            .isBoolean()
            .withMessage('isDefault must be a boolean value')
    ]
    return validationMiddleware;
}

module.exports.validateUpdateCard=()=>{
    const validationMiddleware=[
        check('cardHolderName')
            .optional()
            .isLength({ min: 2, max: 100 })
            .withMessage('Card holder name must be between 2 and 100 characters'),

        check('expiryMonth')
            .optional()
            .matches(/^(0[1-9]|1[0-2])$/)
            .withMessage('Expiry month must be between 01 and 12'),

        check('expiryYear')
            .optional()
            .matches(/^\d{2}$/)
            .withMessage('Expiry year must be 2 digits (YY format)'),

        check('billingAddress.street')
            .optional()
            .isLength({ max: 200 })
            .withMessage('Street address cannot exceed 200 characters'),

        check('billingAddress.city')
            .optional()
            .isLength({ max: 100 })
            .withMessage('City cannot exceed 100 characters'),

        check('billingAddress.state')
            .optional()
            .isLength({ max: 100 })
            .withMessage('State cannot exceed 100 characters'),

        check('billingAddress.zipCode')
            .optional()
            .isLength({ max: 20 })
            .withMessage('Zip code cannot exceed 20 characters'),

        check('billingAddress.country')
            .optional()
            .isLength({ max: 100 })
            .withMessage('Country cannot exceed 100 characters'),

        check('isDefault')
            .optional()
            .isBoolean()
            .withMessage('isDefault must be a boolean value'),

        check('isActive')
            .optional()
            .isBoolean()
            .withMessage('isActive must be a boolean value')
    ]
    return validationMiddleware;
}

module.exports.validateAdminSignup=()=>{
    const validationMiddleware=[
        check('username')
            .notEmpty()
            .withMessage('Username cannot be empty')
            .isLength({ min: 3, max: 50 })
            .withMessage('Username must be between 3 and 50 characters')
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Username can only contain letters, numbers, and underscores'),

        check('email')
            .isEmail()
            .withMessage('Email is invalid')
            .normalizeEmail(),

        check('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long')
    ]
    return validationMiddleware;
}

module.exports.validateAdminLogin=()=>{
    const validationMiddleware=[
        check('email')
            .notEmpty()
            .withMessage('Email cannot be empty')
            .isEmail()
            .withMessage('Please provide a valid email'),

        check('password')
            .notEmpty()
            .withMessage('Password cannot be empty')
    ]
    return validationMiddleware;
}

module.exports.validateProduct=()=>{
    const validationMiddleware=[
        check('name')
            .notEmpty()
            .withMessage('Product name cannot be empty')
            .isLength({ min: 1, max: 200 })
            .withMessage('Product name must be between 1 and 200 characters'),

        check('nameArabic')
            .notEmpty()
            .withMessage('Arabic product name cannot be empty')
            .isLength({ min: 1, max: 200 })
            .withMessage('Arabic product name must be between 1 and 200 characters'),

        check('price')
            .notEmpty()
            .withMessage('Price cannot be empty')
            .isNumeric()
            .withMessage('Price must be a number')
            .custom((value) => {
                if (value < 0) {
                    throw new Error('Price cannot be negative');
                }
                return true;
            }),

        check('percentage')
            .notEmpty()
            .withMessage('percentage cannot be empty')
            .isNumeric()
            .withMessage('percentage must be a number')
            .custom((value) => {
                if (value < 0) {
                    throw new Error('percentage cannot be negative');
                }
                return true;
            }),
        check('category')
            .notEmpty()
            .withMessage('Category cannot be empty')
            .isLength({ min: 1, max: 100 })
            .withMessage('Category must be between 1 and 100 characters'),

        check('stock')
            .notEmpty()
            .withMessage('Stock cannot be empty')
            .isInt({ min: 0 })
            .withMessage('Stock must be a non-negative integer'),

        check('description')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Description cannot exceed 1000 characters'),

        check('descriptionArabic')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Arabic description cannot exceed 1000 characters'),

        check('image')
            .optional()
            .isString()
            .withMessage('Image must be a string'),

        check('weight')
            .optional()
            .isNumeric()
            .withMessage('Weight must be a number')
            .custom((value) => {
                if (value < 0) {
                    throw new Error('Weight cannot be negative');
                }
                return true;
            }),

        check('manufacturer')
            .optional()
            .isLength({ max: 100 })
            .withMessage('Manufacturer cannot exceed 100 characters'),

        check('warranty')
            .optional()
            .isLength({ max: 100 })
            .withMessage('Warranty cannot exceed 100 characters')
    ]
    return validationMiddleware;
}

module.exports.validateTransaction=()=>{
    const validationMiddleware=[
        check('customerId')
            .notEmpty()
            .withMessage('Customer ID cannot be empty')
            .isMongoId()
            .withMessage('Customer ID must be a valid MongoDB ObjectId'),

        check('amount')
            .notEmpty()
            .withMessage('Amount cannot be empty')
            .isNumeric()
            .withMessage('Amount must be a number')
            .custom((value) => {
                if (value <= 0) {
                    throw new Error('Amount must be greater than 0');
                }
                return true;
            }),

        check('type')
            .notEmpty()
            .withMessage('Transaction type cannot be empty')
            .isIn(['purchase', 'refund', 'payment', 'withdrawal', 'deposit'])
            .withMessage('Invalid transaction type'),

        check('paymentMethod')
            .optional()
            .isIn(['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash', 'wallet'])
            .withMessage('Invalid payment method'),

        check('description')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Description cannot exceed 500 characters'),

        check('currency')
            .optional()
            .isIn(['USD', 'SAR', 'AED', 'EGP'])
            .withMessage('Invalid currency'),

        check('items')
            .optional()
            .isArray()
            .withMessage('Items must be an array'),

        check('items.*.productId')
            .if(check('items').exists())
            .notEmpty()
            .withMessage('Product ID is required for each item'),

        check('items.*.quantity')
            .if(check('items').exists())
            .isInt({ min: 1 })
            .withMessage('Quantity must be a positive integer'),

        check('items.*.price')
            .if(check('items').exists())
            .isNumeric()
            .withMessage('Price must be a number')
            .custom((value) => {
                if (value < 0) {
                    throw new Error('Price cannot be negative');
                }
                return true;
            })
    ]
    return validationMiddleware;
}