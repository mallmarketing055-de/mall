const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  try {
    console.log('🧪 Testing API endpoints...\n');

    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Health check:', healthResponse.data);

    // Test admin signup
    console.log('\n2. Testing admin signup...');
    try {
      const signupResponse = await axios.post(`${BASE_URL}/api/Admin/signup`, {
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123'
      });
      console.log('✅ Admin signup successful:', signupResponse.data);
    } catch (error) {
      if (error.response && error.response.status === 409) {
        console.log('ℹ️ Admin already exists');
      } else {
        console.log('❌ Admin signup error:', error.response?.data || error.message);
      }
    }

    // Test admin login
    console.log('\n3. Testing admin login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/Admin/signin`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    console.log('✅ Admin login successful');
    const token = loginResponse.data.data.token;

    // Test protected endpoints with token
    const headers = { Authorization: `Bearer ${token}` };

    console.log('\n4. Testing customer stats...');
    const customerStatsResponse = await axios.get(`${BASE_URL}/api/customers/stats`, { headers });
    console.log('✅ Customer stats:', customerStatsResponse.data);

    console.log('\n5. Testing transaction stats...');
    const transactionStatsResponse = await axios.get(`${BASE_URL}/api/transactions/stats`, { headers });
    console.log('✅ Transaction stats:', transactionStatsResponse.data);

    console.log('\n6. Testing admin list...');
    const adminListResponse = await axios.get(`${BASE_URL}/api/Admin/all`, { headers });
    console.log('✅ Admin list:', adminListResponse.data);

    console.log('\n7. Testing products...');
    const productsResponse = await axios.get(`${BASE_URL}/api/products?limit=1`, { headers });
    console.log('✅ Products:', productsResponse.data);

    console.log('\n🎉 All API tests completed successfully!');

  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
  }
}

testAPI();
