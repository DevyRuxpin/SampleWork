import React, { useState, useEffect } from 'react';
import { 
  FaYoutube, FaTwitch, FaGoogle, 
  FaJs, FaPython, FaJava, FaPhp, FaSwift,
  FaReact, FaVuejs, FaAngular, FaHtml5, FaCss3Alt, FaBootstrap, FaSass,
  FaNodeJs, FaServer, FaLaravel,
  FaGraduationCap, FaBook, FaChalkboardTeacher,
  FaExternalLinkAlt, FaStar, FaFire, FaRocket, FaCode,
  FaSpinner
} from 'react-icons/fa';
import { SiTypescript, SiKotlin, SiWebpack, SiNextdotjs, SiTailwindcss, SiDjango, SiFlask, SiSpringboot, SiFastapi, SiDotnet, SiCoursera, SiEdx, SiUdemy, SiFreecodecamp, SiCodecademy, SiMdnwebdocs } from 'react-icons/si';
import AI from './AI';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Icon mapping for different platforms and categories
  const getPlatformIcon = (url) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return <FaYoutube style={{ color: '#FF0000' }} />;
    if (url.includes('twitch.tv')) return <FaTwitch style={{ color: '#9146FF' }} />;
    if (url.includes('zoom.us') || url.includes('meet.google.com')) return <FaGoogle style={{ color: '#4285F4' }} />;
    return <FaExternalLinkAlt style={{ color: 'var(--text-tertiary)' }} />;
  };

  const getCategoryIcon = (category) => {
    const iconMap = {
      'Languages': <FaCode style={{ color: 'var(--primary-color)' }} />,
      'Frontend': <FaReact style={{ color: '#61DAFB' }} />,
      'Backend': <FaServer style={{ color: 'var(--success-color)' }} />,
      'DevOps': <FaRocket style={{ color: 'var(--accent-color)' }} />
    };
    return iconMap[category] || <FaBook style={{ color: 'var(--text-tertiary)' }} />;
  };

  const getTechnologyIcon = (title) => {
    const titleLower = title.toLowerCase();
    
    // Languages
    if (titleLower.includes('javascript')) return <FaJs style={{ color: '#F7DF1E' }} />;
    if (titleLower.includes('python')) return <FaPython style={{ color: '#3776AB' }} />;
    if (titleLower.includes('java')) return <FaJava style={{ color: '#ED8B00' }} />;
    if (titleLower.includes('php')) return <FaPhp style={{ color: '#777BB4' }} />;
    if (titleLower.includes('swift')) return <FaSwift style={{ color: '#FA7343' }} />;
    if (titleLower.includes('go') || titleLower.includes('golang')) return <FaCode style={{ color: '#00ADD8' }} />;
    if (titleLower.includes('typescript')) return <SiTypescript style={{ color: '#3178C6' }} />;
    if (titleLower.includes('kotlin')) return <SiKotlin style={{ color: '#7F52FF' }} />;
    
    // Frontend
    if (titleLower.includes('react')) return <FaReact style={{ color: '#61DAFB' }} />;
    if (titleLower.includes('vue')) return <FaVuejs style={{ color: '#4FC08D' }} />;
    if (titleLower.includes('angular')) return <FaAngular style={{ color: '#DD0031' }} />;
    if (titleLower.includes('html')) return <FaHtml5 style={{ color: '#E34F26' }} />;
    if (titleLower.includes('css')) return <FaCss3Alt style={{ color: '#1572B6' }} />;
    if (titleLower.includes('bootstrap')) return <FaBootstrap style={{ color: '#7952B3' }} />;
    if (titleLower.includes('sass')) return <FaSass style={{ color: '#CC6699' }} />;
    if (titleLower.includes('webpack')) return <SiWebpack style={{ color: '#8DD6F9' }} />;
    if (titleLower.includes('next.js')) return <SiNextdotjs style={{ color: '#000000' }} />;
    if (titleLower.includes('tailwind')) return <SiTailwindcss style={{ color: '#06B6D4' }} />;
    
    // Backend
    if (titleLower.includes('node.js')) return <FaNodeJs style={{ color: '#339933' }} />;
    if (titleLower.includes('django')) return <SiDjango style={{ color: '#092E20' }} />;
    if (titleLower.includes('flask')) return <SiFlask style={{ color: '#000000' }} />;
    if (titleLower.includes('spring')) return <SiSpringboot style={{ color: '#6DB33F' }} />;
    if (titleLower.includes('laravel')) return <FaLaravel style={{ color: '#FF2D20' }} />;
    if (titleLower.includes('fastapi')) return <SiFastapi style={{ color: '#009688' }} />;
    if (titleLower.includes('asp.net')) return <SiDotnet style={{ color: '#512BD4' }} />;
    
    // Platforms
    if (titleLower.includes('coursera')) return <SiCoursera style={{ color: '#0056D2' }} />;
    if (titleLower.includes('edx')) return <SiEdx style={{ color: '#02262B' }} />;
    if (titleLower.includes('udemy')) return <SiUdemy style={{ color: '#EC5252' }} />;
    if (titleLower.includes('freecodecamp')) return <SiFreecodecamp style={{ color: '#0A0A23' }} />;
    if (titleLower.includes('codecademy')) return <SiCodecademy style={{ color: '#1F4056' }} />;
    if (titleLower.includes('mdn')) return <SiMdnwebdocs style={{ color: '#000000' }} />;
    
    return <FaBook style={{ color: 'var(--text-tertiary)' }} />;
  };

  const getPopularityBadge = (index) => {
    if (index < 3) return <FaFire style={{ color: '#FF6B35', fontSize: '0.8rem' }} />;
    if (index < 8) return <FaStar style={{ color: '#FFD700', fontSize: '0.8rem' }} />;
    if (index < 15) return <FaRocket style={{ color: 'var(--primary-color)', fontSize: '0.8rem' }} />;
    return null;
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/search/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch categories');
      }

      const data = await response.json();
      setCategories(data.categories);
      setResults(data.results);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError(error.message || 'Failed to load educational resources');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{ 
          textAlign: 'center', 
          padding: 'var(--space-3xl) var(--space-lg)',
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: 'var(--space-lg)', 
            color: 'var(--primary-color)',
            animation: 'pulse 2s infinite'
          }}>
            📚
          </div>
          <div style={{ 
            fontSize: '1.5rem', 
            color: 'var(--text-secondary)', 
            marginBottom: 'var(--space-md)',
            fontWeight: '600'
          }}>
            Loading Educational Resources
          </div>
          <div style={{ 
            color: 'var(--text-tertiary)', 
            marginBottom: 'var(--space-xl)',
            fontSize: '1rem'
          }}>
            This may take a few seconds
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            color: 'var(--primary-color)',
            fontSize: '1.1rem'
          }}>
            <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div style={{ 
          textAlign: 'center', 
          padding: 'var(--space-3xl) var(--space-lg)',
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ 
            fontSize: '4rem', 
            marginBottom: 'var(--space-lg)', 
            color: 'var(--error-color)',
            animation: 'shake 0.5s ease-in-out'
          }}>
            ⚠️
          </div>
          <h3 style={{ 
            color: 'var(--text-primary)', 
            marginBottom: 'var(--space-md)',
            fontSize: '1.75rem',
            fontWeight: '600'
          }}>
            Error Loading Resources
          </h3>
          <p style={{ 
            color: 'var(--text-secondary)', 
            marginBottom: 'var(--space-xl)',
            fontSize: '1.1rem',
            maxWidth: '500px'
          }}>
            {error}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="btn btn-primary"
            style={{ fontSize: '1rem', padding: 'var(--space-md) var(--space-xl)' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container fade-in">
      {/* Hero Section */}
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
            Welcome to KaliShare
          </h1>
          <p style={{ 
            fontSize: '1.25rem', 
            color: 'var(--text-secondary)', 
            marginBottom: 'var(--space-lg)',
            fontWeight: '500',
            position: 'relative',
            zIndex: 1
          }}>
            Discover the best web development resources organized by skill categories
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'var(--space-md)',
            flexWrap: 'wrap',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              padding: 'var(--space-sm) var(--space-md)',
              background: 'rgba(255, 255, 255, 0.8)',
              borderRadius: 'var(--radius-lg)',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: 'var(--primary-color)',
              backdropFilter: 'blur(10px)'
            }}>
              <FaBook />
              {categories.length} Categories
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              padding: 'var(--space-sm) var(--space-md)',
              background: 'rgba(255, 255, 255, 0.8)',
              borderRadius: 'var(--radius-lg)',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: 'var(--success-color)',
              backdropFilter: 'blur(10px)'
            }}>
              <FaGraduationCap />
              Curated Resources
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              padding: 'var(--space-sm) var(--space-md)',
              background: 'rgba(255, 255, 255, 0.8)',
              borderRadius: 'var(--radius-lg)',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: 'var(--accent-color)',
              backdropFilter: 'blur(10px)'
            }}>
              <FaChalkboardTeacher />
              Free Learning
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant Section */}
      <AI />

      {/* Categories Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-2xl)' }}>
        {categories.map((category, categoryIndex) => (
          <section 
            key={category.key} 
            style={{ 
              background: 'var(--background-primary)', 
              borderRadius: 'var(--radius-2xl)', 
              boxShadow: 'var(--shadow-lg)', 
              padding: 'var(--space-2xl)', 
              border: '1px solid var(--border-light)',
              position: 'relative',
              overflow: 'hidden',
              animation: `slideInUp 0.6s ease-out ${categoryIndex * 0.1}s both`
            }}
          >
            {/* Category Header */}
            <div style={{
              position: 'relative',
              marginBottom: 'var(--space-xl)'
            }}>
              <h2 style={{ 
                color: 'var(--primary-color)', 
                borderBottom: '3px solid var(--primary-lighter)', 
                paddingBottom: 'var(--space-md)', 
                marginBottom: 'var(--space-lg)', 
                fontWeight: '700', 
                fontSize: '2rem', 
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-md)'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.5rem',
                  boxShadow: 'var(--shadow-md)'
                }}>
                  {getCategoryIcon(category.name)}
                </div>
                {category.name}
              </h2>
              
              <div style={{
                position: 'absolute',
                top: '0',
                right: '0',
                background: 'linear-gradient(135deg, var(--primary-lighter), var(--accent-lighter))',
                padding: 'var(--space-sm) var(--space-md)',
                borderRadius: 'var(--radius-lg)',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--primary-color)'
              }}>
                {results[category.key] ? results[category.key].length : 0} Resources
              </div>
            </div>
            
            {/* Resources Grid */}
            <div className="search-results" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: 'var(--space-lg)' 
            }}>
              {results[category.key] && results[category.key].slice(0, 9).map((result, index) => (
                <div 
                  key={index} 
                  className="search-result-item" 
                  style={{ 
                    background: 'var(--background-secondary)', 
                    borderRadius: 'var(--radius-xl)', 
                    boxShadow: 'var(--shadow-md)', 
                    padding: 'var(--space-xl)', 
                    transition: 'all var(--transition-normal)', 
                    border: '1px solid var(--border-light)', 
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    animation: `fadeInUp 0.5s ease-out ${index * 0.05}s both`
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-8px) scale(1.02)';
                    e.target.style.boxShadow = 'var(--shadow-2xl)';
                    e.target.style.borderColor = 'var(--primary-color)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0) scale(1)';
                    e.target.style.boxShadow = 'var(--shadow-md)';
                    e.target.style.borderColor = 'var(--border-light)';
                  }}
                  onClick={() => window.open(result.link, '_blank')}
                >
                  {/* Popularity Badge */}
                  {getPopularityBadge(index) && (
                    <div style={{
                      position: 'absolute',
                      top: 'var(--space-md)',
                      right: 'var(--space-md)',
                      background: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'var(--shadow-sm)',
                      backdropFilter: 'blur(10px)'
                    }}>
                      {getPopularityBadge(index)}
                    </div>
                  )}

                  {/* Resource Header */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start', 
                    marginBottom: 'var(--space-md)' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                      {getTechnologyIcon(result.title)}
                      <span style={{ 
                        background: 'var(--primary-lighter)', 
                        color: 'var(--primary-color)', 
                        padding: '4px 8px', 
                        borderRadius: 'var(--radius-sm)', 
                        fontSize: '0.75rem', 
                        fontWeight: '600', 
                        whiteSpace: 'nowrap', 
                        marginLeft: 'var(--space-xs)' 
                      }}>
                        {result.source}
                      </span>
                    </div>
                    {getPlatformIcon(result.link)}
                  </div>

                  {/* Resource Title */}
                  <h4 style={{ 
                    margin: '0 0 var(--space-md) 0', 
                    fontSize: '1.1rem', 
                    lineHeight: '1.4', 
                    flex: 1,
                    color: 'var(--primary-color)',
                    textDecoration: 'none',
                    fontWeight: '600',
                    transition: 'color var(--transition-fast)'
                  }}>
                    {result.title}
                  </h4>

                  {/* Resource Meta */}
                  <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', marginBottom: 'var(--space-md)' }}>
                    <span style={{ 
                      background: 'var(--accent-lighter)', 
                      color: 'var(--accent-color)', 
                      padding: '4px 8px', 
                      borderRadius: 'var(--radius-sm)', 
                      fontSize: '0.75rem', 
                      fontWeight: '500' 
                    }}>
                      {result.type}
                    </span>
                    <span style={{ 
                      background: result.difficulty === 'beginner' 
                        ? 'rgba(34, 197, 94, 0.15)' 
                        : result.difficulty === 'intermediate' 
                        ? 'rgba(245, 158, 11, 0.15)' 
                        : 'rgba(239, 68, 68, 0.15)',
                      color: result.difficulty === 'beginner' 
                        ? '#15803d' 
                        : result.difficulty === 'intermediate' 
                        ? '#a16207' 
                        : '#b91c1c',
                      padding: '4px 8px', 
                      borderRadius: 'var(--radius-sm)', 
                      fontSize: '0.75rem', 
                      fontWeight: '600',
                      border: `1px solid ${result.difficulty === 'beginner' 
                        ? 'rgba(34, 197, 94, 0.3)' 
                        : result.difficulty === 'intermediate' 
                        ? 'rgba(245, 158, 11, 0.3)' 
                        : 'rgba(239, 68, 68, 0.3)'}`,
                      textTransform: 'capitalize'
                    }}>
                      {result.difficulty}
                    </span>
                    {result.free && (
                      <span style={{ 
                        background: 'var(--warning-lighter)', 
                        color: 'var(--warning-color)', 
                        padding: '4px 8px', 
                        borderRadius: 'var(--radius-sm)', 
                        fontSize: '0.75rem', 
                        fontWeight: '500' 
                      }}>
                        Free
                      </span>
                    )}
                  </div>

                  {/* Hover Effect Overlay */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(6, 182, 212, 0.1))',
                    opacity: 0,
                    transition: 'opacity var(--transition-normal)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none'
                  }}>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.9)',
                      padding: 'var(--space-sm) var(--space-md)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: 'var(--primary-color)',
                      backdropFilter: 'blur(10px)'
                    }}>
                      Click to Open
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .search-result-item:hover .hover-overlay {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default Home; 