// Simple test to check API connection
const testAPI = async () => {
  try {
    console.log('Testing API connection...');
    
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:3000/api/health');
    const healthData = await healthResponse.json();
    console.log('Health check:', healthData);
    
    // Test products endpoint
    const productsResponse = await fetch('http://localhost:3000/api/products');
    const productsData = await productsResponse.json();
    console.log('Products response:', productsData);
    
    if (productsData.success && productsData.data && productsData.data.products) {
      console.log('✅ Products found:', productsData.data.products.length);
      console.log('First product:', productsData.data.products[0]);
    } else {
      console.log('❌ No products found or unexpected structure');
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error);
  }
};

// Run test when this file is imported
testAPI();

export default testAPI;
