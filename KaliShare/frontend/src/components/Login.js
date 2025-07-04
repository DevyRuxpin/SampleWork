import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaSpinner, FaUser, FaShieldAlt } from 'react-icons/fa';
import { useAnalytics } from '../hooks/useAnalytics';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { trackUserAction } = useAnalytics();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        trackUserAction('Login Successful', { email: formData.email });
        navigate('/');
      } else {
        setError(data.error || data.message || 'Login failed');
        trackUserAction('Login Failed', { email: formData.email, error: data.error || data.message });
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
      trackUserAction('Login Error', { email: formData.email, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="container">
      <div className="auth-container fade-in">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--space-lg)',
            boxShadow: 'var(--shadow-lg)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-50%',
              width: '200%',
              height: '200%',
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%)',
              animation: 'float 6s ease-in-out infinite'
            }} />
            <FaUser style={{ 
              fontSize: '2rem', 
              color: 'white',
              position: 'relative',
              zIndex: 1
            }} />
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '1rem',
            marginBottom: '0'
          }}>
            Sign in to your account to continue
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            background: 'var(--error-lighter)',
            border: '1px solid var(--error-light)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-md)',
            marginBottom: 'var(--space-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            color: 'var(--error-color)',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            <FaShieldAlt style={{ fontSize: '1rem' }} />
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Email Field */}
          <div className="form-group">
            <label style={{ 
              display: 'block', 
              marginBottom: 'var(--space-sm)', 
              color: 'var(--text-primary)',
              fontWeight: '600',
              fontSize: '0.875rem'
            }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: 'var(--space-md)',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)',
                fontSize: '1rem',
                zIndex: 1
              }}>
                <FaEnvelope />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter your email"
                required
                style={{ 
                  paddingLeft: 'calc(var(--space-md) + 1.5rem)',
                  fontSize: '1rem',
                  height: '3rem'
                }}
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label style={{ 
              display: 'block', 
              marginBottom: 'var(--space-sm)', 
              color: 'var(--text-primary)',
              fontWeight: '600',
              fontSize: '0.875rem'
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: 'var(--space-md)',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)',
                fontSize: '1rem',
                zIndex: 1
              }}>
                <FaLock />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter your password"
                required
                style={{ 
                  paddingLeft: 'calc(var(--space-md) + 1.5rem)',
                  paddingRight: 'calc(var(--space-md) + 1.5rem)',
                  fontSize: '1rem',
                  height: '3rem'
                }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                style={{
                  position: 'absolute',
                  right: 'var(--space-md)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  padding: 'var(--space-xs)',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={(e) => e.target.style.color = 'var(--text-secondary)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--text-tertiary)'}
                disabled={loading}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !formData.email || !formData.password}
            style={{ 
              height: '3rem',
              fontSize: '1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-sm)'
            }}
          >
            {loading ? (
              <>
                <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: 'var(--space-xl)',
          paddingTop: 'var(--space-xl)',
          borderTop: '1px solid var(--border-light)'
        }}>
          <p style={{ 
            color: 'var(--text-secondary)', 
            marginBottom: 'var(--space-md)',
            fontSize: '0.875rem'
          }}>
            Don't have an account?{' '}
            <Link 
              to="/signup" 
              style={{ 
                color: 'var(--primary-color)', 
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'color var(--transition-fast)'
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--primary-dark)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--primary-color)'}
            >
              Sign up here
            </Link>
          </p>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'var(--space-md)',
            flexWrap: 'wrap'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-xs)',
              padding: 'var(--space-xs) var(--space-sm)',
              background: 'var(--background-secondary)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              color: 'var(--text-tertiary)',
              fontWeight: '500'
            }}>
              <FaShieldAlt style={{ fontSize: '0.75rem' }} />
              Secure Login
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-xs)',
              padding: 'var(--space-xs) var(--space-sm)',
              background: 'var(--background-secondary)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              color: 'var(--text-tertiary)',
              fontWeight: '500'
            }}>
              <FaUser style={{ fontSize: '0.75rem' }} />
              Free Access
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(180deg); }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-in {
          animation: fadeIn var(--transition-slow) ease-out;
        }

        .form-control:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px var(--primary-lighter), var(--shadow-md);
          transform: translateY(-1px);
        }

        .form-control:disabled {
          background: var(--background-tertiary);
          color: var(--text-muted);
          cursor: not-allowed;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
      `}</style>
    </div>
  );
};

export default Login; 