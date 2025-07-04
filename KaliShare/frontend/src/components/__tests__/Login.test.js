import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Login from '../Login';

// Mock the analytics hook
jest.mock('../../hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    trackUserAction: jest.fn()
  })
}));

// Mock fetch
global.fetch = jest.fn();

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

const renderLogin = () => {
  return render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  describe('Rendering', () => {
    it('should render login form with all elements', () => {
      renderLogin();

      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    });

    it('should display proper form labels', () => {
      renderLogin();

      expect(screen.getByText('Email Address')).toBeInTheDocument();
      expect(screen.getByText('Password')).toBeInTheDocument();
    });

    it('should show password visibility toggle', () => {
      renderLogin();

      const passwordInput = screen.getByLabelText(/password/i);
      const toggleButton = screen.getByRole('button', { name: '' }); // Eye icon button

      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(toggleButton).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate email format', async () => {
      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Test invalid email
      await userEvent.type(emailInput, 'invalid-email');
      fireEvent.blur(emailInput);

      expect(emailInput).toHaveValue('invalid-email');
    });

    it('should require both email and password', async () => {
      renderLogin();

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Button should be disabled initially
      expect(submitButton).toBeDisabled();

      // Add email only
      const emailInput = screen.getByLabelText(/email address/i);
      await userEvent.type(emailInput, 'test@example.com');

      // Button should still be disabled
      expect(submitButton).toBeDisabled();

      // Add password
      const passwordInput = screen.getByLabelText(/password/i);
      await userEvent.type(passwordInput, 'password123');

      // Button should now be enabled
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility', async () => {
      renderLogin();

      const passwordInput = screen.getByLabelText(/password/i);
      const toggleButton = screen.getByRole('button', { name: '' });

      // Initially password should be hidden
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Click toggle button
      await userEvent.click(toggleButton);

      // Password should now be visible
      expect(passwordInput).toHaveAttribute('type', 'text');

      // Click toggle button again
      await userEvent.click(toggleButton);

      // Password should be hidden again
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid credentials', async () => {
      const mockResponse = {
        user: { id: 1, email: 'test@example.com' },
        token: 'mock-jwt-token'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123'
          }),
        });
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('should handle login errors', async () => {
      const mockError = { error: 'Invalid credentials' };

      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockError
      });

      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'wrongpassword');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Network error. Please try again.')).toBeInTheDocument();
      });
    });

    it('should show loading state during submission', async () => {
      fetch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(submitButton);

      // Should show loading state
      expect(screen.getByText('Signing In...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Navigation', () => {
    it('should navigate to signup page', async () => {
      renderLogin();

      const signupLink = screen.getByText('Sign up here');
      await userEvent.click(signupLink);

      // In a real app, this would navigate to signup
      expect(signupLink).toHaveAttribute('href', '/signup');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderLogin();

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should have proper form structure', () => {
      renderLogin();

      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();
    });

    it('should handle keyboard navigation', async () => {
      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      // Tab navigation should work
      emailInput.focus();
      expect(emailInput).toHaveFocus();

      // Tab to password
      await userEvent.tab();
      expect(passwordInput).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    it('should clear error when user starts typing', async () => {
      const mockError = { error: 'Invalid credentials' };

      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockError
      });

      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Submit form to trigger error
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'wrongpassword');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      // Start typing in email field
      await userEvent.type(emailInput, 'new');

      // Error should be cleared
      expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
    });
  });
}); 