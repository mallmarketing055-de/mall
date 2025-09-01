// import mongoose
const mongoose = require('mongoose');

const initiateDBConnection = async () => {
  try {
    await mongoose.connect(process.env.Mongo_DB_Connection, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB successfully!');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
  }
};

// Log connection events for debugging
mongoose.connection.on('connected', () => {
  console.log('📡 Mongoose event: connected');
});

mongoose.connection.on('error', (err) => {
  console.error('⚠️ Mongoose event: error', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose event: disconnected');
});

module.exports = initiateDBConnection;
