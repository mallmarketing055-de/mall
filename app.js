
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');

const initiateDBConnection = require('./config/db');

// Import routes
const customerRoutes = require('./routes/customerRoutes');
const contactRoutes = require('./routes/contactRoutes');
const cartRoutes = require('./routes/cartRoutes');
const referralRoutes = require('./routes/referralRoutes');
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const qrCodeRoutes = require('./routes/qrCodeRoutes');
const walletRoutes = require('./routes/getBalanceRouter');
const filesRoutes = require('./routes/file.Routes');

dotenv.config({
    path: './config/.env',
});

const PORT = process.env.PORT;

const app = express();
app.use(morgan('dev'));
app.use(express.json());
// Configure CORS manually for better control
app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = ['http://localhost:3001', 'http://127.0.0.1:3001', 'http://localhost:3000', 'https://mall-front.onrender.com'];

    console.log(`${req.method} ${req.path} - Origin: ${origin}`);

    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

    if (req.method === 'OPTIONS') {
        console.log('Preflight request received for:', req.path);
        console.log('Request headers:', req.headers);
        res.status(200).end();
        return;
    }

    next();
});

// Serve static files (uploaded images)
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/customers', customerRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/Admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/qrcode', qrCodeRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/files', filesRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

app.listen(PORT, async () => {
    console.log(`Server has been started and is listening to port ${PORT}`);
    // Call the asynchronous function to initiate the DB connection once the server starts listening.
    await initiateDBConnection();
});
