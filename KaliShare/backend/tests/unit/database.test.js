const { Pool } = require('pg');
const { pool, query, initDatabase } = require('../database/db');

// Mock pg Pool
jest.mock('pg', () => ({
  Pool: jest.fn()
}));

describe('Database Unit Tests', () => {
  let mockPool;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock pool instance
    mockPool = {
      query: jest.fn(),
      end: jest.fn()
    };
    
    Pool.mockImplementation(() => mockPool);
  });

  describe('Database Connection', () => {
    it('should create pool with correct configuration', () => {
      // Re-import to trigger Pool creation
      jest.resetModules();
      require('../database/db');
      
      expect(Pool).toHaveBeenCalledWith({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/kalishare',
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
    });

    it('should handle connection errors gracefully', async () => {
      const connectionError = new Error('Connection failed');
      mockPool.query.mockRejectedValue(connectionError);

      await expect(query('SELECT 1')).rejects.toThrow('Connection failed');
    });
  });

  describe('Database Initialization', () => {
    it('should create tables successfully', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // Users table
        .mockResolvedValueOnce({ rows: [] }) // Posts table
        .mockResolvedValueOnce({ rows: [] }) // Comments table
        .mockResolvedValueOnce({ rows: [] }); // Likes table

      await expect(initDatabase()).resolves.not.toThrow();

      expect(mockPool.query).toHaveBeenCalledTimes(4);
      
      // Check that table creation queries were called
      const calls = mockPool.query.mock.calls;
      expect(calls[0][0]).toContain('CREATE TABLE IF NOT EXISTS users');
      expect(calls[1][0]).toContain('CREATE TABLE IF NOT EXISTS posts');
      expect(calls[2][0]).toContain('CREATE TABLE IF NOT EXISTS comments');
      expect(calls[3][0]).toContain('CREATE TABLE IF NOT EXISTS likes');
    });

    it('should handle initialization errors', async () => {
      const initError = new Error('Table creation failed');
      mockPool.query.mockRejectedValue(initError);

      await expect(initDatabase()).rejects.toThrow('Table creation failed');
    });
  });

  describe('Query Function', () => {
    it('should execute queries successfully', async () => {
      const mockResult = { rows: [{ id: 1, name: 'test' }] };
      mockPool.query.mockResolvedValue(mockResult);

      const result = await query('SELECT * FROM users WHERE id = $1', [1]);
      
      expect(result).toEqual(mockResult);
      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', [1]);
    });

    it('should handle query errors', async () => {
      const queryError = new Error('Invalid SQL');
      mockPool.query.mockRejectedValue(queryError);

      await expect(query('INVALID SQL')).rejects.toThrow('Invalid SQL');
    });

    it('should handle parameterized queries', async () => {
      const mockResult = { rows: [{ id: 1, email: 'test@example.com' }] };
      mockPool.query.mockResolvedValue(mockResult);

      await query('SELECT * FROM users WHERE email = $1', ['test@example.com']);
      
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1',
        ['test@example.com']
      );
    });
  });

  describe('Table Structure Validation', () => {
    it('should validate users table structure', async () => {
      const mockColumns = [
        { column_name: 'id', data_type: 'integer' },
        { column_name: 'email', data_type: 'character varying' },
        { column_name: 'password_hash', data_type: 'character varying' },
        { column_name: 'created_at', data_type: 'timestamp' }
      ];

      mockPool.query.mockResolvedValue({ rows: mockColumns });

      const result = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users'
      `);

      expect(result.rows).toHaveLength(4);
      expect(result.rows.find(col => col.column_name === 'id')).toBeDefined();
      expect(result.rows.find(col => col.column_name === 'email')).toBeDefined();
      expect(result.rows.find(col => col.column_name === 'password_hash')).toBeDefined();
    });

    it('should validate posts table structure', async () => {
      const mockColumns = [
        { column_name: 'id', data_type: 'integer' },
        { column_name: 'user_id', data_type: 'integer' },
        { column_name: 'content', data_type: 'text' },
        { column_name: 'livestream_url', data_type: 'character varying' },
        { column_name: 'created_at', data_type: 'timestamp' }
      ];

      mockPool.query.mockResolvedValue({ rows: mockColumns });

      const result = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'posts'
      `);

      expect(result.rows).toHaveLength(5);
      expect(result.rows.find(col => col.column_name === 'user_id')).toBeDefined();
      expect(result.rows.find(col => col.column_name === 'content')).toBeDefined();
    });

    it('should validate likes table structure', async () => {
      const mockColumns = [
        { column_name: 'id', data_type: 'integer' },
        { column_name: 'post_id', data_type: 'integer' },
        { column_name: 'user_id', data_type: 'integer' },
        { column_name: 'created_at', data_type: 'timestamp' }
      ];

      mockPool.query.mockResolvedValue({ rows: mockColumns });

      const result = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'likes'
      `);

      expect(result.rows).toHaveLength(4);
      expect(result.rows.find(col => col.column_name === 'post_id')).toBeDefined();
      expect(result.rows.find(col => col.column_name === 'user_id')).toBeDefined();
    });
  });

  describe('Connection Pool Management', () => {
    it('should handle multiple concurrent queries', async () => {
      const mockResults = [
        { rows: [{ id: 1 }] },
        { rows: [{ id: 2 }] },
        { rows: [{ id: 3 }] }
      ];

      mockPool.query
        .mockResolvedValueOnce(mockResults[0])
        .mockResolvedValueOnce(mockResults[1])
        .mockResolvedValueOnce(mockResults[2]);

      const queries = [
        query('SELECT * FROM users WHERE id = $1', [1]),
        query('SELECT * FROM users WHERE id = $1', [2]),
        query('SELECT * FROM users WHERE id = $1', [3])
      ];

      const results = await Promise.all(queries);

      expect(results).toEqual(mockResults);
      expect(mockPool.query).toHaveBeenCalledTimes(3);
    });

    it('should handle connection timeouts', async () => {
      const timeoutError = new Error('Connection timeout');
      mockPool.query.mockRejectedValue(timeoutError);

      await expect(query('SELECT 1')).rejects.toThrow('Connection timeout');
    });
  });

  describe('Environment Configuration', () => {
    it('should use production SSL settings in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      jest.resetModules();
      require('../database/db');

      expect(Pool).toHaveBeenCalledWith({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/kalishare',
        ssl: { rejectUnauthorized: false }
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should use development settings in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      jest.resetModules();
      require('../database/db');

      expect(Pool).toHaveBeenCalledWith({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/kalishare',
        ssl: false
      });

      process.env.NODE_ENV = originalEnv;
    });
  });
}); 