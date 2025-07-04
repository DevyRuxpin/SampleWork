const request = require('supertest');
const express = require('express');

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

const timelineRoutes = require('../routes/timeline');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/timeline', timelineRoutes);

describe('Timeline Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/timeline', () => {
    it('should return timeline with posts and user data', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      const mockPosts = [
        {
          _id: 1,
          content: 'Test post 1',
          livestream_url: null,
          createdAt: new Date(),
          like_count: 2,
          'author._id': 1,
          'author.email': 'test@example.com'
        }
      ];
      const mockComments = [
        {
          _id: 1,
          content: 'Test comment',
          createdAt: new Date(),
          'author._id': 1,
          'author.email': 'test@example.com'
        }
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockUser] }) // User query
        .mockResolvedValueOnce({ rows: mockPosts }) // Posts query
        .mockResolvedValueOnce({ rows: mockComments }) // Comments query
        .mockResolvedValueOnce({ rows: [] }); // User like query

      const response = await request(app)
        .get('/api/timeline')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toHaveProperty('posts');
      expect(response.body).toHaveProperty('user');
      expect(response.body.posts).toHaveLength(1);
      expect(response.body.posts[0].content).toBe('Test post 1');
      expect(response.body.posts[0].likeCount).toBe(2);
      expect(response.body.posts[0].isLiked).toBe(false);
    });

    it('should return 401 without valid token', async () => {
      const response = await request(app)
        .get('/api/timeline')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    it('should handle database errors gracefully', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/timeline')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('POST /api/timeline', () => {
    it('should successfully create a new post', async () => {
      const mockPost = {
        _id: 1,
        content: 'New test post',
        livestream_url: null,
        createdAt: new Date(),
        author: { _id: 1, email: 'test@example.com' }
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockPost] });

      const postData = {
        content: 'New test post'
      };

      const response = await request(app)
        .post('/api/timeline')
        .set('Authorization', 'Bearer valid-token')
        .send(postData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.content).toBe('New test post');
      expect(response.body.author.email).toBe('test@example.com');
    });

    it('should create post with valid livestream URL', async () => {
      const mockPost = {
        _id: 1,
        content: 'Post with livestream',
        livestream_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        createdAt: new Date(),
        author: { _id: 1, email: 'test@example.com' }
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockPost] });

      const postData = {
        content: 'Post with livestream',
        livestream_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      };

      const response = await request(app)
        .post('/api/timeline')
        .set('Authorization', 'Bearer valid-token')
        .send(postData)
        .expect(201);

      expect(response.body.livestream_url).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    });

    it('should reject post with invalid livestream URL', async () => {
      const postData = {
        content: 'Post with invalid URL',
        livestream_url: 'https://invalid-platform.com/stream'
      };

      const response = await request(app)
        .post('/api/timeline')
        .set('Authorization', 'Bearer valid-token')
        .send(postData)
        .expect(400);

      expect(response.body.error).toContain('Invalid livestream URL');
    });

    it('should reject empty post content', async () => {
      const postData = {
        content: ''
      };

      const response = await request(app)
        .post('/api/timeline')
        .set('Authorization', 'Bearer valid-token')
        .send(postData)
        .expect(400);

      expect(response.body.error).toBe('Post content is required');
    });

    it('should return 401 without valid token', async () => {
      const postData = {
        content: 'Test post'
      };

      const response = await request(app)
        .post('/api/timeline')
        .send(postData)
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('POST /api/timeline/:postId/comments', () => {
    it('should successfully add comment to post', async () => {
      const mockComment = {
        _id: 1,
        content: 'New comment',
        createdAt: new Date(),
        author: { _id: 1, email: 'test@example.com' }
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockComment] });

      const commentData = {
        content: 'New comment'
      };

      const response = await request(app)
        .post('/api/timeline/1/comments')
        .set('Authorization', 'Bearer valid-token')
        .send(commentData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.content).toBe('New comment');
      expect(response.body.author.email).toBe('test@example.com');
    });

    it('should reject empty comment content', async () => {
      const commentData = {
        content: ''
      };

      const response = await request(app)
        .post('/api/timeline/1/comments')
        .set('Authorization', 'Bearer valid-token')
        .send(commentData)
        .expect(400);

      expect(response.body.error).toBe('Comment content is required');
    });

    it('should return 404 for non-existent post', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const commentData = {
        content: 'Test comment'
      };

      const response = await request(app)
        .post('/api/timeline/999/comments')
        .set('Authorization', 'Bearer valid-token')
        .send(commentData)
        .expect(404);

      expect(response.body.error).toBe('Post not found');
    });
  });

  describe('DELETE /api/timeline/:postId', () => {
    it('should successfully delete user\'s own post', async () => {
      const mockPost = {
        id: 1,
        user_id: 1,
        content: 'Test post'
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockPost] });

      const response = await request(app)
        .delete('/api/timeline/1')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.message).toBe('Post deleted successfully');
    });

    it('should return 404 for non-existent post', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .delete('/api/timeline/999')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body.error).toBe('Post not found');
    });

    it('should return 403 when trying to delete another user\'s post', async () => {
      const mockPost = {
        id: 1,
        user_id: 2, // Different user
        content: 'Test post'
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockPost] });

      const response = await request(app)
        .delete('/api/timeline/1')
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      expect(response.body.error).toBe('Not authorized to delete this post');
    });
  });

  describe('POST /api/timeline/:postId/like', () => {
    it('should successfully like a post', async () => {
      const mockPost = { id: 1 };
      const mockLike = { id: 1 };

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockPost] }) // Post exists
        .mockResolvedValueOnce({ rows: [] }) // No existing like
        .mockResolvedValueOnce({ rows: [mockLike] }); // Like created

      const response = await request(app)
        .post('/api/timeline/1/like')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.message).toBe('Post liked successfully');
    });

    it('should return 400 if post already liked', async () => {
      const mockPost = { id: 1 };
      const mockLike = { id: 1 };

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockPost] }) // Post exists
        .mockResolvedValueOnce({ rows: [mockLike] }); // Already liked

      const response = await request(app)
        .post('/api/timeline/1/like')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.error).toBe('Post already liked');
    });

    it('should return 404 for non-existent post', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/timeline/999/like')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body.error).toBe('Post not found');
    });
  });

  describe('DELETE /api/timeline/:postId/like', () => {
    it('should successfully unlike a post', async () => {
      const response = await request(app)
        .delete('/api/timeline/1/like')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.message).toBe('Post unliked successfully');
    });

    it('should return 404 if like not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 0 });

      const response = await request(app)
        .delete('/api/timeline/1/like')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body.error).toBe('Like not found');
    });
  });

  describe('GET /api/timeline/:postId/like', () => {
    it('should return like status and count', async () => {
      const mockLike = { id: 1 };
      const mockCount = { count: '5' };

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockLike] }) // User liked
        .mockResolvedValueOnce({ rows: [mockCount] }); // Total count

      const response = await request(app)
        .get('/api/timeline/1/like')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.isLiked).toBe(true);
      expect(response.body.likeCount).toBe(5);
    });

    it('should return false for not liked post', async () => {
      const mockCount = { count: '3' };

      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // User not liked
        .mockResolvedValueOnce({ rows: [mockCount] }); // Total count

      const response = await request(app)
        .get('/api/timeline/1/like')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.isLiked).toBe(false);
      expect(response.body.likeCount).toBe(3);
    });
  });
}); 