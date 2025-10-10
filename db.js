const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_SLMpTuH64wFc@ep-young-haze-ad2xjvz6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test database connection
async function testConnection() {
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Connected to Neon PostgreSQL successfully');
    
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQL Version:', result.rows[0].version);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  } finally {
    if (client) client.release();
  }
}

// Initialize database tables
async function initDb() {
  let client;
  try {
    client = await pool.connect();
    console.log('🔄 Initializing database tables...');
    
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Admins table created/verified');

    await client.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        type VARCHAR(100) NOT NULL,
        content TEXT,
        image VARCHAR(500),
        files JSONB,
        status VARCHAR(50) DEFAULT 'published',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Items table created/verified');

    await client.query(`
      CREATE TABLE IF NOT EXISTS contact_submissions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'new',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Contact submissions table created/verified');

    await client.query(`
      CREATE TABLE IF NOT EXISTS contact_info (
        id SERIAL PRIMARY KEY,
        type VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        value TEXT NOT NULL,
        description TEXT,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Contact info table created/verified');

    await client.query(`
      CREATE TABLE IF NOT EXISTS email_settings (
        id SERIAL PRIMARY KEY,
        recipient_email VARCHAR(255) NOT NULL,
        subject_template VARCHAR(500) DEFAULT 'New Contact Form Submission - ASPIRE Design Lab',
        enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Email settings table created/verified');

    // NEW TABLES FOR GET INVOLVED PAGE
    await client.query(`
      CREATE TABLE IF NOT EXISTS membership_applications (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        membership_type VARCHAR(100) NOT NULL,
        organization VARCHAR(255),
        position VARCHAR(255),
        experience_years INTEGER,
        interests JSONB,
        message TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Membership applications table created/verified');

    await client.query(`
      CREATE TABLE IF NOT EXISTS donations (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        payment_method VARCHAR(100) NOT NULL,
        transaction_id VARCHAR(255),
        bank_name VARCHAR(255),
        account_number VARCHAR(255),
        mtn_mobile_number VARCHAR(50),
        payment_proof VARCHAR(500),
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Donations table created/verified');

    await client.query(`
      CREATE TABLE IF NOT EXISTS feedback_submissions (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        subject VARCHAR(500),
        message TEXT NOT NULL,
        rating INTEGER,
        status VARCHAR(50) DEFAULT 'new',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Feedback submissions table created/verified');

    await client.query(`
      CREATE TABLE IF NOT EXISTS idea_submissions (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        idea_title VARCHAR(500) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        expected_outcomes TEXT,
        target_audience VARCHAR(255),
        status VARCHAR(50) DEFAULT 'under_review',
        priority VARCHAR(50) DEFAULT 'medium',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Idea submissions table created/verified');

    await client.query(`
      CREATE TABLE IF NOT EXISTS community_stories (
        id SERIAL PRIMARY KEY,
        author_name VARCHAR(255) NOT NULL,
        author_title VARCHAR(255),
        author_organization VARCHAR(255),
        story_title VARCHAR(500) NOT NULL,
        story_content TEXT NOT NULL,
        category VARCHAR(100),
        featured_image VARCHAR(500),
        is_featured BOOLEAN DEFAULT false,
        is_published BOOLEAN DEFAULT true,
        status VARCHAR(50) DEFAULT 'published',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Community stories table created/verified');

    await client.query(`
      CREATE TABLE IF NOT EXISTS partnership_inquiries (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        organization VARCHAR(255) NOT NULL,
        position VARCHAR(255),
        partnership_type VARCHAR(100) NOT NULL,
        proposal TEXT,
        budget_range VARCHAR(100),
        timeline VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Partnership inquiries table created/verified');

    // NEW TABLES FOR MEDIA GALLERY
    await client.query(`
      CREATE TABLE IF NOT EXISTS media_photos (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        image_url VARCHAR(500) NOT NULL,
        category VARCHAR(100) NOT NULL,
        album_name VARCHAR(255),
        tags JSONB,
        display_order INTEGER DEFAULT 0,
        is_featured BOOLEAN DEFAULT false,
        is_published BOOLEAN DEFAULT true,
        status VARCHAR(50) DEFAULT 'published',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Media photos table created/verified');

    await client.query(`
      CREATE TABLE IF NOT EXISTS media_videos (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        video_url VARCHAR(500),
        thumbnail_url VARCHAR(500) NOT NULL,
        duration VARCHAR(20),
        category VARCHAR(100),
        tags JSONB,
        is_featured BOOLEAN DEFAULT false,
        is_published BOOLEAN DEFAULT true,
        status VARCHAR(50) DEFAULT 'published',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Media videos table created/verified');

    await client.query(`
      CREATE TABLE IF NOT EXISTS media_designs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        image_url VARCHAR(500) NOT NULL,
        design_type VARCHAR(100) NOT NULL,
        category VARCHAR(100),
        project_name VARCHAR(255),
        tags JSONB,
        display_order INTEGER DEFAULT 0,
        is_featured BOOLEAN DEFAULT false,
        is_published BOOLEAN DEFAULT true,
        status VARCHAR(50) DEFAULT 'published',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Media designs table created/verified');

    await client.query(`
      CREATE TABLE IF NOT EXISTS media_testimonials (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(255) NOT NULL,
        organization VARCHAR(255),
        quote TEXT NOT NULL,
        project_name VARCHAR(255),
        image_url VARCHAR(500),
        rating INTEGER,
        is_featured BOOLEAN DEFAULT false,
        is_published BOOLEAN DEFAULT true,
        status VARCHAR(50) DEFAULT 'published',
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Media testimonials table created/verified');

    // Check if admin user exists
    const adminCheck = await client.query('SELECT * FROM admins WHERE username = $1', ['admin']);
    
    if (adminCheck.rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('changeme', 12);
      
      await client.query(
        'INSERT INTO admins (username, password) VALUES ($1, $2)',
        ['admin', hashedPassword]
      );
      console.log('✅ Created default admin user (admin/changeme)');
    } else {
      console.log('✅ Admin user already exists');
    }

    // Insert default data
    await insertDefaultData(client);
    
    console.log('🎉 Database initialization completed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  } finally {
    if (client) client.release();
  }
}

async function insertDefaultData(client) {
  console.log('🔄 Inserting default data...');
  
  const defaultContactInfo = [
    { 
      type: 'address', 
      title: 'Visit Us', 
      value: '123 Architecture Avenue\nDesign District, DC 10001', 
      description: 'Our office location',
      display_order: 1 
    },
    { 
      type: 'phone', 
      title: 'Call Us', 
      value: '+1 (555) 123-4567', 
      description: 'Mon-Fri, 9:00 AM - 6:00 PM',
      display_order: 2 
    },
    { 
      type: 'email', 
      title: 'Email Us', 
      value: 'hello@aspirearchitecture.com\ninfo@aspirearchitecture.com', 
      description: 'Primary contact emails',
      display_order: 3 
    }
  ];

  const defaultEmailSettings = [
    { 
      recipient_email: 'admin@aspirearchitecture.com', 
      subject_template: 'New Contact Form Submission - ASPIRE Design Lab',
      enabled: true 
    }
  ];

  // Default community stories
  const defaultStories = [
    {
      author_name: 'Maria L.',
      author_title: 'Architect',
      author_organization: 'Sustainable Design Studio',
      story_title: 'Transformed My Practice',
      story_content: 'The sustainable design workshop completely changed how I approach projects. I\'ve implemented eco-friendly practices that reduced energy costs by 40% for my clients.',
      category: 'workshop',
      is_featured: true
    },
    {
      author_name: 'James T.',
      author_title: 'Designer',
      author_organization: 'Urban Innovations Ltd',
      story_title: 'Career Advancement',
      story_content: 'Through the mentorship program, I connected with an experienced architect who guided me through my licensure process. I\'m now a project lead at my firm.',
      category: 'mentorship',
      is_featured: true
    },
    {
      author_name: 'Sofia K.',
      author_title: 'Urban Planner',
      author_organization: 'City Planning Department',
      story_title: 'Invaluable Network',
      story_content: 'The connections I\'ve made through membership have led to collaborative projects and friendships with architects from around the world.',
      category: 'membership',
      is_featured: true
    }
  ];

  // Default media data
  const defaultPhotos = [
    {
      title: "Urban Architecture",
      description: "Modern urban architecture showcasing sustainable design principles",
      image_url: "/images/pome.jpg",
      category: "Architecture",
      album_name: "Urban Projects",
      tags: ['urban', 'modern', 'sustainable'],
      is_featured: true
    },
    {
      title: "Nature Integration",
      description: "Architecture that seamlessly integrates with natural surroundings",
      image_url: "/images/library.jpg",
      category: "Nature",
      album_name: "Nature Integration",
      tags: ['nature', 'integration', 'green'],
      is_featured: true
    },
    {
      title: "Modern Design",
      description: "Contemporary residential design with clean lines",
      image_url: "/images/villa.jpg",
      category: "Residential",
      album_name: "Residential Projects",
      tags: ['modern', 'residential', 'contemporary'],
      is_featured: false
    },
    {
      title: "Community Spaces",
      description: "Public spaces designed for community interaction",
      image_url: "/images/park.jpg",
      category: "Public",
      album_name: "Public Spaces",
      tags: ['community', 'public', 'spaces'],
      is_featured: true
    },
    {
      title: "Interior Design",
      description: "Innovative interior spaces for commercial use",
      image_url: "/images/office.jpg",
      category: "Commercial",
      album_name: "Commercial Interiors",
      tags: ['interior', 'commercial', 'design'],
      is_featured: false
    },
    {
      title: "Cultural Heritage",
      description: "Preservation and modernization of cultural heritage sites",
      image_url: "/images/pavilion.jpg",
      category: "Cultural",
      album_name: "Cultural Projects",
      tags: ['cultural', 'heritage', 'preservation'],
      is_featured: true
    }
  ];

  const defaultVideos = [
    {
      title: "Project Walkthrough",
      description: "Complete walkthrough of our latest architectural project",
      video_url: "/videos/wa.mp4",
      thumbnail_url: "/images/pome.jpg",
      duration: "2:45",
      category: "Project Showcase",
      tags: ['walkthrough', 'project', 'architecture'],
      is_featured: true
    },
    {
      title: "Design Process",
      description: "Behind the scenes of our design and planning process",
      video_url: "/videos/wa.mp4",
      thumbnail_url: "/images/villa.jpg",
      duration: "4:20",
      category: "Process",
      tags: ['design', 'process', 'behind-scenes'],
      is_featured: true
    },
    {
      title: "Client Testimonials",
      description: "What our clients say about working with us",
      video_url: "/videos/wa.mp4",
      thumbnail_url: "/images/office.jpg",
      duration: "3:15",
      category: "Testimonials",
      tags: ['clients', 'testimonials', 'feedback'],
      is_featured: false
    },
    {
      title: "Construction Progress",
      description: "Timelapse of construction progress on major projects",
      video_url: "/videos/wa.mp4",
      thumbnail_url: "/images/housing.jpg",
      duration: "5:30",
      category: "Construction",
      tags: ['construction', 'progress', 'timelapse'],
      is_featured: true
    }
  ];

  const defaultDesigns = [
    {
      title: "3D Concept Render",
      description: "Initial 3D visualization of architectural concept",
      image_url: "/images/pome.jpg",
      design_type: "Exterior",
      category: "Concept",
      project_name: "Urban Tower Project",
      tags: ['3d', 'render', 'concept'],
      is_featured: true
    },
    {
      title: "Interior Visualization",
      description: "Detailed interior space visualization",
      image_url: "/images/library.jpg",
      design_type: "Interior",
      category: "Interior Design",
      project_name: "Modern Library",
      tags: ['interior', 'visualization', 'design'],
      is_featured: true
    },
    {
      title: "Landscape Design",
      description: "Sustainable landscape integration design",
      image_url: "/images/park.jpg",
      design_type: "Landscape",
      category: "Landscape",
      project_name: "Community Park",
      tags: ['landscape', 'sustainable', 'design'],
      is_featured: false
    },
    {
      title: "Urban Planning",
      description: "Masterplan for urban development project",
      image_url: "/images/office.jpg",
      design_type: "Masterplan",
      category: "Urban Planning",
      project_name: "City Center Development",
      tags: ['urban', 'planning', 'masterplan'],
      is_featured: true
    }
  ];

  const defaultTestimonials = [
    {
      name: "Sarah Johnson",
      role: "Community Resident",
      organization: "Local Community",
      quote: "The design completely transformed our neighborhood. It's both beautiful and functional.",
      project_name: "Urban Green Park",
      image_url: "/images/pome.jpg",
      rating: 5,
      is_featured: true
    },
    {
      name: "Michael Chen",
      role: "Local Business Owner",
      organization: "Tech Innovations Inc.",
      quote: "The attention to detail and understanding of our needs made this project exceptional.",
      project_name: "Modern Campus Library",
      image_url: "/images/villa.jpg",
      rating: 5,
      is_featured: true
    },
    {
      name: "Dr. Emily Rodriguez",
      role: "University Professor",
      organization: "City University",
      quote: "The sustainable approach and innovative design set a new standard for campus architecture.",
      project_name: "University Innovation Center",
      image_url: "/images/office.jpg",
      rating: 5,
      is_featured: false
    },
    {
      name: "Robert Kim",
      role: "City Planner",
      organization: "Municipal Government",
      quote: "Their collaborative approach and expertise in urban design made this project a success.",
      project_name: "Downtown Revitalization",
      image_url: "/images/park.jpg",
      rating: 5,
      is_featured: true
    }
  ];

  // Insert default contact info
  for (const info of defaultContactInfo) {
    const exists = await client.query(
      'SELECT id FROM contact_info WHERE type = $1 AND title = $2',
      [info.type, info.title]
    );
    
    if (exists.rows.length === 0) {
      await client.query(
        `INSERT INTO contact_info (type, title, value, description, display_order) 
         VALUES ($1, $2, $3, $4, $5)`,
        [info.type, info.title, info.value, info.description, info.display_order]
      );
      console.log(`✅ Added contact info: ${info.title}`);
    }
  }

  // Insert default email settings
  for (const setting of defaultEmailSettings) {
    const exists = await client.query(
      'SELECT id FROM email_settings WHERE recipient_email = $1',
      [setting.recipient_email]
    );
    
    if (exists.rows.length === 0) {
      await client.query(
        `INSERT INTO email_settings (recipient_email, subject_template, enabled) 
         VALUES ($1, $2, $3)`,
        [setting.recipient_email, setting.subject_template, setting.enabled]
      );
      console.log(`✅ Added email setting for: ${setting.recipient_email}`);
    }
  }

  // Insert default community stories
  for (const story of defaultStories) {
    const exists = await client.query(
      'SELECT id FROM community_stories WHERE story_title = $1 AND author_name = $2',
      [story.story_title, story.author_name]
    );
    
    if (exists.rows.length === 0) {
      await client.query(
        `INSERT INTO community_stories (author_name, author_title, author_organization, story_title, story_content, category, is_featured) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [story.author_name, story.author_title, story.author_organization, story.story_title, story.story_content, story.category, story.is_featured]
      );
      console.log(`✅ Added community story: ${story.story_title}`);
    }
  }

  // Insert default media photos
  for (const photo of defaultPhotos) {
    const exists = await client.query(
      'SELECT id FROM media_photos WHERE title = $1 AND image_url = $2',
      [photo.title, photo.image_url]
    );
    
    if (exists.rows.length === 0) {
      await client.query(
        `INSERT INTO media_photos (title, description, image_url, category, album_name, tags, is_featured) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [photo.title, photo.description, photo.image_url, photo.category, photo.album_name, JSON.stringify(photo.tags), photo.is_featured]
      );
      console.log(`✅ Added media photo: ${photo.title}`);
    }
  }

  // Insert default media videos
  for (const video of defaultVideos) {
    const exists = await client.query(
      'SELECT id FROM media_videos WHERE title = $1 AND thumbnail_url = $2',
      [video.title, video.thumbnail_url]
    );
    
    if (exists.rows.length === 0) {
      await client.query(
        `INSERT INTO media_videos (title, description, video_url, thumbnail_url, duration, category, tags, is_featured) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [video.title, video.description, video.video_url, video.thumbnail_url, video.duration, video.category, JSON.stringify(video.tags), video.is_featured]
      );
      console.log(`✅ Added media video: ${video.title}`);
    }
  }

  // Insert default media designs
  for (const design of defaultDesigns) {
    const exists = await client.query(
      'SELECT id FROM media_designs WHERE title = $1 AND image_url = $2',
      [design.title, design.image_url]
    );
    
    if (exists.rows.length === 0) {
      await client.query(
        `INSERT INTO media_designs (title, description, image_url, design_type, category, project_name, tags, is_featured) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [design.title, design.description, design.image_url, design.design_type, design.category, design.project_name, JSON.stringify(design.tags), design.is_featured]
      );
      console.log(`✅ Added media design: ${design.title}`);
    }
  }

  // Insert default media testimonials
  for (const testimonial of defaultTestimonials) {
    const exists = await client.query(
      'SELECT id FROM media_testimonials WHERE name = $1 AND quote = $2',
      [testimonial.name, testimonial.quote]
    );
    
    if (exists.rows.length === 0) {
      await client.query(
        `INSERT INTO media_testimonials (name, role, organization, quote, project_name, image_url, rating, is_featured) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [testimonial.name, testimonial.role, testimonial.organization, testimonial.quote, testimonial.project_name, testimonial.image_url, testimonial.rating, testimonial.is_featured]
      );
      console.log(`✅ Added media testimonial: ${testimonial.name}`);
    }
  }
  
  console.log('✅ Default data insertion completed');
}

// Get database pool
function getPool() {
  return pool;
}

// Query helper function
async function query(text, params) {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    if (client) client.release();
  }
}

module.exports = {
  initDb,
  getPool,
  query,
  testConnection
};