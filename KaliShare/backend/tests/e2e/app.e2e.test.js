const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock database
const mockPool = {
  query: jest.fn()
};

jest.mock('../database/db', () => ({
  pool: mockPool,
  query: jest.fn()
}));

// Mock Hugging Face client
const mockHfClient = {
  textGeneration: jest.fn()
};

jest.mock('@huggingface/inference', () => ({
  InferenceClient: jest.fn(() => mockHfClient)
}));

// Import all routes
const authRoutes = require('../routes/auth');
const timelineRoutes = require('../routes/timeline');
const aiRoutes = require('../routes/ai');
const searchRoutes = require('../routes/search');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/search', searchRoutes);

describe('KaliShare End-to-End Tests', () => {
  let authToken;
  let userId;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HUGGING_FACE_API_KEY = 'test-api-key';
  });

  describe('Complete User Journey', () => {
    it('should complete full user registration and interaction flow', async () => {
      // Step 1: User Registration
      const userData = {
        email: 'e2e-test@example.com',
        password: 'password123'
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // No existing user
        .mockResolvedValueOnce({ 
          rows: [{ id: 1, email: userData.email, created_at: new Date() }] 
        }); // New user created

      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      expect(signupResponse.body).toHaveProperty('user');
      expect(signupResponse.body).toHaveProperty('token');
      expect(signupResponse.body.user.email).toBe(userData.email);

      authToken = signupResponse.body.token;
      userId = signupResponse.body.user.id;

      // Step 2: User Login
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: userId,
          email: userData.email,
          password_hash: hashedPassword
        }]
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send(userData)
        .expect(200);

      expect(loginResponse.body).toHaveProperty('user');
      expect(loginResponse.body).toHaveProperty('token');

      // Step 3: Create a Post
      const postData = {
        content: 'E2E test post content',
        livestream_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      };

      const mockPost = {
        _id: 1,
        content: postData.content,
        livestream_url: postData.livestream_url,
        createdAt: new Date(),
        author: { _id: userId, email: userData.email }
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockPost] });

      const postResponse = await request(app)
        .post('/api/timeline')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData)
        .expect(201);

      expect(postResponse.body.content).toBe(postData.content);
      expect(postResponse.body.livestream_url).toBe(postData.livestream_url);

      // Step 4: View Timeline
      const mockUser = { id: userId, email: userData.email };
      const mockPosts = [mockPost];
      const mockComments = [];

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockUser] })
        .mockResolvedValueOnce({ rows: mockPosts })
        .mockResolvedValueOnce({ rows: mockComments })
        .mockResolvedValueOnce({ rows: [] });

      const timelineResponse = await request(app)
        .get('/api/timeline')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(timelineResponse.body).toHaveProperty('posts');
      expect(timelineResponse.body).toHaveProperty('user');
      expect(timelineResponse.body.posts).toHaveLength(1);

      // Step 5: Like the Post
      const mockLike = { id: 1 };

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Post exists
        .mockResolvedValueOnce({ rows: [] }) // No existing like
        .mockResolvedValueOnce({ rows: [mockLike] }); // Like created

      const likeResponse = await request(app)
        .post('/api/timeline/1/like')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(likeResponse.body.message).toBe('Post liked successfully');

      // Step 6: Add Comment
      const commentData = {
        content: 'E2E test comment'
      };

      const mockComment = {
        _id: 1,
        content: commentData.content,
        createdAt: new Date(),
        author: { _id: userId, email: userData.email }
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockComment] });

      const commentResponse = await request(app)
        .post('/api/timeline/1/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData)
        .expect(201);

      expect(commentResponse.body.content).toBe(commentData.content);

      // Step 7: Use AI Chat
      const mockAiResponse = {
        generated_text: 'This is a helpful response about JavaScript.'
      };

      mockHfClient.textGeneration.mockResolvedValueOnce(mockAiResponse);

      const chatData = {
        message: 'How do I use async/await in JavaScript?',
        category: 'javascript'
      };

      const aiResponse = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send(chatData)
        .expect(200);

      expect(aiResponse.body).toHaveProperty('response');
      expect(aiResponse.body).toHaveProperty('category');
      expect(aiResponse.body.category).toBe('javascript');

      // Step 8: Search Posts
      const searchQuery = 'JavaScript';
      const mockSearchResults = [mockPost];

      mockPool.query.mockResolvedValueOnce({ rows: mockSearchResults });

      const searchResponse = await request(app)
        .get(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(searchResponse.body).toHaveProperty('posts');
      expect(searchResponse.body.posts).toHaveLength(1);

      // Step 9: Unlike the Post
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      const unlikeResponse = await request(app)
        .delete('/api/timeline/1/like')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(unlikeResponse.body.message).toBe('Post unliked successfully');

      // Step 10: Delete the Post
      const mockPostForDelete = {
        id: 1,
        user_id: userId,
        content: postData.content
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockPostForDelete] });

      const deleteResponse = await request(app)
        .delete('/api/timeline/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(deleteResponse.body.message).toBe('Post deleted successfully');
    });
  });

  describe('Multi-User Interaction', () => {
    it('should handle interactions between multiple users', async () => {
      // Create two users
      const user1Data = { email: 'user1@example.com', password: 'password123' };
      const user2Data = { email: 'user2@example.com', password: 'password123' };

      // User 1 registration
      mockPool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 1, email: user1Data.email }] });

      const user1Signup = await request(app)
        .post('/api/auth/signup')
        .send(user1Data)
        .expect(201);

      const user1Token = user1Signup.body.token;

      // User 2 registration
      mockPool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 2, email: user2Data.email }] });

      const user2Signup = await request(app)
        .post('/api/auth/signup')
        .send(user2Data)
        .expect(201);

      const user2Token = user2Signup.body.token;

      // User 1 creates a post
      const postData = { content: 'Multi-user test post' };
      const mockPost = {
        _id: 1,
        content: postData.content,
        author: { _id: 1, email: user1Data.email },
        createdAt: new Date()
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockPost] });

      const postResponse = await request(app)
        .post('/api/timeline')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(postData)
        .expect(201);

      // User 2 likes User 1's post
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const likeResponse = await request(app)
        .post('/api/timeline/1/like')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      // User 2 comments on User 1's post
      const commentData = { content: 'Great post!' };
      const mockComment = {
        _id: 1,
        content: commentData.content,
        author: { _id: 2, email: user2Data.email },
        createdAt: new Date()
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockComment] });

      const commentResponse = await request(app)
        .post('/api/timeline/1/comments')
        .set('Authorization', `Bearer ${user2Token}`)
        .send(commentData)
        .expect(201);

      // User 2 should not be able to delete User 1's post
      const mockPostForDelete = {
        id: 1,
        user_id: 1, // User 1's post
        content: postData.content
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockPostForDelete] });

      const deleteResponse = await request(app)
        .delete('/api/timeline/1')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);

      expect(deleteResponse.body.error).toBe('Not authorized to delete this post');
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should handle network failures and recovery', async () => {
      // Simulate database connection failure
      mockPool.query.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/timeline')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body.error).toBe('Internal server error');

      // Simulate recovery
      const mockUser = { id: 1, email: 'test@example.com' };
      const mockPosts = [];

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockUser] })
        .mockResolvedValueOnce({ rows: mockPosts })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const recoveryResponse = await request(app)
        .get('/api/timeline')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(recoveryResponse.body).toHaveProperty('posts');
    });

    it('should handle AI service failures gracefully', async () => {
      // Simulate AI service failure
      mockHfClient.textGeneration.mockRejectedValueOnce(new Error('AI service unavailable'));

      const chatData = {
        message: 'Test message',
        category: 'general'
      };

      const response = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', 'Bearer valid-token')
        .send(chatData)
        .expect(200);

      // Should still return a response (fallback)
      expect(response.body).toHaveProperty('response');
      expect(response.body.source).toBe('fallback');
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple concurrent requests', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      const mockPosts = [];

      mockPool.query
        .mockResolvedValue({ rows: [mockUser] })
        .mockResolvedValue({ rows: mockPosts })
        .mockResolvedValue({ rows: [] })
        .mockResolvedValue({ rows: [] });

      // Make multiple concurrent requests
      const requests = Array(10).fill().map(() =>
        request(app)
          .get('/api/timeline')
          .set('Authorization', 'Bearer valid-token')
      );

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle rate limiting', async () => {
      const chatData = {
        message: 'Test message',
        category: 'general'
      };

      // Make multiple AI requests to trigger rate limiting
      const requests = Array(5).fill().map(() =>
        request(app)
          .post('/api/ai/chat')
          .set('Authorization', 'Bearer valid-token')
          .send(chatData)
      );

      const responses = await Promise.all(requests);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
}); 