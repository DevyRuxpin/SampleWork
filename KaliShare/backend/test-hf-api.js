require('dotenv').config();
const axios = require('axios');

async function testHuggingFaceAPI() {
  const apiKey = process.env.HUGGING_FACE_API_KEY;
  
  console.log('🧪 Testing Hugging Face API Setup...\n');
  
  if (!apiKey || apiKey === 'your_hugging_face_api_key_here') {
    console.log('❌ No valid API key found!');
    console.log('Please follow these steps:');
    console.log('1. Go to https://huggingface.co/');
    console.log('2. Sign up/login and go to Settings > Access Tokens');
    console.log('3. Create a new token with "Read" role');
    console.log('4. Copy the token and update your .env file');
    console.log('5. Replace "your_hugging_face_api_key_here" with your actual token');
    return;
  }
  
  console.log('✅ API key found in environment');
  console.log('🔑 Key starts with:', apiKey.substring(0, 10) + '...');
  
  // Test multiple models to find one that works
  const models = [
    'gpt2',
    'distilgpt2',
    'microsoft/DialoGPT-small',
    'facebook/blenderbot-400M-distill'
  ];
  
  for (const model of models) {
    try {
      console.log(`\n🚀 Testing model: ${model}`);
      const response = await axios.post(`https://api-inference.huggingface.co/models/${model}`, {
        inputs: 'What is JavaScript?',
        parameters: {
          max_length: 50,
          temperature: 0.7,
          do_sample: true
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 10000
      });
      
      if (response.data && (response.data[0]?.generated_text || response.data.generated_text)) {
        console.log('✅ API call successful!');
        const text = response.data[0]?.generated_text || response.data.generated_text;
        console.log('📝 Response preview:', text.substring(0, 100) + '...');
        console.log(`\n🎉 Model ${model} is working!`);
        return model; // Return the working model
      } else {
        console.log('⚠️ API call succeeded but no text generated');
        console.log('Raw response:', JSON.stringify(response.data));
      }
      
    } catch (error) {
      console.log(`❌ Model ${model} failed:`, error.response?.status, error.response?.statusText);
      if (error.response?.status === 503) {
        console.log('⏳ Model is loading - this is normal for first request');
      }
    }
  }
  
  console.log('\n❌ None of the tested models worked. Trying a different approach...');
}

testHuggingFaceAPI(); 