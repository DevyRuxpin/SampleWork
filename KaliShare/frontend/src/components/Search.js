import React, { useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { useAnalytics } from '../hooks/useAnalytics';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const { trackUserAction } = useAnalytics();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');
    setCurrentPage(1);
    
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        q: searchQuery,
        page: '1'
      });

      const response = await fetch(`/api/search/keyword?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Search failed');
      }

      const data = await response.json();
      setSearchResults(data.results || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setCurrentPage(data.pagination?.currentPage || 1);
      setTotalResults(data.totalFound || 0);
      
      // Track search activity
      trackUserAction('Search Performed', {
        searchTerm: searchQuery,
        resultCount: data.results ? data.results.length : 0,
        webResultsCount: data.webResultsCount || 0,
        localResultsCount: data.localResultsCount || 0,
        searchType: 'keyword',
        page: data.pagination?.currentPage || 1,
        totalPages: data.pagination?.totalPages || 1
      });
      
    } catch (error) {
      console.error('Search error:', error);
      setError(error.message || 'Failed to perform search');
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setError('');
    setCurrentPage(1);
    setTotalPages(1);
    setTotalResults(0);
  };

  const handlePageChange = async (page) => {
    if (page === currentPage || !searchQuery.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        q: searchQuery,
        page: page.toString()
      });

      const response = await fetch(`/api/search/keyword?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load page');
      }

      const data = await response.json();
      
      // Replace current page results (don't accumulate for pagination)
      const newResults = data.results || [];
      setSearchResults(newResults);
      setCurrentPage(page);
      setTotalPages(data.pagination?.totalPages || totalPages);
      setTotalResults(data.totalFound || 0);
      
      // Track pagination
      trackUserAction('Search Page Changed', {
        searchTerm: searchQuery,
        page: page,
        newResultsCount: newResults.length,
        totalResultsCount: data.totalFound || 0
      });
      
    } catch (error) {
      console.error('Page change error:', error);
      setError(error.message || 'Failed to load page');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#2c3e50', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <FaSearch style={{ color: '#007bff', fontSize: '1.5rem' }} />
          Search Educational Resources
        </h1>
        <p style={{ color: '#6c757d', fontSize: '1.1rem', marginBottom: '30px' }}>
          Find tutorials, documentation, videos, and more for web development
        </p>

        {/* Search Form */}
        <div className="card" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.07)', border: '1px solid #e3e3e3', marginBottom: '20px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                <FaSearch style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: '#6c757d',
                  fontSize: '1.1rem'
                }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for tutorials, guides, documentation..."
                  className="form-control"
                  style={{ 
                    paddingLeft: '40px',
                    fontSize: 16,
                    border: '2px solid #e3e3e3',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease'
                  }}
                  disabled={loading}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      fontSize: '1.2rem',
                      color: '#6c757d',
                      cursor: 'pointer',
                      padding: '0',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      transition: 'all 0.2s ease'
                    }}
                    disabled={loading}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading || !searchQuery.trim()}
                style={{ minWidth: 120 }}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{ 
            background: '#f8d7da', 
            color: '#721c24', 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div>
            <div style={{ 
              background: '#e7f3ff', 
              border: '1px solid #b3d9ff', 
              borderRadius: '8px', 
              padding: '16px', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              fontSize: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaSearch style={{ color: '#007bff' }} />
                <strong>Search Results for "{searchQuery}"</strong>
              </div>
              <div style={{ display: 'flex', gap: '16px', marginLeft: 'auto' }}>
                <span style={{ color: '#007bff' }}>
                  📊 Total: {totalResults} results
                </span>
                <span style={{ color: '#28a745' }}>
                  ✅ Showing {searchResults.length} results
                </span>
              </div>
            </div>
            
            <div className="search-results" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
              {searchResults.map((result, index) => (
                <div key={index} className="search-result-item" style={{ 
                  background: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  border: '1px solid #e3e3e3',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-4px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.12)';
                  e.target.style.borderColor = '#007bff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                  e.target.style.borderColor = '#e3e3e3';
                }}
                onClick={() => window.open(result.link, '_blank')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <h4 style={{ 
                      margin: 0, 
                      fontSize: '1.1rem', 
                      lineHeight: 1.4, 
                      flex: 1,
                      color: '#007bff',
                      textDecoration: 'none',
                      fontWeight: 600
                    }}>
                      {result.title}
                    </h4>
                    <span style={{ 
                      background: '#f3f4f6', 
                      color: '#6b7280', 
                      padding: '4px 8px', 
                      borderRadius: '6px', 
                      fontSize: '0.75rem', 
                      fontWeight: 500, 
                      whiteSpace: 'nowrap', 
                      marginLeft: '8px' 
                    }}>
                      {result.source}
                    </span>
                  </div>
                  <p style={{ 
                    color: '#6b7280', 
                    fontSize: '0.9rem', 
                    lineHeight: 1.5, 
                    marginBottom: '10px' 
                  }}>
                    {result.snippet}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ 
                      background: '#e0e7ff', 
                      color: '#3730a3', 
                      padding: '4px 8px', 
                      borderRadius: '6px', 
                      fontSize: '0.75rem', 
                      fontWeight: 500 
                    }}>
                      {result.type}
                    </span>
                    {result.free && (
                      <span style={{ 
                        background: '#dcfce7', 
                        color: '#166534', 
                        padding: '4px 8px', 
                        borderRadius: '6px', 
                        fontSize: '0.75rem', 
                        fontWeight: 500 
                      }}>
                        Free
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        {searchResults.length > 0 && totalPages > 1 && (
          <div style={{ 
            marginTop: '2rem', 
            padding: '1.5rem', 
            background: 'white', 
            borderRadius: '12px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)', 
            border: '1px solid #e3e3e3'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
              <span>Page {currentPage} of {totalPages}</span>
              <span style={{ fontWeight: 600, color: '#007bff' }}>Total: {totalResults} results</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    style={{
                      padding: '8px 16px',
                      border: '2px solid #e5e7eb',
                      background: currentPage === pageNum ? '#007bff' : 'white',
                      color: currentPage === pageNum ? 'white' : '#374151',
                      borderRadius: '8px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      minWidth: '40px',
                      textAlign: 'center'
                    }}
                    disabled={loading}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && currentPage < totalPages && (
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  style={{
                    padding: '8px 16px',
                    border: '2px solid #e5e7eb',
                    background: '#f3f4f6',
                    color: '#374151',
                    borderRadius: '8px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  disabled={loading}
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}

        {/* No Results */}
        {searchResults.length === 0 && !loading && searchQuery && !error && (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '15px', color: '#6c757d' }}>🔍</div>
            <h3 style={{ color: '#6c757d', marginBottom: '10px' }}>No results found</h3>
            <p style={{ color: '#6c757d', marginBottom: '20px' }}>
              Try adjusting your search terms or browse by category
            </p>
            <button 
              onClick={clearSearch}
              className="btn btn-primary"
              style={{ fontSize: 16 }}
            >
              Clear Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search; 