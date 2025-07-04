// Test setup file for Jest
require('dotenv').config({ path: '.env.test' });

// Global test utilities
global.testUtils = {
  // Generate test user data
  createTestUser: (overrides = {}) => ({
    email: 'test@example.com',
    password: 'password123',
    ...overrides
  }),

  // Generate test post data
  createTestPost: (overrides = {}) => ({
    content: 'Test post content',
    livestream_url: null,
    ...overrides
  }),

  // Generate test comment data
  createTestComment: (overrides = {}) => ({
    content: 'Test comment content',
    ...overrides
  }),

  // Mock JWT token
  mockJwtToken: 'mock-jwt-token',

  // Mock user object
  mockUser: {
    id: 1,
    email: 'test@example.com'
  }
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'; 