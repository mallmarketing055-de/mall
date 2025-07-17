const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: './config/.env' });

// Import models
const AdminModel = require('./model/Admin');
const CustomerModel = require('./model/Customer');
const ProductModel = require('./model/Product');
const TransactionModel = require('./model/Transaction');

async function seedData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB');

    // Create default admin if not exists
    const adminExists = await AdminModel.findOne({ email: 'admin@example.com' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await AdminModel.create({
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword
      });
      console.log('✅ Default admin created: admin@example.com / admin123');
    } else {
      console.log('✅ Admin already exists');
    }

    // Create sample customers if none exist
    const customerCount = await CustomerModel.countDocuments();
    if (customerCount === 0) {
      const sampleCustomers = [
        {
          username: 'john_doe',
          email: 'john@example.com',
          password: await bcrypt.hash('password123', 10),
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '+1234567890',
          referenceNumber: '123456',
          isActive: true
        },
        {
          username: 'jane_smith',
          email: 'jane@example.com',
          password: await bcrypt.hash('password123', 10),
          firstName: 'Jane',
          lastName: 'Smith',
          phoneNumber: '+1234567891',
          referenceNumber: '123457',
          isActive: true
        },
        {
          username: 'bob_wilson',
          email: 'bob@example.com',
          password: await bcrypt.hash('password123', 10),
          firstName: 'Bob',
          lastName: 'Wilson',
          phoneNumber: '+1234567892',
          referenceNumber: '123458',
          isActive: true
        }
      ];

      await CustomerModel.insertMany(sampleCustomers);
      console.log('✅ Sample customers created');
    } else {
      console.log('✅ Customers already exist');
    }

    // Create sample products if none exist
    const productCount = await ProductModel.countDocuments();
    if (productCount === 0) {
      const sampleProducts = [
        {
          name: 'Laptop Computer',
          description: 'High-performance laptop for work and gaming',
          price: 999.99,
          category: 'Electronics',
          sku: 'LAP001',
          barcode: '1234567890123',
          stock: 50,
          isActive: true
        },
        {
          name: 'Wireless Mouse',
          description: 'Ergonomic wireless mouse with long battery life',
          price: 29.99,
          category: 'Electronics',
          sku: 'MOU001',
          barcode: '1234567890124',
          stock: 100,
          isActive: true
        },
        {
          name: 'Office Chair',
          description: 'Comfortable ergonomic office chair',
          price: 199.99,
          category: 'Furniture',
          sku: 'CHR001',
          barcode: '1234567890125',
          stock: 25,
          isActive: true
        }
      ];

      await ProductModel.insertMany(sampleProducts);
      console.log('✅ Sample products created');
    } else {
      console.log('✅ Products already exist');
    }

    // Create sample transactions if none exist
    const transactionCount = await TransactionModel.countDocuments();
    if (transactionCount === 0) {
      const customers = await CustomerModel.find().limit(3);
      const products = await ProductModel.find().limit(3);

      if (customers.length > 0 && products.length > 0) {
        const sampleTransactions = [
          {
            customerId: customers[0]._id,
            productId: products[0]._id,
            quantity: 1,
            amount: products[0].price,
            status: 'completed',
            reference: 'TXN001'
          },
          {
            customerId: customers[1]._id,
            productId: products[1]._id,
            quantity: 2,
            amount: products[1].price * 2,
            status: 'completed',
            reference: 'TXN002'
          },
          {
            customerId: customers[2]._id,
            productId: products[2]._id,
            quantity: 1,
            amount: products[2].price,
            status: 'pending',
            reference: 'TXN003'
          }
        ];

        await TransactionModel.insertMany(sampleTransactions);
        console.log('✅ Sample transactions created');
      }
    } else {
      console.log('✅ Transactions already exist');
    }

    // Display final counts
    const finalCounts = {
      admins: await AdminModel.countDocuments(),
      customers: await CustomerModel.countDocuments(),
      products: await ProductModel.countDocuments(),
      transactions: await TransactionModel.countDocuments()
    };

    console.log('\n📊 Database Summary:');
    console.log(`Admins: ${finalCounts.admins}`);
    console.log(`Customers: ${finalCounts.customers}`);
    console.log(`Products: ${finalCounts.products}`);
    console.log(`Transactions: ${finalCounts.transactions}`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n🔑 Login credentials:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seeding
seedData();
