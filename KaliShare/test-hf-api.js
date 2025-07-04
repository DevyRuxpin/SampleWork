const axios = require('axios');
require('dotenv').config();

const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;

console.log('🧪 Testing Hugging Face API Setup...\n');

if (!HF_API_KEY) {
  console.log('❌ No API key found in environment');
  process.exit(1);
}

console.log('✅ API key found in environment');
console.log(`🔑 Key starts with: ${HF_API_KEY.substring(0, 10)}...\n`);

// Models that are definitely available on public HF Inference API
const models = [
  'google/flan-t5-base',
  'bigscience/bloomz-560m',
  'microsoft/DialoGPT-small',
  'gpt2',
  'distilgpt2'
];

async function testModel(modelName) {
  try {
    console.log(`🚀 Testing model: ${modelName}`);
    
    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${modelName}`,
      {
        inputs: "Hello, how are you?",
        parameters: {
          max_length: 50,
          temperature: 0.7
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    console.log(`✅ Model ${modelName} works!`);
    console.log(`📝 Response: ${JSON.stringify(response.data, null, 2)}`);
    return true;
  } catch (error) {
    console.log(`❌ Model ${modelName} failed: ${error.response?.status} ${error.response?.statusText}`);
    if (error.response?.data) {
      console.log(`   Error details: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

async function testAllModels() {
  let workingModel = null;
  
  for (const model of models) {
    const success = await testModel(model);
    if (success) {
      workingModel = model;
      break;
    }
    console.log(''); // Add spacing between tests
  }
  
  if (workingModel) {
    console.log(`\n🎉 Found working model: ${workingModel}`);
    console.log('💡 You can use this model in your backend!');
  } else {
    console.log('\n❌ None of the tested models worked.');
    console.log('💡 This suggests the models may not be available for public inference.');
    console.log('🔗 Check https://huggingface.co/models?pipeline_tag=text-generation&sort=downloads for available models');
  }
}

testAllModels(); 