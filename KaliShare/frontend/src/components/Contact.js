import React, { useState } from 'react';
import { FaEnvelope, FaGithub, FaLinkedin, FaTwitter, FaGlobe, FaMapMarkerAlt, FaPhone, FaPaperPlane, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import { useAnalytics } from '../hooks/useAnalytics';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { trackUserAction } = useAnalytics();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
    if (success) setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Simulate form submission (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      trackUserAction('Contact Form Submitted', { 
        name: formData.name, 
        email: formData.email, 
        subject: formData.subject 
      });
    } catch (error) {
      setError('Failed to send message. Please try again.');
      trackUserAction('Contact Form Error', { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: <FaEnvelope />,
      title: 'Email',
      value: 'contact@kalishare.com',
      link: 'mailto:contact@kalishare.com',
      color: 'var(--primary-color)'
    },
    {
      icon: <FaGithub />,
      title: 'GitHub',
      value: 'github.com/kalishare',
      link: 'https://github.com/kalishare',
      color: '#333'
    },
    {
      icon: <FaLinkedin />,
      title: 'LinkedIn',
      value: 'linkedin.com/in/kalishare',
      link: 'https://linkedin.com/in/kalishare',
      color: '#0077B5'
    },
    {
      icon: <FaTwitter />,
      title: 'Twitter',
      value: '@kalishare',
      link: 'https://twitter.com/kalishare',
      color: '#1DA1F2'
    }
  ];

  return (
    <div className="container fade-in">
      {/* Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: 'var(--space-3xl)',
        padding: 'var(--space-2xl) 0'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--primary-lighter) 0%, var(--accent-lighter) 100%)',
          borderRadius: 'var(--radius-2xl)',
          padding: 'var(--space-3xl) var(--space-2xl)',
          border: '1px solid var(--border-light)',
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
            background: 'radial-gradient(circle, rgba(37, 99, 235, 0.1) 0%, transparent 70%)',
            animation: 'float 6s ease-in-out infinite'
          }} />
          
          <h1 style={{ 
            color: 'var(--text-primary)', 
            marginBottom: 'var(--space-lg)', 
            fontWeight: '800', 
            fontSize: '3rem',
            background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            position: 'relative',
            zIndex: 1
          }}>
            Get in Touch
          </h1>
          <p style={{ 
            fontSize: '1.25rem', 
            color: 'var(--text-secondary)', 
            marginBottom: '0',
            fontWeight: '500',
            position: 'relative',
            zIndex: 1
          }}>
            Have questions, suggestions, or want to collaborate? We'd love to hear from you!
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3xl)', alignItems: 'start' }}>
        {/* Contact Form */}
        <div className="card" style={{ 
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, var(--primary-color), var(--accent-color))'
          }} />
          
          <h2 style={{ 
            color: 'var(--text-primary)', 
            marginBottom: 'var(--space-xl)', 
            fontWeight: '700', 
            fontSize: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)'
          }}>
            <FaPaperPlane style={{ color: 'var(--primary-color)' }} />
            Send us a Message
          </h2>

          {/* Success Message */}
          {success && (
            <div style={{
              background: 'var(--success-lighter)',
              border: '1px solid var(--success-light)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-md)',
              marginBottom: 'var(--space-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              color: 'var(--success-color)',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              <FaCheckCircle style={{ fontSize: '1rem' }} />
              Thank you! Your message has been sent successfully.
            </div>
          )}

          {/* Error Message */}
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
              <FaEnvelope style={{ fontSize: '1rem' }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            {/* Name Field */}
            <div className="form-group">
              <label style={{ 
                display: 'block', 
                marginBottom: 'var(--space-sm)', 
                color: 'var(--text-primary)',
                fontWeight: '600',
                fontSize: '0.875rem'
              }}>
                Your Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter your full name"
                required
                style={{ 
                  fontSize: '1rem',
                  height: '3rem'
                }}
                disabled={loading}
              />
            </div>

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
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter your email address"
                required
                style={{ 
                  fontSize: '1rem',
                  height: '3rem'
                }}
                disabled={loading}
              />
            </div>

            {/* Subject Field */}
            <div className="form-group">
              <label style={{ 
                display: 'block', 
                marginBottom: 'var(--space-sm)', 
                color: 'var(--text-primary)',
                fontWeight: '600',
                fontSize: '0.875rem'
              }}>
                Subject
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="form-control"
                placeholder="What's this about?"
                required
                style={{ 
                  fontSize: '1rem',
                  height: '3rem'
                }}
                disabled={loading}
              />
            </div>

            {/* Message Field */}
            <div className="form-group">
              <label style={{ 
                display: 'block', 
                marginBottom: 'var(--space-sm)', 
                color: 'var(--text-primary)',
                fontWeight: '600',
                fontSize: '0.875rem'
              }}>
                Message
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                className="form-control"
                placeholder="Tell us more about your inquiry..."
                required
                rows="6"
                style={{ 
                  fontSize: '1rem',
                  resize: 'vertical',
                  minHeight: '120px'
                }}
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !formData.name || !formData.email || !formData.subject || !formData.message}
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
                  Sending Message...
                </>
              ) : (
                <>
                  <FaPaperPlane style={{ fontSize: '0.875rem' }} />
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>

        {/* Contact Information */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Contact Info Cards */}
          {contactInfo.map((info, index) => (
            <div 
              key={info.title}
              className="card"
              style={{
                animation: `slideInRight 0.6s ease-out ${index * 0.1}s both`,
                cursor: 'pointer',
                transition: 'all var(--transition-normal)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-4px)';
                e.target.style.boxShadow = 'var(--shadow-xl)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'var(--shadow-md)';
              }}
              onClick={() => window.open(info.link, '_blank')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: `linear-gradient(135deg, ${info.color}, ${info.color}dd)`,
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.5rem',
                  boxShadow: 'var(--shadow-md)',
                  flexShrink: 0
                }}>
                  {info.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    color: 'var(--text-primary)', 
                    marginBottom: 'var(--space-xs)', 
                    fontWeight: '600',
                    fontSize: '1.1rem'
                  }}>
                    {info.title}
                  </h3>
                  <p style={{ 
                    color: 'var(--text-secondary)', 
                    marginBottom: '0',
                    fontSize: '0.875rem'
                  }}>
                    {info.value}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Additional Info Card */}
          <div className="card" style={{
            animation: `slideInRight 0.6s ease-out 0.4s both`,
            background: 'linear-gradient(135deg, var(--primary-lighter) 0%, var(--accent-lighter) 100%)',
            border: '1px solid var(--primary-color)'
          }}>
            <h3 style={{ 
              color: 'var(--primary-color)', 
              marginBottom: 'var(--space-md)', 
              fontWeight: '600',
              fontSize: '1.25rem'
            }}>
              Why Contact Us?
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--space-sm)',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  background: 'var(--primary-color)',
                  borderRadius: '50%'
                }} />
                Feature requests and suggestions
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--space-sm)',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  background: 'var(--primary-color)',
                  borderRadius: '50%'
                }} />
                Bug reports and technical issues
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--space-sm)',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  background: 'var(--primary-color)',
                  borderRadius: '50%'
                }} />
                Collaboration opportunities
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--space-sm)',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  background: 'var(--primary-color)',
                  borderRadius: '50%'
                }} />
                General feedback and questions
              </div>
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
          50% { transform: translateY(-20px) rotate(180deg); }
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

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
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

        @media (max-width: 768px) {
          .container {
            grid-template-columns: 1fr;
            gap: var(--space-xl);
          }
        }
      `}</style>
    </div>
  );
};

export default Contact; 