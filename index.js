const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const itemsRoutes = require('./routes/items');
const contactRoutes = require('./routes/contact');
const getInvolvedRoutes = require('./routes/get-involved');
const mediaRoutes = require('./routes/media');
const educationRoutes = require('./routes/education');
const uploadRoutes = require('./routes/upload');
const theColleagueUniRoutes = require('./routes/thecolleagueuni');
const researchRoutes = require('./routes/research');
const designRoutes = require('./routes/design');
const homeRoutes = require('./routes/home');
const newsEventsRoutes = require('./routes/newsevents'); // NEW: News & Events routes
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
      media: "/api/media",
      education: "/api/education",
      upload: "/api/upload",
      thecolleagueuni: "/api/thecolleagueuni",
      research: "/api/research",
      design: "/api/design",
      home: "/api/home",
      newsevents: "/api/newsevents" // NEW: News & Events endpoint
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
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/videos', express.static(path.join(__dirname, 'public/videos')));
app.use('/documents', express.static(path.join(__dirname, 'public/documents')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/get-involved', getInvolvedRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/thecolleagueuni', theColleagueUniRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/design', designRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/newsevents', newsEventsRoutes); // NEW: News & Events routes

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
      media: "/api/media",
      education: "/api/education",
      upload: "/api/upload",
      thecolleagueuni: "/api/thecolleagueuni",
      research: "/api/research",
      design: "/api/design",
      home: "/api/home",
      newsevents: "/api/newsevents" // NEW: News & Events endpoint
    }
  });
});

// Health check endpoint with detailed database info
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    const { getPool } = require('./db');
    const pool = getPool();
    
    let tableCounts = {};
    if (dbStatus) {
      // Get counts from major tables to verify data integrity
      const tables = [
        'items', 'contact_submissions', 'contact_info', 'admins',
        'membership_applications', 'donations', 'feedback_submissions', 'idea_submissions',
        'community_stories', 'partnership_inquiries',
        'media_photos', 'media_videos', 'media_designs', 'media_testimonials',
        'education_workshops', 'education_tutorials', 'education_exhibitions',
        'architecture_colleagues_contact', 'architecture_colleagues_team',
        'architecture_colleagues_initiatives', 'architecture_colleagues_values', 
        'architecture_colleagues_mission',
        'research_articles', 'sustainable_practices', 'climate_strategies', 'social_studies', 'research_stats',
        'news_articles', 'events' // NEW: News & Events tables
      ];
      
      for (let table of tables) {
        try {
          const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
          tableCounts[table] = parseInt(result.rows[0].count);
        } catch (error) {
          tableCounts[table] = 'Error: ' + error.message;
        }
      }
    }
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: dbStatus ? 'Connected' : 'Disconnected',
      environment: process.env.NODE_ENV || 'development',
      server: 'ASPIRE Design Lab Backend',
      modules: {
        main: 'ASPIRE Design Lab',
        architecture_colleagues: 'The Architecture Colleagues Lab',
        research: 'Research & Insights',
        home: 'Home Page Data',
        newsevents: 'News & Events' // NEW: News & Events module
      },
      tables: tableCounts
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      timestamp: new Date().toISOString(),
      database: 'Check failed',
      error: error.message
    });
  }
});

