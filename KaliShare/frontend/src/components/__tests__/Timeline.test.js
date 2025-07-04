import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Timeline from '../Timeline';

// Mock the analytics hook
jest.mock('../../hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    trackUserAction: jest.fn()
  })
}));

// Mock fetch
global.fetch = jest.fn();

// Mock socket.io
const mockSocket = {
  on: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn()
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket)
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

const renderTimeline = () => {
  return render(
    <BrowserRouter>
      <Timeline />
    </BrowserRouter>
  );
};

describe('Timeline Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
    localStorageMock.getItem.mockReturnValue('mock-token');
  });

  describe('Rendering', () => {
    it('should render timeline with post creation form', () => {
      renderTimeline();

      expect(screen.getByText('Share Your Knowledge')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('What would you like to share?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
    });

    it('should render livestream URL input when toggled', async () => {
      renderTimeline();

      const toggleButton = screen.getByText('Add Livestream URL');
      await userEvent.click(toggleButton);

      expect(screen.getByPlaceholderText('Enter livestream URL (YouTube, Twitch, Zoom, etc.)')).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      renderTimeline();

      expect(screen.getByText('Loading posts...')).toBeInTheDocument();
    });
  });

  describe('Post Creation', () => {
    it('should create a new post successfully', async () => {
      const mockPost = {
        _id: 1,
        content: 'Test post content',
        author: { email: 'test@example.com' },
        createdAt: new Date().toISOString(),
        likeCount: 0,
        isLiked: false
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPost
      });

      renderTimeline();

      const contentInput = screen.getByPlaceholderText('What would you like to share?');
      const shareButton = screen.getByRole('button', { name: /share/i });

      await userEvent.type(contentInput, 'Test post content');
      await userEvent.click(shareButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/timeline', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify({
            content: 'Test post content',
            livestream_url: null
          })
        });
      });
    });

    it('should create post with livestream URL', async () => {
      const mockPost = {
        _id: 1,
        content: 'Post with livestream',
        livestream_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        author: { email: 'test@example.com' },
        createdAt: new Date().toISOString(),
        likeCount: 0,
        isLiked: false
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPost
      });

      renderTimeline();

      const toggleButton = screen.getByText('Add Livestream URL');
      await userEvent.click(toggleButton);

      const contentInput = screen.getByPlaceholderText('What would you like to share?');
      const urlInput = screen.getByPlaceholderText('Enter livestream URL (YouTube, Twitch, Zoom, etc.)');
      const shareButton = screen.getByRole('button', { name: /share/i });

      await userEvent.type(contentInput, 'Post with livestream');
      await userEvent.type(urlInput, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      await userEvent.click(shareButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/timeline', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify({
            content: 'Post with livestream',
            livestream_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
          })
        });
      });
    });

    it('should validate livestream URL format', async () => {
      renderTimeline();

      const toggleButton = screen.getByText('Add Livestream URL');
      await userEvent.click(toggleButton);

      const urlInput = screen.getByPlaceholderText('Enter livestream URL (YouTube, Twitch, Zoom, etc.)');
      const shareButton = screen.getByRole('button', { name: /share/i });

      await userEvent.type(urlInput, 'invalid-url');
      fireEvent.blur(urlInput);

      expect(screen.getByText('Please enter a valid livestream URL')).toBeInTheDocument();
      expect(shareButton).toBeDisabled();
    });

    it('should require post content', async () => {
      renderTimeline();

      const shareButton = screen.getByRole('button', { name: /share/i });

      // Button should be disabled without content
      expect(shareButton).toBeDisabled();

      const contentInput = screen.getByPlaceholderText('What would you like to share?');
      await userEvent.type(contentInput, 'Test content');

      // Button should be enabled with content
      expect(shareButton).not.toBeDisabled();
    });
  });

  describe('Post Display', () => {
    it('should display posts from API', async () => {
      const mockPosts = [
        {
          _id: 1,
          content: 'First post',
          author: { email: 'user1@example.com' },
          createdAt: new Date().toISOString(),
          likeCount: 2,
          isLiked: false
        },
        {
          _id: 2,
          content: 'Second post',
          author: { email: 'user2@example.com' },
          createdAt: new Date().toISOString(),
          likeCount: 0,
          isLiked: true
        }
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ posts: mockPosts, user: { email: 'test@example.com' } })
      });

      renderTimeline();

      await waitFor(() => {
        expect(screen.getByText('First post')).toBeInTheDocument();
        expect(screen.getByText('Second post')).toBeInTheDocument();
        expect(screen.getByText('user1@example.com')).toBeInTheDocument();
        expect(screen.getByText('user2@example.com')).toBeInTheDocument();
      });
    });

    it('should display livestream URLs as clickable links', async () => {
      const mockPosts = [
        {
          _id: 1,
          content: 'Post with livestream',
          livestream_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          author: { email: 'user@example.com' },
          createdAt: new Date().toISOString(),
          likeCount: 0,
          isLiked: false
        }
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ posts: mockPosts, user: { email: 'test@example.com' } })
      });

      renderTimeline();

      await waitFor(() => {
        const livestreamLink = screen.getByText('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        expect(livestreamLink).toBeInTheDocument();
        expect(livestreamLink).toHaveAttribute('href', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        expect(livestreamLink).toHaveAttribute('target', '_blank');
      });
    });
  });

  describe('Like Functionality', () => {
    it('should like a post', async () => {
      const mockPosts = [
        {
          _id: 1,
          content: 'Test post',
          author: { email: 'user@example.com' },
          createdAt: new Date().toISOString(),
          likeCount: 0,
          isLiked: false
        }
      ];

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ posts: mockPosts, user: { email: 'test@example.com' } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Post liked successfully' })
        });

      renderTimeline();

      await waitFor(() => {
        expect(screen.getByText('Test post')).toBeInTheDocument();
      });

      const likeButton = screen.getByRole('button', { name: /like/i });
      await userEvent.click(likeButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/timeline/1/like', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer mock-token'
          }
        });
      });
    });

    it('should unlike a post', async () => {
      const mockPosts = [
        {
          _id: 1,
          content: 'Test post',
          author: { email: 'user@example.com' },
          createdAt: new Date().toISOString(),
          likeCount: 1,
          isLiked: true
        }
      ];

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ posts: mockPosts, user: { email: 'test@example.com' } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Post unliked successfully' })
        });

      renderTimeline();

      await waitFor(() => {
        expect(screen.getByText('Test post')).toBeInTheDocument();
      });

      const unlikeButton = screen.getByRole('button', { name: /unlike/i });
      await userEvent.click(unlikeButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/timeline/1/like', {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer mock-token'
          }
        });
      });
    });
  });

  describe('Share Functionality', () => {
    it('should share a post', async () => {
      const mockPosts = [
        {
          _id: 1,
          content: 'Test post',
          author: { email: 'user@example.com' },
          createdAt: new Date().toISOString(),
          likeCount: 0,
          isLiked: false
        }
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ posts: mockPosts, user: { email: 'test@example.com' } })
      });

      // Mock navigator.share
      Object.assign(navigator, {
        share: jest.fn().mockResolvedValue(undefined)
      });

      renderTimeline();

      await waitFor(() => {
        expect(screen.getByText('Test post')).toBeInTheDocument();
      });

      const shareButton = screen.getByRole('button', { name: /share/i });
      await userEvent.click(shareButton);

      expect(navigator.share).toHaveBeenCalledWith({
        title: 'KaliShare Post',
        text: 'Test post',
        url: window.location.href
      });
    });

    it('should handle share cancellation gracefully', async () => {
      const mockPosts = [
        {
          _id: 1,
          content: 'Test post',
          author: { email: 'user@example.com' },
          createdAt: new Date().toISOString(),
          likeCount: 0,
          isLiked: false
        }
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ posts: mockPosts, user: { email: 'test@example.com' } })
      });

      // Mock navigator.share to simulate cancellation
      Object.assign(navigator, {
        share: jest.fn().mockRejectedValue(new Error('Share cancelled'))
      });

      renderTimeline();

      await waitFor(() => {
        expect(screen.getByText('Test post')).toBeInTheDocument();
      });

      const shareButton = screen.getByRole('button', { name: /share/i });
      await userEvent.click(shareButton);

      // Should not throw error
      expect(navigator.share).toHaveBeenCalled();
    });
  });

  describe('Comment Functionality', () => {
    it('should add comment to post', async () => {
      const mockPosts = [
        {
          _id: 1,
          content: 'Test post',
          author: { email: 'user@example.com' },
          createdAt: new Date().toISOString(),
          likeCount: 0,
          isLiked: false
        }
      ];

      const mockComment = {
        _id: 1,
        content: 'Test comment',
        author: { email: 'test@example.com' },
        createdAt: new Date().toISOString()
      };

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ posts: mockPosts, user: { email: 'test@example.com' } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockComment
        });

      renderTimeline();

      await waitFor(() => {
        expect(screen.getByText('Test post')).toBeInTheDocument();
      });

      const commentInput = screen.getByPlaceholderText('Add a comment...');
      const commentButton = screen.getByRole('button', { name: /comment/i });

      await userEvent.type(commentInput, 'Test comment');
      await userEvent.click(commentButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/timeline/1/comments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify({
            content: 'Test comment'
          })
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      renderTimeline();

      await waitFor(() => {
        expect(screen.getByText('Error loading posts. Please try again.')).toBeInTheDocument();
      });
    });

    it('should handle authentication errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' })
      });

      renderTimeline();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Socket Integration', () => {
    it('should connect to socket on mount', () => {
      renderTimeline();

      expect(mockSocket.on).toHaveBeenCalledWith('newPost', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('newComment', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('postLiked', expect.any(Function));
    });

    it('should disconnect socket on unmount', () => {
      const { unmount } = renderTimeline();

      unmount();

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });
}); 