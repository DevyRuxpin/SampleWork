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

const authRoutes = require('../routes/auth');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/signup', () => {
    it('should successfully create a new user', async () => {
      // Mock database responses
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // No existing user
        .mockResolvedValueOnce({ 
          rows: [{ id: 1, email: 'test@example.com', created_at: new Date() }] 
        }); // New user created

      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.id).toBe(1);
      expect(response.body.token).toBeDefined();
    });

    it('should return 400 if user already exists', async () => {
      // Mock existing user
      mockPool.query.mockResolvedValueOnce({ 
        rows: [{ id: 1, email: 'test@example.com' }] 
      });

      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('User already exists');
    });

    it('should return 400 for invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Invalid email format');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Email and password are required');
    });

    it('should handle database errors gracefully', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Database connection failed'));

      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should successfully authenticate existing user', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: 'test@example.com',
          password_hash: hashedPassword
        }]
      });

      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(userData)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.id).toBe(1);
    });

    it('should return 401 for non-existent user', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const userData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(userData)
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 401 for incorrect password', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: 'test@example.com',
          password_hash: hashedPassword
        }]
      });

      const userData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(userData)
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Email and password are required');
    });
  });

  describe('GET /api/auth/verify', () => {
    it('should verify valid JWT token', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      
      mockPool.query.mockResolvedValueOnce({
        rows: [mockUser]
      });

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should return 401 for missing token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    it('should return 403 for invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      expect(response.body.error).toBe('Invalid token');
    });

    it('should return 404 for non-existent user', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });
  });
}); 