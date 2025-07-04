import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBars, FaTimes, FaUser, FaSignOutAlt, FaHome, FaSearch, FaComments, FaAddressBook } from 'react-icons/fa';

const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    window.location.href = '/login';
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          width: '100%'
        }}>
          {/* Brand */}
          <Link to="/" className="navbar-brand" onClick={closeMenu}>
            <div style={{ 
              fontSize: '2rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.5px',
              textDecoration: 'none',
              background: 'transparent'
            }}>
              KaliShare
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="navbar-nav" style={{ display: 'flex', alignItems: 'center' }}>
            <div className="nav-item">
              <Link 
                to="/" 
                className={`nav-link ${isActive('/') ? 'active' : ''}`}
                onClick={closeMenu}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <FaHome style={{ fontSize: '1rem' }} />
                Home
              </Link>
            </div>
            <div className="nav-item">
              <Link 
                to="/search" 
                className={`nav-link ${isActive('/search') ? 'active' : ''}`}
                onClick={closeMenu}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <FaSearch style={{ fontSize: '1rem' }} />
                Search
              </Link>
            </div>
            <div className="nav-item">
              <Link 
                to="/timeline" 
                className={`nav-link ${isActive('/timeline') ? 'active' : ''}`}
                onClick={closeMenu}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <FaComments style={{ fontSize: '1rem' }} />
                Timeline
              </Link>
            </div>
            <div className="nav-item">
              <Link 
                to="/contact" 
                className={`nav-link ${isActive('/contact') ? 'active' : ''}`}
                onClick={closeMenu}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <FaAddressBook style={{ fontSize: '1rem' }} />
                Contact
              </Link>
            </div>
          </div>

          {/* Auth Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: 'var(--primary-lighter)',
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--primary-color)',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  <FaUser style={{ fontSize: '0.875rem' }} />
                  User
                </div>
                <button 
                  onClick={handleLogout}
                  className="btn btn-ghost"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    padding: '8px 16px',
                    fontSize: '0.875rem'
                  }}
                >
                  <FaSignOutAlt style={{ fontSize: '0.875rem' }} />
                  Logout
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Link to="/login" className="btn btn-outline" onClick={closeMenu}>
                  Login
                </Link>
                <Link to="/signup" className="btn btn-primary" onClick={closeMenu}>
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button 
              onClick={toggleMenu}
              className="btn btn-ghost"
              style={{ 
                display: 'none',
                padding: '8px',
                fontSize: '1.25rem',
                color: 'var(--text-secondary)'
              }}
            >
              {isMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`mobile-menu ${isMenuOpen ? 'mobile-menu-open' : ''}`}>
          <div className="mobile-nav-item">
            <Link 
              to="/" 
              className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`}
              onClick={closeMenu}
              style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              <FaHome style={{ fontSize: '1.1rem' }} />
              Home
            </Link>
          </div>
          <div className="mobile-nav-item">
            <Link 
              to="/search" 
              className={`mobile-nav-link ${isActive('/search') ? 'active' : ''}`}
              onClick={closeMenu}
              style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              <FaSearch style={{ fontSize: '1.1rem' }} />
              Search
            </Link>
          </div>
          <div className="mobile-nav-item">
            <Link 
              to="/timeline" 
              className={`mobile-nav-link ${isActive('/timeline') ? 'active' : ''}`}
              onClick={closeMenu}
              style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              <FaComments style={{ fontSize: '1.1rem' }} />
              Timeline
            </Link>
          </div>
          <div className="mobile-nav-item">
            <Link 
              to="/contact" 
              className={`mobile-nav-link ${isActive('/contact') ? 'active' : ''}`}
              onClick={closeMenu}
              style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              <FaAddressBook style={{ fontSize: '1.1rem' }} />
              Contact
            </Link>
          </div>
          
          {!isAuthenticated && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px', 
              marginTop: '24px',
              paddingTop: '24px',
              borderTop: '1px solid var(--border-light)'
            }}>
              <Link to="/login" className="btn btn-outline" onClick={closeMenu}>
                Login
              </Link>
              <Link to="/signup" className="btn btn-primary" onClick={closeMenu}>
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .navbar {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: var(--space-lg) 0;
          box-shadow: var(--shadow-lg);
          border-bottom: 1px solid var(--border-light);
          position: sticky;
          top: 0;
          z-index: 1000;
          transition: all var(--transition-normal);
        }

        .navbar-scrolled {
          background: rgba(255, 255, 255, 0.98);
          box-shadow: var(--shadow-xl);
          padding: var(--space-md) 0;
        }

        .navbar-brand {
          color: var(--primary-color);
          font-size: 1.75rem;
          font-weight: 700;
          text-decoration: none;
          background: transparent;
          background-image: linear-gradient(135deg, var(--primary-color), var(--accent-color));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          transition: all var(--transition-normal);
        }

        .navbar-brand:hover {
          transform: scale(1.05);
        }

        .navbar-nav {
          display: flex;
          list-style: none;
          margin: 0;
          padding: 0;
          gap: var(--space-md);
        }

        .nav-item {
          position: relative;
        }

        .nav-link {
          color: var(--text-secondary);
          text-decoration: none;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-lg);
          transition: all var(--transition-normal);
          font-weight: 500;
          position: relative;
          overflow: hidden;
        }

        .nav-link::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
          transition: all var(--transition-normal);
          transform: translateX(-50%);
        }

        .nav-link:hover {
          background: var(--primary-lighter);
          color: var(--primary-color);
          transform: translateY(-1px);
        }

        .nav-link:hover::before {
          width: 80%;
        }

        .nav-link.active {
          background: var(--primary-lighter);
          color: var(--primary-color);
        }

        .nav-link.active::before {
          width: 80%;
        }

        .mobile-menu {
          display: none;
          background: var(--background-primary);
          border-top: 1px solid var(--border-light);
          padding: var(--space-lg) 0;
          margin-top: var(--space-lg);
          box-shadow: var(--shadow-lg);
          border-radius: var(--radius-lg);
          transform: translateY(-20px);
          opacity: 0;
          transition: all var(--transition-normal);
        }

        .mobile-menu-open {
          transform: translateY(0);
          opacity: 1;
        }

        .mobile-nav-item {
          margin-bottom: var(--space-sm);
        }

        .mobile-nav-link {
          display: block;
          padding: var(--space-md) var(--space-lg);
          color: var(--text-secondary);
          text-decoration: none;
          border-radius: var(--radius-lg);
          transition: all var(--transition-normal);
          font-weight: 500;
        }

        .mobile-nav-link:hover {
          background: var(--primary-lighter);
          color: var(--primary-color);
        }

        .mobile-nav-link.active {
          background: var(--primary-lighter);
          color: var(--primary-color);
        }

        @media (max-width: 768px) {
          .navbar-nav {
            display: none;
          }

          .mobile-menu {
            display: block;
          }

          .btn-ghost {
            display: flex !important;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;