const mongoose = require('mongoose');
const TransactionModel = require('./model/Transaction');
const CustomerModel = require('./model/Customers');
require('dotenv').config({ path: './config/.env' });

async function checkTransactions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.Mongo_DB_Connection);
    console.log('✅ Connected to MongoDB');

    // Count total transactions
    const totalTransactions = await TransactionModel.countDocuments();
    console.log(`📊 Total transactions in database: ${totalTransactions}`);

    if (totalTransactions === 0) {
      console.log('🔄 Creating sample transactions...');
      
      // Get or create a sample customer
      let customer = await CustomerModel.findOne();
      if (!customer) {
        customer = new CustomerModel({
          name: 'John Doe',
          username: 'johndoe',
          email: 'john@example.com',
          password: 'hashedpassword',
          phone: '+1234567890'
        });
        await customer.save();
        console.log('✅ Created sample customer');
      }

      // Create sample transactions
      const sampleTransactions = [
        {
          customerId: customer._id,
          userName: customer.name,
          userEmail: customer.email,
          amount: 99.99,
          status: 'completed',
          type: 'purchase',
          description: 'Product purchase',
          paymentMethod: 'credit_card',
          items: [{
            productId: '507f1f77bcf86cd799439011',
            productName: 'Sample Product 1',
            quantity: 2,
            price: 49.99,
            subtotal: 99.98
          }]
        },
        {
          customerId: customer._id,
          userName: customer.name,
          userEmail: customer.email,
          amount: 149.50,
          status: 'pending',
          type: 'purchase',
          description: 'Another purchase',
          paymentMethod: 'paypal',
          items: [{
            productId: '507f1f77bcf86cd799439012',
            productName: 'Sample Product 2',
            quantity: 1,
            price: 149.50,
            subtotal: 149.50
          }]
        },
        {
          customerId: customer._id,
          userName: customer.name,
          userEmail: customer.email,
          amount: 75.25,
          status: 'failed',
          type: 'purchase',
          description: 'Failed transaction',
          paymentMethod: 'credit_card',
          failureReason: 'Insufficient funds',
          items: [{
            productId: '507f1f77bcf86cd799439013',
            productName: 'Sample Product 3',
            quantity: 1,
            price: 75.25,
            subtotal: 75.25
          }]
        }
      ];

      await TransactionModel.insertMany(sampleTransactions);
      console.log('✅ Created 3 sample transactions');
    }

    // Get recent transactions
    const recentTransactions = await TransactionModel.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customerId', 'name username email');

    console.log('\n📦 Recent transactions:');
    recentTransactions.forEach((transaction, index) => {
      console.log(`${index + 1}. ${transaction.reference} - $${transaction.amount} - ${transaction.status} - ${transaction.userName}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkTransactions();
