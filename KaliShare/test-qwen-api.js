const { InferenceClient } = require('@huggingface/inference');
require('dotenv').config();

const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;

console.log('🧪 Testing Qwen3-235B Model Integration...\n');

if (!HF_API_KEY) {
  console.log('❌ No API key found in environment');
  console.log('💡 Make sure your .env file contains HUGGING_FACE_API_KEY');
  process.exit(1);
}

console.log('✅ API key found in environment');
console.log(`🔑 Key starts with: ${HF_API_KEY.substring(0, 10)}...\n`);

// Initialize the client
const client = new InferenceClient(HF_API_KEY);

async function testQwenModel() {
  try {
    console.log('🚀 Testing Qwen3-235B model...');
    
    const chatCompletion = await client.chatCompletion({
      provider: "hf-inference",
      model: "Qwen/Qwen3-235B-A22B",
      messages: [
        {
          role: "user",
          content: "What is JavaScript and how is it used in web development?"
        },
      ],
      parameters: {
        max_tokens: 500,
        temperature: 0.7,
        top_p: 0.9
      }
    });

    console.log('✅ Qwen3-235B API call successful!');
    console.log('\n📝 Response:');
    console.log('='.repeat(50));
    console.log(chatCompletion.choices[0].message.content);
    console.log('='.repeat(50));
    
    console.log('\n🎉 Qwen3-235B model is working perfectly!');
    console.log('💡 Your KaliShare AI integration is ready to use this powerful model.');
    
  } catch (error) {
    console.log('❌ Qwen3-235B API call failed:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.message}`);
    
    if (error.response?.data) {
      console.log(`   Error details: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    if (error.response?.status === 403) {
      console.log('\n💡 This might be because:');
      console.log('   - Your account needs Pro/Enterprise access for this model');
      console.log('   - The model is not available for public inference');
      console.log('   - Check your Hugging Face subscription level');
    }
    
    if (error.response?.status === 404) {
      console.log('\n💡 This might be because:');
      console.log('   - The model is not available for hosted inference');
      console.log('   - Check the model page for "Hosted inference API" support');
    }
  }
}

testQwenModel(); 