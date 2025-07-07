
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');

const initiateDBConnection = require('./config/db');

// Import routes
const customerRoutes = require('./routes/customerRoutes');
const contactRoutes = require('./routes/contactRoutes');
const cartRoutes = require('./routes/cartRoutes');

dotenv.config({
    path: './config/.env',
});

const PORT = process.env.PORT;

const app = express();
app.use(morgan('dev'));
app.use(express.json());
app.use(cors());

// Serve static files (uploaded images)
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/customers', customerRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/cart', cartRoutes);

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
