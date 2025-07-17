const mongoose = require('mongoose');
require('dotenv').config({ path: './config/.env' });

const CustomerModel = require('./model/Customer');

async function createTestData() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to MongoDB');

        // Clear existing customers
        await CustomerModel.deleteMany({});
        console.log('Cleared existing customers');

        // Create test customers
        const testCustomers = [
            {
                username: 'john_doe',
                email: 'john@example.com',
                phone: '+1234567890',
                gender: 'Male',
                referenceNumber: '123456'
            },
            {
                username: 'jane_smith',
                email: 'jane@example.com',
                phone: '+1234567891',
                gender: 'Female',
                referenceNumber: '123457'
            },
            {
                username: 'bob_wilson',
                email: 'bob@example.com',
                phone: '+1234567892',
                gender: 'Male',
                referenceNumber: '123458'
            },
            {
                username: 'alice_brown',
                email: 'alice@example.com',
                phone: '+1234567893',
                gender: 'Female',
                referenceNumber: '123459'
            },
            {
                username: 'charlie_davis',
                email: 'charlie@example.com',
                phone: '+1234567894',
                gender: 'Male',
                referenceNumber: '123460'
            }
        ];

        const createdCustomers = await CustomerModel.insertMany(testCustomers);
        console.log(`Created ${createdCustomers.length} test customers`);

        // Display created customers
        console.log('\nCreated customers:');
        createdCustomers.forEach((customer, index) => {
            console.log(`${index + 1}. ${customer.username} (${customer.email}) - ${customer.referenceNumber}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error creating test data:', error);
        process.exit(1);
    }
}

createTestData();
