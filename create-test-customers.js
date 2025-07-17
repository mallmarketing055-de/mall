const mongoose = require('mongoose');
require('dotenv').config({ path: './config/.env' });

const CustomerModel = require('./model/Customer');

async function createTestCustomers() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB');

    // Check if customers already exist
    const existingCount = await CustomerModel.countDocuments();
    console.log(`Existing customers: ${existingCount}`);

    if (existingCount > 0) {
      console.log('Customers already exist. Skipping creation.');
      process.exit(0);
    }

    // Create test customers
    const testCustomers = [
      {
        name: 'John Doe',
        username: 'johndoe',
        email: 'john@example.com',
        phone: '+1234567890',
        gender: 'Male',
        password: 'password123', // This will be hashed by the model
        referenceNumber: '123456'
      },
      {
        name: 'Jane Smith',
        username: 'janesmith',
        email: 'jane@example.com',
        phone: '+1234567891',
        gender: 'Female',
        password: 'password123',
        referenceNumber: '123457'
      },
      {
        name: 'Bob Johnson',
        username: 'bobjohnson',
        email: 'bob@example.com',
        phone: '+1234567892',
        gender: 'Male',
        password: 'password123',
        referenceNumber: '123458'
      },
      {
        name: 'Alice Brown',
        username: 'alicebrown',
        email: 'alice@example.com',
        phone: '+1234567893',
        gender: 'Female',
        password: 'password123',
        referenceNumber: '123459'
      },
      {
        name: 'Charlie Wilson',
        username: 'charliewilson',
        email: 'charlie@example.com',
        phone: '+1234567894',
        gender: 'Male',
        password: 'password123',
        referenceNumber: '123460'
      }
    ];

    console.log('Creating test customers...');
    
    for (const customerData of testCustomers) {
      const customer = new CustomerModel(customerData);
      await customer.save();
      console.log(`Created customer: ${customer.name} (${customer.email})`);
    }

    console.log('Test customers created successfully!');
    
    // Verify creation
    const finalCount = await CustomerModel.countDocuments();
    console.log(`Total customers now: ${finalCount}`);

    process.exit(0);
  } catch (error) {
    console.error('Error creating test customers:', error);
    process.exit(1);
  }
}

createTestCustomers();
