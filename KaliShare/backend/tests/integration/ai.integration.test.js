const request = require('supertest');
const express = require('express');
const axios = require('axios');

// Mock axios for external API calls
jest.mock('axios');

// Mock Hugging Face client
const mockHfClient = {
  textGeneration: jest.fn()
};

jest.mock('@huggingface/inference', () => ({
  InferenceClient: jest.fn(() => mockHfClient)
}));

// Mock database
const mockPool = {
  query: jest.fn()
};

jest.mock('../database/db', () => ({
  pool: mockPool,
  query: jest.fn()
}));

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn((token, secret, callback) => {
    if (token === 'valid-token') {
      callback(null, { id: 1, email: 'test@example.com' });
    } else {
      callback(new Error('Invalid token'));
    }
  })
}));

const aiRoutes = require('../routes/ai');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/ai', aiRoutes);

describe('AI Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HUGGING_FACE_API_KEY = 'test-api-key';
  });

  describe('POST /api/ai/chat', () => {
    it('should successfully generate AI response', async () => {
      const mockAiResponse = {
        generated_text: 'This is a helpful response about JavaScript.'
      };

      mockHfClient.textGeneration.mockResolvedValueOnce(mockAiResponse);

      const chatData = {
        message: 'How do I use async/await in JavaScript?',
        category: 'javascript'
      };

      const response = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', 'Bearer valid-token')
        .send(chatData)
        .expect(200);

      expect(response.body).toHaveProperty('response');
      expect(response.body).toHaveProperty('category');
      expect(response.body.category).toBe('javascript');
      expect(response.body.response).toContain('JavaScript');
    });

    it('should use local knowledge base for specific queries', async () => {
      const chatData = {
        message: 'What is async/await?',
        category: 'javascript'
      };

      const response = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', 'Bearer valid-token')
        .send(chatData)
        .expect(200);

      expect(response.body).toHaveProperty('response');
      expect(response.body).toHaveProperty('source');
      expect(response.body.source).toBe('local');
      expect(response.body.response).toContain('async/await');
    });

    it('should handle Hugging Face API errors gracefully', async () => {
      mockHfClient.textGeneration.mockRejectedValueOnce(new Error('API rate limit exceeded'));

      const chatData = {
        message: 'Tell me about React hooks',
        category: 'react'
      };

      const response = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', 'Bearer valid-token')
        .send(chatData)
        .expect(200);

      expect(response.body).toHaveProperty('response');
      expect(response.body).toHaveProperty('source');
      expect(response.body.source).toBe('fallback');
    });

    it('should return 400 for empty message', async () => {
      const chatData = {
        message: '',
        category: 'general'
      };

      const response = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', 'Bearer valid-token')
        .send(chatData)
        .expect(400);

      expect(response.body.error).toBe('Message is required');
    });

    it('should return 401 without valid token', async () => {
      const chatData = {
        message: 'Test message',
        category: 'general'
      };

      const response = await request(app)
        .post('/api/ai/chat')
        .send(chatData)
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    it('should respect rate limiting', async () => {
      // Mock rate limit exceeded
      const chatData = {
        message: 'Test message',
        category: 'general'
      };

      // Make multiple requests to trigger rate limiting
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/ai/chat')
          .set('Authorization', 'Bearer valid-token')
          .send(chatData);

        if (i < 3) {
          expect(response.status).toBe(200);
        } else {
          expect(response.status).toBe(429);
          expect(response.body.error).toContain('Rate limit exceeded');
          break;
        }
      }
    });
  });

  describe('GET /api/ai/resources', () => {
    it('should return educational resources', async () => {
      const mockResources = {
        javascript: [
          {
            title: 'JavaScript Fundamentals',
            url: 'https://example.com/js-fundamentals',
            category: 'javascript'
          }
        ],
        react: [
          {
            title: 'React Hooks Guide',
            url: 'https://example.com/react-hooks',
            category: 'react'
          }
        ]
      };

      // Mock the resource generator
      jest.doMock('../services/resourceGenerator', () => ({
        getCurrentResources: jest.fn(() => mockResources)
      }));

      const response = await request(app)
        .get('/api/ai/resources')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toHaveProperty('javascript');
      expect(response.body).toHaveProperty('react');
      expect(response.body.javascript).toHaveLength(1);
      expect(response.body.react).toHaveLength(1);
    });

    it('should return 401 without valid token', async () => {
      const response = await request(app)
        .get('/api/ai/resources')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('AI Response Caching', () => {
    it('should cache responses for identical queries', async () => {
      const mockAiResponse = {
        generated_text: 'Cached response about JavaScript.'
      };

      mockHfClient.textGeneration.mockResolvedValueOnce(mockAiResponse);

      const chatData = {
        message: 'What is JavaScript?',
        category: 'javascript'
      };

      // First request
      const response1 = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', 'Bearer valid-token')
        .send(chatData)
        .expect(200);

      // Second request (should be cached)
      const response2 = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', 'Bearer valid-token')
        .send(chatData)
        .expect(200);

      expect(response1.body.response).toBe(response2.body.response);
      expect(response2.body.source).toBe('cache');
    });
  });

  describe('Category Detection', () => {
    it('should detect JavaScript category', async () => {
      const chatData = {
        message: 'How do I use async/await in JavaScript?',
        category: 'auto'
      };

      const response = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', 'Bearer valid-token')
        .send(chatData)
        .expect(200);

      expect(response.body.category).toBe('javascript');
    });

    it('should detect React category', async () => {
      const chatData = {
        message: 'How do I use useState hook in React?',
        category: 'auto'
      };

      const response = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', 'Bearer valid-token')
        .send(chatData)
        .expect(200);

      expect(response.body.category).toBe('react');
    });

    it('should default to general category', async () => {
      const chatData = {
        message: 'What is the weather like?',
        category: 'auto'
      };

      const response = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', 'Bearer valid-token')
        .send(chatData)
        .expect(200);

      expect(response.body.category).toBe('general');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing Hugging Face API key', async () => {
      delete process.env.HUGGING_FACE_API_KEY;

      const chatData = {
        message: 'Test message',
        category: 'general'
      };

      const response = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', 'Bearer valid-token')
        .send(chatData)
        .expect(200);

      expect(response.body).toHaveProperty('response');
      expect(response.body.source).toBe('fallback');
    });

    it('should handle network errors', async () => {
      mockHfClient.textGeneration.mockRejectedValueOnce(new Error('Network error'));

      const chatData = {
        message: 'Test message',
        category: 'general'
      };

      const response = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', 'Bearer valid-token')
        .send(chatData)
        .expect(200);

      expect(response.body).toHaveProperty('response');
      expect(response.body.source).toBe('fallback');
    });
  });
}); 