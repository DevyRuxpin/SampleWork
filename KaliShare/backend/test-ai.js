const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testAI() {
  try {
    console.log('🧪 Testing AI Integration...\n');

    // Step 1: Create a test user
    console.log('1. Creating test user...');
    const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, {
      email: 'ai-test@example.com',
      password: 'testpass123'
    });
    
    const token = signupResponse.data.token;
    console.log('✅ Test user created and token obtained\n');

    // Step 2: Test AI with PostgreSQL question
    console.log('2. Testing AI with PostgreSQL question...');
    const aiResponse = await axios.post(`${BASE_URL}/ai/ask`, {
      question: 'explain postgresql to me',
      category: 'database'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ AI Response received:');
    console.log('Source:', aiResponse.data.source);
    console.log('Cached:', aiResponse.data.cached);
    console.log('Response length:', aiResponse.data.response?.length || 0);
    console.log('\nFirst 200 characters of response:');
    console.log(aiResponse.data.response?.substring(0, 200) + '...\n');

    // Step 3: Test AI with Express.js question
    console.log('3. Testing AI with Express.js question...');
    const expressResponse = await axios.post(`${BASE_URL}/ai/ask`, {
      question: 'how do I use express.js?',
      category: 'nodejs'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Express.js Response received:');
    console.log('Source:', expressResponse.data.source);
    console.log('Cached:', expressResponse.data.cached);
    console.log('Response length:', expressResponse.data.response?.length || 0);
    console.log('\nFirst 200 characters of response:');
    console.log(expressResponse.data.response?.substring(0, 200) + '...\n');

    console.log('🎉 All AI tests passed! The AI integration is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 400 && error.response?.data?.error === 'User already exists') {
      console.log('\n🔄 User already exists, trying to login...');
      
      try {
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
          email: 'ai-test@example.com',
          password: 'testpass123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful, continuing with AI tests...\n');
        
        // Continue with AI tests using the login token
        const aiResponse = await axios.post(`${BASE_URL}/ai/ask`, {
          question: 'explain postgresql to me',
          category: 'database'
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ AI Response received:');
        console.log('Source:', aiResponse.data.source);
        console.log('Cached:', aiResponse.data.cached);
        console.log('Response length:', aiResponse.data.response?.length || 0);
        console.log('\nFirst 200 characters of response:');
        console.log(aiResponse.data.response?.substring(0, 200) + '...\n');

        console.log('🎉 AI test passed! The AI integration is working correctly.');
        
      } catch (loginError) {
        console.error('❌ Login failed:', loginError.response?.data || loginError.message);
      }
    }
  }
}

testAI(); 