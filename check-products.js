const mongoose = require('mongoose');
const ProductModel = require('./model/Product');
require('dotenv').config({ path: './config/.env' });

async function checkProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.Mongo_DB_Connection);
    console.log('✅ Connected to MongoDB');

    // Count total products
    const totalProducts = await ProductModel.countDocuments();
    console.log(`📊 Total products in database: ${totalProducts}`);

    // Count active products
    const activeProducts = await ProductModel.countDocuments({ isActive: true });
    console.log(`✅ Active products: ${activeProducts}`);

    // Get first few products
    const products = await ProductModel.find({ isActive: true }).limit(3);
    console.log('📦 Sample products:');
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - $${product.price} - Stock: ${product.stock}`);
    });

    // Test the same query as the API
    const query = { isActive: true };
    const apiProducts = await ProductModel.find(query)
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log(`🔍 API query result: ${apiProducts.length} products found`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkProducts();
