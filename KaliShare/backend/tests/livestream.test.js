const request = require('supertest');
const express = require('express');

// Mock the database module
jest.mock('../database/db', () => ({
  pool: {
    query: jest.fn()
  }
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => 'hashedPassword'),
  compare: jest.fn(() => true)
}));

// Mock jsonwebtoken
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

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/timeline', timelineRoutes);

describe('Livestream URL Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('URL Validation Logic', () => {
    it('should validate YouTube Live URLs', () => {
      const validYouTubeUrls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'https://www.youtube.com/live/dQw4w9WgXcQ'
      ];

      const invalidUrls = [
        'https://www.youtube.com/channel/UC123',
        'https://youtube.com/playlist?list=123'
      ];

      // Test the validation logic directly
      const supportedPlatforms = [
        'youtube.com/watch',
        'youtube.com/live',
        'youtu.be/',
        'twitch.tv/',
        'zoom.us/j/',
        'meet.google.com/'
      ];

      const isValidLivestreamUrl = (url) => {
        return supportedPlatforms.some(platform => url.includes(platform));
      };

      validYouTubeUrls.forEach(url => {
        expect(isValidLivestreamUrl(url)).toBe(true);
      });

      invalidUrls.forEach(url => {
        expect(isValidLivestreamUrl(url)).toBe(false);
      });
    });

    it('should validate Twitch URLs', () => {
      const validTwitchUrls = [
        'https://www.twitch.tv/channelname',
        'https://twitch.tv/channelname'
      ];

      const supportedPlatforms = [
        'youtube.com/watch',
        'youtube.com/live',
        'youtu.be/',
        'twitch.tv/',
        'zoom.us/j/',
        'meet.google.com/'
      ];

      const isValidLivestreamUrl = (url) => {
        return supportedPlatforms.some(platform => url.includes(platform));
      };

      validTwitchUrls.forEach(url => {
        expect(isValidLivestreamUrl(url)).toBe(true);
      });
    });

    it('should validate Zoom URLs', () => {
      const validZoomUrls = [
        'https://zoom.us/j/123456789',
        'https://us02web.zoom.us/j/123456789'
      ];

      const supportedPlatforms = [
        'youtube.com/watch',
        'youtube.com/live',
        'youtu.be/',
        'twitch.tv/',
        'zoom.us/j/',
        'meet.google.com/'
      ];

      const isValidLivestreamUrl = (url) => {
        return supportedPlatforms.some(platform => url.includes(platform));
      };

      validZoomUrls.forEach(url => {
        expect(isValidLivestreamUrl(url)).toBe(true);
      });
    });

    it('should validate Google Meet URLs', () => {
      const validMeetUrls = [
        'https://meet.google.com/abc-defg-hij',
        'https://meet.google.com/abc-defg-hij?hs=122'
      ];

      const supportedPlatforms = [
        'youtube.com/watch',
        'youtube.com/live',
        'youtu.be/',
        'twitch.tv/',
        'zoom.us/j/',
        'meet.google.com/'
      ];

      const isValidLivestreamUrl = (url) => {
        return supportedPlatforms.some(platform => url.includes(platform));
      };

      validMeetUrls.forEach(url => {
        expect(isValidLivestreamUrl(url)).toBe(true);
      });
    });

    it('should reject invalid livestream URLs', () => {
      const invalidUrls = [
        'https://invalid-platform.com/stream',
        'https://www.youtube.com/channel/UC123',
        'https://example.com/live',
        'not-a-url'
      ];

      const supportedPlatforms = [
        'youtube.com/watch',
        'youtube.com/live',
        'youtu.be/',
        'twitch.tv/',
        'zoom.us/j/',
        'meet.google.com/'
      ];

      const isValidLivestreamUrl = (url) => {
        return supportedPlatforms.some(platform => url.includes(platform));
      };

      invalidUrls.forEach(url => {
        expect(isValidLivestreamUrl(url)).toBe(false);
      });
    });
  });

  describe('POST /api/timeline/posts', () => {
    it('should reject invalid livestream URL', async () => {
      const response = await request(app)
        .post('/api/timeline/posts')
        .set('Authorization', 'Bearer valid-token')
        .send({
          content: 'Test post with invalid URL',
          livestream_url: 'https://invalid-platform.com/stream'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid livestream URL');
    });
  });
}); 