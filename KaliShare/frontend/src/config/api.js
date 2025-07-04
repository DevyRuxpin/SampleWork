// API Configuration for different environments
const getApiBaseUrl = () => {
  // In production (Railway), use the environment variable
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_URL || 'https://kalishare-backend.railway.app';
  }
  
  // In development, use the proxy (relative URL)
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: `${API_BASE_URL}/api/auth/signup`,
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    VERIFY: `${API_BASE_URL}/api/auth/verify`,
  },
  TIMELINE: {
    POSTS: `${API_BASE_URL}/api/timeline/posts`,
    COMMENTS: `${API_BASE_URL}/api/timeline/comments`,
  },
  SEARCH: {
    SEARCH: `${API_BASE_URL}/api/search`,
  },
  HEALTH: `${API_BASE_URL}/health`,
};

// Helper function to make API calls
export const apiCall = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}; 