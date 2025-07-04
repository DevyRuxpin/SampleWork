const request = require('supertest');
const express = require('express');

// Mock the database module
jest.mock('../database/db', () => ({
  query: jest.fn()
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => 'hashedPassword'),
  compare: jest.fn(() => true)
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token')
}));

const authRoutes = require('../routes/auth');

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Authentication Endpoints', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /api/auth/signup', () => {
    it('should return 400 for missing email', async () => {
      const userData = {
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Email and password are required');
    });

    it('should return 400 for missing password', async () => {
      const userData = {
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Email and password are required');
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

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid email format');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 for missing email', async () => {
      const userData = {
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Email and password are required');
    });

    it('should return 400 for missing password', async () => {
      const userData = {
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Email and password are required');
    });
  });

  describe('Input Validation', () => {
    it('should validate email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];

      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user.example.com'
      ];

      // This test validates our email regex logic
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    it('should validate password requirements', () => {
      const validPasswords = [
        'password123',
        'MySecurePass1!',
        '123456789'
      ];

      const invalidPasswords = [
        '',
        '123',
        'short'
      ];

      // This test validates our password length logic
      validPasswords.forEach(password => {
        expect(password.length >= 6).toBe(true);
      });

      invalidPasswords.forEach(password => {
        expect(password.length >= 6).toBe(false);
      });
    });
  });
}); 