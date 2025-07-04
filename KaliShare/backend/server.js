require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const authRoutes = require('./routes/auth');
const timelineRoutes = require('./routes/timeline');
const searchRoutes = require('./routes/search');
const aiRoutes = require('./routes/ai');
const { initDatabase, query } = require('./database/db');
const resourceGenerator = require('./services/resourceGenerator');

const app = express();
const server = createServer(app);

// Trust proxy for rate limiting (fixes X-Forwarded-For header error)
app.set('trust proxy', 1);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// More flexible CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "https://kalishare-app-production.up.railway.app",
  "https://*.up.railway.app",
  "https://*.railway.app",
  "https://railway.com" // Temporary fallback
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow localhost origins
    if (process.env.NODE_ENV !== 'production') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }
    
    // Always allow Railway domains
    if (origin.includes('railway.app') || origin.includes('railway.com')) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin) || 
        allowedOrigins.some(allowed => allowed.includes('*') && origin.includes(allowed.replace('*', '')))) {
      return callback(null, true);
    }
    
    console.log('CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(generalLimiter);

// Specific rate limiting for search endpoints
const searchLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // limit each IP to 30 search requests per 5 minutes
  message: 'Too many search requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/search', searchLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/ai', aiRoutes);

// Health check for Render deployment
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await query('SELECT 1');
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'kalishare-backend',
      database: 'connected',
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'kalishare-backend',
      database: 'disconnected',
      error: error.message
    });
  }
});

// API health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Kali Skill Share API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Kali Skill Share API',
    version: '1.0.0',
    description: 'Web development skill sharing platform API',
    endpoints: {
      auth: '/api/auth',
      timeline: '/api/timeline',
      search: '/api/search',
      ai: '/api/ai',
      health: '/api/health'
    }
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-timeline', () => {
    socket.join('timeline');
    console.log(`User ${socket.id} joined timeline`);
  });

  socket.on('new-post', (post) => {
    socket.to('timeline').emit('post-added', post);
    console.log(`New post added by user ${socket.id}`);
  });

  socket.on('new-comment', (comment) => {
    socket.to('timeline').emit('comment-added', comment);
    console.log(`New comment added by user ${socket.id}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation Error', 
      details: err.message 
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Invalid or missing authentication token' 
    });
  }
  
  // Default error response
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: `The requested endpoint ${req.originalUrl} does not exist`,
    availableEndpoints: [
      '/api/auth',
      '/api/timeline', 
      '/api/search',
      '/api/health',
      '/health'
    ]
  });
});

const PORT = process.env.PORT || 5000;

// Initialize database and start server
initDatabase()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔍 API info: http://localhost:${PORT}/api`);
      
      // Start the resource generation service
      console.log('🔄 Starting resource generation service...');
      resourceGenerator.start();
      console.log('✅ Resource generation service started (12-hour refresh cycle)');
    });
  })
  .catch(err => {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  resourceGenerator.stop();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  resourceGenerator.stop();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
}); 