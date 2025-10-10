const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const itemsRoutes = require('./routes/items');
const contactRoutes = require('./routes/contact');
const getInvolvedRoutes = require('./routes/get-involved');
const mediaRoutes = require('./routes/media'); // ADDED
const uploadRoutes = require('./routes/upload');
const { initDb, testConnection } = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API root endpoint
app.get('/api', (req, res) => {
  res.json({
    message: "ASPIRE Design Lab API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      items: "/api/items", 
      contact: "/api/contact",
      getInvolved: "/api/get-involved",
      media: "/api/media" // ADDED
    },
    documentation: "Check /api/health for server status"
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    status: 'OK'
  });
});

// Serve uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/get-involved', getInvolvedRoutes);
app.use('/api/media', mediaRoutes); // ADDED
app.use('/api/upload', uploadRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: "ASPIRE Design Lab API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      items: "/api/items", 
      contact: "/api/contact",
      getInvolved: "/api/get-involved",
      media: "/api/media" // ADDED
    }
  });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const dbStatus = await testConnection();
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: dbStatus ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development',
    server: 'ASPIRE Design Lab Backend'
  });
});

// Serve admin panel
app.use('/admin', express.static(path.join(__dirname, 'public')));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    availableEndpoints: {
      root: "/api",
      test: "/api/test", 
      health: "/api/health",
      auth: "/api/auth",
      items: "/api/items",
      contact: "/api/contact",
      getInvolved: "/api/get-involved",
      media: "/api/media" // ADDED
    }
  });
});

// Start server
async function startServer() {
  try {
    console.log('🔄 Starting server...');
    
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Cannot start server without database connection');
      process.exit(1);
    }

    console.log('🔄 Initializing database...');
    await initDb();

    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📊 Admin dashboard: http://localhost:${PORT}/admin`);
      console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🎯 Get Involved API: http://localhost:${PORT}/api/get-involved`);
      console.log(`🖼️ Media API: http://localhost:${PORT}/api/media`); // ADDED
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();