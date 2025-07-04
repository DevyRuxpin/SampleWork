import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Timeline from './components/Timeline';
import Search from './components/Search';
import Contact from './components/Contact';
import Login from './components/Login';
import Signup from './components/Signup';
import ReactGA from 'react-ga4';
import { API_ENDPOINTS } from './config/api';
import './App.css';

// Component to track page views
function PageTracker() {
  const location = useLocation();
  
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: location.pathname });
  }, [location]);
  
  return null;
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token with backend
      fetch(API_ENDPOINTS.AUTH.VERIFY, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem('token');
        }
      })
      .catch(err => {
        console.error('Auth verification failed:', err);
        localStorage.removeItem('token');
      })
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="App">
        <PageTracker />
        <Navbar user={user} onLogout={logout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
            <Route path="/timeline" element={user ? <Timeline user={user} /> : <Navigate to="/login" />} />
            <Route path="/search" element={user ? <Search /> : <Navigate to="/login" />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={login} />} />
            <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup onSignup={login} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 