// Database status endpoint
app.get('/api/database/status', async (req, res) => {
  try {
    const { getPool } = require('./db');
    const pool = getPool();
    const client = await pool.connect();
    
    // Get database version and connection info
    const versionResult = await client.query('SELECT version()');
    const dbSizeResult = await client.query('SELECT pg_size_pretty(pg_database_size(current_database())) as size');
    
    // Get table statistics
    const tableStats = await client.query(`
      SELECT 
        schemaname,
        tablename,
        tableowner,
        tablespace,
        hasindexes,
        hasrules,
        hastriggers
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    client.release();
    
    res.json({
      database: {
        version: versionResult.rows[0].version,
        size: dbSizeResult.rows[0].size,
        connection: 'Healthy'
      },
      tables: tableStats.rows,
      totalTables: tableStats.rows.length,
      modules: {
        aspire_design_lab: 'Active',
        architecture_colleagues_lab: 'Active',
        research_insights: 'Active',
        home_page: 'Active',
        news_events: 'Active' // NEW: News & Events module
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get database status',
      details: error.message
    });
  }
});

// Architecture Colleagues Lab specific health check
app.get('/api/thecolleagueuni/health', async (req, res) => {
  try {
    const { getPool } = require('./db');
    const pool = getPool();
    
    const tables = [
      'architecture_colleagues_contact',
      'architecture_colleagues_team',
      'architecture_colleagues_initiatives',
      'architecture_colleagues_values',
      'architecture_colleagues_mission'
    ];
    
    let tableCounts = {};
    for (let table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        tableCounts[table] = parseInt(result.rows[0].count);
      } catch (error) {
        tableCounts[table] = 'Error: ' + error.message;
      }
    }
    
    res.json({
      status: 'OK',
      module: 'The Architecture Colleagues Lab',
      timestamp: new Date().toISOString(),
      tables: tableCounts,
      endpoints: {
        contact: 'POST /api/thecolleagueuni/contact',
        team: 'GET /api/thecolleagueuni/team',
        mission: 'GET /api/thecolleagueuni/mission',
        initiatives: 'GET /api/thecolleagueuni/initiatives',
        about: 'GET /api/thecolleagueuni/about',
        contacts_admin: 'GET /api/thecolleagueuni/contacts'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      module: 'The Architecture Colleagues Lab',
      error: error.message
    });
  }
});

// Research specific health check
app.get('/api/research/health', async (req, res) => {
  try {
    const { getPool } = require('./db');
    const pool = getPool();
    
    const tables = [
      'research_articles',
      'sustainable_practices',
      'climate_strategies',
      'social_studies',
      'research_stats'
    ];
    
    let tableCounts = {};
    for (let table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        tableCounts[table] = parseInt(result.rows[0].count);
      } catch (error) {
        tableCounts[table] = 'Error: ' + error.message;
      }
    }
    
    res.json({
      status: 'OK',
      module: 'Research & Insights',
      timestamp: new Date().toISOString(),
      tables: tableCounts,
      endpoints: {
        overview: 'GET /api/research/overview',
        articles: 'GET /api/research/articles',
        sustainable_practices: 'GET /api/research/sustainable-practices',
        climate_strategies: 'GET /api/research/climate-strategies',
        social_studies: 'GET /api/research/social-studies',
        admin: 'GET /api/research/admin'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      module: 'Research & Insights',
      error: error.message
    });
  }
});

// Home specific health check
app.get('/api/home/health', async (req, res) => {
  try {
    const { getPool } = require('./db');
    const pool = getPool();
    
    const tables = [
      'items',
      'research_articles',
      'education_exhibitions'
    ];
    
    let tableCounts = {};
    for (let table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        tableCounts[table] = parseInt(result.rows[0].count);
      } catch (error) {
        tableCounts[table] = 'Error: ' + error.message;
      }
    }
    
    res.json({
      status: 'OK',
      module: 'Home Page Data',
      timestamp: new Date().toISOString(),
      tables: tableCounts,
      endpoints: {
        all_data: 'GET /api/home',
        featured_designs: 'GET /api/home/featured-designs',
        research_highlights: 'GET /api/home/research-highlights',
        upcoming_events: 'GET /api/home/upcoming-events',
        health: 'GET /api/home/health'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      module: 'Home Page Data',
      error: error.message
    });
  }
});

// News & Events specific health check
app.get('/api/newsevents/health', async (req, res) => {
  try {
    const { getPool } = require('./db');
    const pool = getPool();
    
    const tables = [
      'news_articles',
      'events'
    ];
    
    let tableCounts = {};
    for (let table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        tableCounts[table] = parseInt(result.rows[0].count);
      } catch (error) {
        tableCounts[table] = 'Error: ' + error.message;
      }
    }
    
    res.json({
      status: 'OK',
      module: 'News & Events',
      timestamp: new Date().toISOString(),
      tables: tableCounts,
      endpoints: {
        all: 'GET /api/newsevents/all',
        news: 'GET /api/newsevents/news',
        events: 'GET /api/newsevents/events',
        featured: 'GET /api/newsevents/featured',
        health: 'GET /api/newsevents/health'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      module: 'News & Events',
      error: error.message
    });
  }
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
      media: "/api/media",
      education: "/api/education",
      upload: "/api/upload",
      database: "/api/database/status",
      thecolleagueuni: "/api/thecolleagueuni",
      thecolleagueuni_health: "/api/thecolleagueuni/health",
      research: "/api/research",
      research_health: "/api/research/health",
      design: "/api/design",
      home: "/api/home",
      home_health: "/api/home/health",
      newsevents: "/api/newsevents", // NEW: News & Events endpoint
      newsevents_health: "/api/newsevents/health" // NEW: News & Events health
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Start server
async function startServer() {
  try {
    console.log('🔄 Starting ASPIRE Design Lab server...');
    
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Cannot start server without database connection');
      process.exit(1);
    }

    console.log('🔄 Initializing database...');
    const dbInitialized = await initDb();
    
    if (!dbInitialized) {
      console.error('❌ Database initialization failed');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`\n🎉 ASPIRE Design Lab Server Started Successfully!`);
      console.log(`=========================================`);
      console.log(`✅ Server URL: http://localhost:${PORT}`);
      console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`\n📋 Available Modules:`);
      console.log(`   🏠 Main Content: http://localhost:${PORT}/api/items`);
      console.log(`   📞 Contact System: http://localhost:${PORT}/api/contact`);
      console.log(`   🤝 Get Involved: http://localhost:${PORT}/api/get-involved`);
      console.log(`   🖼️ Media Gallery: http://localhost:${PORT}/api/media`);
      console.log(`   📚 Education: http://localhost:${PORT}/api/education`);
      console.log(`   ⬆️ File Upload: http://localhost:${PORT}/api/upload`);
      console.log(`   🛡️ Authentication: http://localhost:${PORT}/api/auth`);
      console.log(`   🏛️ Architecture Colleagues Lab: http://localhost:${PORT}/api/thecolleagueuni`);
      console.log(`   🔬 Research & Insights: http://localhost:${PORT}/api/research`);
      console.log(`   🎨 Design Projects: http://localhost:${PORT}/api/design`);
      console.log(`   🏡 Home Page Data: http://localhost:${PORT}/api/home`);
      console.log(`   📰 News & Events: http://localhost:${PORT}/api/newsevents`); // NEW: News & Events module
      console.log(`\n🔍 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`📊 Database Status: http://localhost:${PORT}/api/database/status`);
      console.log(`🏛️ Architecture Colleagues Health: http://localhost:${PORT}/api/thecolleagueuni/health`);
      console.log(`🔬 Research Health: http://localhost:${PORT}/api/research/health`);
      console.log(`🏡 Home Health: http://localhost:${PORT}/api/home/health`);
      console.log(`📰 News & Events Health: http://localhost:${PORT}/api/newsevents/health`); // NEW: News & Events health
      console.log(`=========================================\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down server gracefully...');
  const { getPool } = require('./db');
  const pool = getPool();
  await pool.end();
  console.log('✅ Database connections closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Server termination requested...');
  const { getPool } = require('./db');
  const pool = getPool();
  await pool.end();
  console.log('✅ Database connections closed');
  process.exit(0);
});

startServer();