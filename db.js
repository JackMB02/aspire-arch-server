const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_SLMpTuH64wFc@ep-young-haze-ad2xjvz6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: {
    rejectUnauthorized: false
  },
  max: 10, // Reduced from 20 to prevent connection overload
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  maxUses: 7500, // Close connection after 7500 uses
});

// Add error handler for the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Enhanced connection testing with retry logic
async function testConnection() {
  let client;
  let retries = 3;
  
  while (retries > 0) {
    try {
      client = await pool.connect();
      console.log('✅ Connected to Neon PostgreSQL successfully');
      
      const result = await client.query('SELECT version()');
      console.log('📊 PostgreSQL Version:', result.rows[0].version);
      
      return true;
    } catch (error) {
      console.error(`❌ Database connection failed (${retries} retries left):`, error.message);
      retries--;
      
      if (retries > 0) {
        console.log('🔄 Retrying connection in 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } finally {
      if (client) client.release();
    }
  }
  
  return false;
}

// Initialize database tables
async function initDb() {
  let client;
  try {
    client = await pool.connect();
    console.log('🔄 Initializing database tables...');
    
    // MIGRATION: Convert all URL columns from VARCHAR to TEXT for base64 support
    console.log('🔄 Running migrations for base64 image support...');
    const urlColumns = [
      { table: 'media_photos', column: 'image_url' },
      { table: 'media_videos', column: 'video_url' },
      { table: 'media_videos', column: 'thumbnail_url' },
      { table: 'media_designs', column: 'image_url' },
      { table: 'education_workshops', column: 'image_url' },
      { table: 'education_workshops', column: 'document_url' },
      { table: 'education_workshops', column: 'video_url' },
      { table: 'education_tutorials', column: 'document_url' },
      { table: 'education_tutorials', column: 'video_url' },
      { table: 'education_tutorials', column: 'thumbnail_url' },
      { table: 'education_exhibitions', column: 'image_url' },
      { table: 'education_exhibitions', column: 'brochure_url' },
      { table: 'education_exhibitions', column: 'virtual_tour_url' },
      { table: 'media_testimonials', column: 'image_url' },
      { table: 'research_articles', column: 'image_url' },
      { table: 'research_articles', column: 'document_url' },
      { table: 'news_articles', column: 'image_url' },
      { table: 'events', column: 'image_url' },
      { table: 'design_projects', column: 'main_image' },
      { table: 'architecture_colleagues_team', column: 'image_url' }
    ];

    for (const { table, column } of urlColumns) {
      try {
        await client.query(`
          DO $$ 
          BEGIN
            IF EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = '${table}' 
              AND column_name = '${column}'
            ) THEN
              ALTER TABLE ${table} ALTER COLUMN ${column} TYPE TEXT;
            END IF;
          END $$;
        `);
      } catch (err) {
        console.log(`⚠️  Could not migrate ${table}.${column} (table may not exist yet)`);
      }
    }
    console.log('✅ Migration completed for base64 support');
    
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
        image_url TEXT NOT NULL,
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

    // Alter existing columns to TEXT if they exist as VARCHAR
    await client.query(`
      DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'media_photos' 
          AND column_name = 'image_url' 
          AND data_type = 'character varying'
        ) THEN
          ALTER TABLE media_photos ALTER COLUMN image_url TYPE TEXT;
        END IF;
      END $$;
    `);
    console.log('✅ Media photos image_url column updated to TEXT');

    await client.query(`
      CREATE TABLE IF NOT EXISTS media_videos (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        video_url TEXT,
        thumbnail_url TEXT NOT NULL,
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
        image_url TEXT NOT NULL,
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
        image_url TEXT,
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

    // EDUCATION TABLES
    await client.query(`
      CREATE TABLE IF NOT EXISTS education_workshops (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        tag VARCHAR(100) NOT NULL,
        duration VARCHAR(100) NOT NULL,
        date VARCHAR(255) NOT NULL,
        instructor VARCHAR(255) NOT NULL,
        instructor_bio TEXT,
        price DECIMAL(10,2) DEFAULT 0,
        capacity INTEGER DEFAULT 0,
        enrolled_count INTEGER DEFAULT 0,
        location VARCHAR(500),
        image_url TEXT,
        document_url TEXT,
        video_url TEXT,
        is_featured BOOLEAN DEFAULT false,
        is_published BOOLEAN DEFAULT true,
        status VARCHAR(50) DEFAULT 'published',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Education workshops table created/verified');

    await client.query(`
      CREATE TABLE IF NOT EXISTS education_tutorials (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL,
        level VARCHAR(100) NOT NULL,
        format VARCHAR(100) NOT NULL,
        duration VARCHAR(100),
        document_url TEXT,
        video_url TEXT,
        thumbnail_url TEXT,
        download_count INTEGER DEFAULT 0,
        is_featured BOOLEAN DEFAULT false,
        is_published BOOLEAN DEFAULT true,
        status VARCHAR(50) DEFAULT 'published',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Education tutorials table created/verified');

    await client.query(`
      CREATE TABLE IF NOT EXISTS education_exhibitions (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        start_date VARCHAR(255) NOT NULL,
        end_date VARCHAR(255) NOT NULL,
        location VARCHAR(500) NOT NULL,
        curator VARCHAR(255) NOT NULL,
        curator_bio TEXT,
        image_url TEXT,
        brochure_url TEXT,
        virtual_tour_url TEXT,
        is_featured BOOLEAN DEFAULT false,
        is_published BOOLEAN DEFAULT true,
        status VARCHAR(50) DEFAULT 'published',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Education exhibitions table created/verified');

    // ARCHITECTURE COLLEAGUES LAB TABLES
    await client.query(`
      CREATE TABLE IF NOT EXISTS architecture_colleagues_contact (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'new',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Architecture colleagues contact table created/verified');

    await client.query(`
      CREATE TABLE IF NOT EXISTS architecture_colleagues_team (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(255) NOT NULL,
        bio TEXT,
        image_url TEXT,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Architecture colleagues team table created/verified');

    await client.query(`
      CREATE TABLE IF NOT EXISTS architecture_colleagues_initiatives (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'planned',
        target_date DATE,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Architecture colleagues initiatives table created/verified');

    await client.query(`
      CREATE TABLE IF NOT EXISTS architecture_colleagues_values (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Architecture colleagues values table created/verified');

    await client.query(`
      CREATE TABLE IF NOT EXISTS architecture_colleagues_mission (
        id SERIAL PRIMARY KEY,
        mission_statement TEXT NOT NULL,
        vision_statement TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Architecture colleagues mission table created/verified');

    // RESEARCH TABLES
    await client.query(`
      CREATE TABLE IF NOT EXISTS research_articles (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        tag VARCHAR(200) NOT NULL,
        year VARCHAR(50) NOT NULL,
        icon_name VARCHAR(100) NOT NULL,
        category VARCHAR(200) NOT NULL,
        content TEXT,
        image_url TEXT,
        document_url TEXT,
        display_order INTEGER DEFAULT 0,
        is_featured BOOLEAN DEFAULT false,
        is_published BOOLEAN DEFAULT true,
        status VARCHAR(50) DEFAULT 'published',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Research articles table created/verified');

    await client.query(`
      CREATE TABLE IF NOT EXISTS sustainable_practices (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        icon_name VARCHAR(100) NOT NULL,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Sustainable practices table created/verified');

    await client.query(`
      CREATE TABLE IF NOT EXISTS climate_strategies (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        icon_name VARCHAR(100) NOT NULL,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Climate strategies table created/verified');

    await client.query(`
      CREATE TABLE IF NOT EXISTS social_studies (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        focus_area VARCHAR(100) NOT NULL,
        icon_name VARCHAR(100) NOT NULL,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Social studies table created/verified');

    await client.query(`
      CREATE TABLE IF NOT EXISTS research_stats (
        id SERIAL PRIMARY KEY,
        stat_label VARCHAR(255) NOT NULL,
        stat_value VARCHAR(100),
        icon_name VARCHAR(100) NOT NULL,
        category VARCHAR(100) NOT NULL,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Research stats table created/verified');

    // NEW: DESIGN PROJECTS TABLE
    await client.query(`
      CREATE TABLE IF NOT EXISTS design_projects (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        summary TEXT,
        description TEXT,
        category VARCHAR(100) NOT NULL,
        sector VARCHAR(100),
        main_image VARCHAR(500) NOT NULL,
        gallery_images JSONB,
        display_order INTEGER DEFAULT 0,
        is_featured BOOLEAN DEFAULT false,
        is_published BOOLEAN DEFAULT true,
        status VARCHAR(50) DEFAULT 'published',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Design projects table created/verified');

    // NEW: NEWS & EVENTS TABLES
    await client.query(`
      CREATE TABLE IF NOT EXISTS news_articles (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        excerpt TEXT,
        content TEXT,
        image_url TEXT,
        category VARCHAR(100),
        author VARCHAR(100),
        date DATE,
        read_time VARCHAR(50),
        is_featured BOOLEAN DEFAULT false,
        is_published BOOLEAN DEFAULT true,
        status VARCHAR(50) DEFAULT 'published',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ News articles table created/verified');

    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        excerpt TEXT,
        image_url TEXT,
        event_date DATE,
        event_time VARCHAR(100),
        location VARCHAR(255),
        category VARCHAR(100),
        author VARCHAR(100),
        read_time VARCHAR(50),
        is_featured BOOLEAN DEFAULT false,
        is_published BOOLEAN DEFAULT true,
        status VARCHAR(50) DEFAULT 'published',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Events table created/verified');

    // Add sector column to design_projects table if it doesn't exist
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='design_projects' AND column_name='sector') THEN
          ALTER TABLE design_projects ADD COLUMN sector VARCHAR(100);
        END IF;
      END $$;
    `);
    console.log('✅ Design projects sector column verified');

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

  // Default education data
  const defaultWorkshops = [
    {
      title: "Sustainable Design Principles",
      description: "Learn how to integrate eco-friendly practices into your architectural projects from concept to completion.",
      tag: "Beginner",
      duration: "2 Days",
      date: "June 15-16, 2023",
      instructor: "Dr. Elena Martinez",
      instructor_bio: "Expert in sustainable architecture with 15+ years of experience",
      price: 299.00,
      capacity: 30,
      location: "Main Conference Hall",
      image_url: "/images/pome.jpg",
      document_url: "/documents/sustainable-design-guide.pdf",
      is_featured: true
    },
    {
      title: "BIM Implementation Masterclass",
      description: "Advanced training on Building Information Modeling workflows for complex architectural projects.",
      tag: "Advanced",
      duration: "3 Days",
      date: "July 5-7, 2023",
      instructor: "Marcus Johnson",
      instructor_bio: "BIM specialist and certified Revit professional",
      price: 499.00,
      capacity: 25,
      location: "Tech Lab",
      image_url: "/images/office.jpg",
      is_featured: true
    },
    {
      title: "Parametric Design with Rhino & Grasshopper",
      description: "Hands-on workshop exploring computational design techniques for innovative architectural forms.",
      tag: "Intermediate",
      duration: "2 Days",
      date: "June 22-23, 2023",
      instructor: "Sophie Chen",
      instructor_bio: "Computational design expert and researcher",
      price: 399.00,
      capacity: 20,
      location: "Design Studio",
      image_url: "/images/villa.jpg",
      is_featured: false
    }
  ];

  const defaultTutorials = [
    {
      title: "Revit for Architectural Documentation",
      description: "Complete guide to creating professional architectural documentation using Autodesk Revit.",
      category: "Software",
      level: "Beginner",
      format: "Video Series",
      duration: "4 hours",
      document_url: "/documents/revit-guide.pdf",
      video_url: "/videos/revit-tutorial.mp4",
      thumbnail_url: "/images/pome.jpg",
      download_count: 150,
      is_featured: true
    },
    {
      title: "Sustainable Material Selection",
      description: "Handbook for choosing eco-friendly materials that meet performance and aesthetic requirements.",
      category: "Materials",
      level: "Intermediate",
      format: "PDF Guide",
      duration: "2 hours",
      document_url: "/documents/sustainable-materials.pdf",
      thumbnail_url: "/images/library.jpg",
      download_count: 89,
      is_featured: true
    },
    {
      title: "Architectural Rendering with V-Ray",
      description: "Step-by-step tutorial for creating photorealistic architectural visualizations.",
      category: "Visualization",
      level: "Advanced",
      format: "Video Tutorial",
      duration: "3 hours",
      video_url: "/videos/vray-tutorial.mp4",
      thumbnail_url: "/images/office.jpg",
      download_count: 67,
      is_featured: false
    }
  ];

  const defaultExhibitions = [
    {
      title: "Future Cities: Sustainable Urban Futures",
      description: "Exploring innovative approaches to urban design that address climate change and population growth.",
      start_date: "June 1, 2023",
      end_date: "August 31, 2023",
      location: "Main Gallery",
      curator: "Dr. Amanda Chen",
      curator_bio: "Urban design researcher and professor",
      image_url: "/images/pome.jpg",
      brochure_url: "/documents/future-cities-brochure.pdf",
      virtual_tour_url: "/virtual-tours/future-cities",
      is_featured: true
    },
    {
      title: "Material Innovations in Architecture",
      description: "Showcasing cutting-edge materials and their applications in contemporary architecture.",
      start_date: "July 15, 2023",
      end_date: "September 15, 2023",
      location: "Materials Gallery",
      curator: "Prof. Michael Rodriguez",
      curator_bio: "Materials scientist and architect",
      image_url: "/images/library.jpg",
      is_featured: true
    },
    {
      title: "Digital Fabrication: From Concept to Construction",
      description: "Exhibition of projects demonstrating advanced digital fabrication techniques.",
      start_date: "September 1, 2023",
      end_date: "November 30, 2023",
      location: "Technology Pavilion",
      curator: "Alexandra Wong",
      curator_bio: "Digital fabrication specialist",
      image_url: "/images/villa.jpg",
      is_featured: false
    }
  ];

  // ARCHITECTURE COLLEAGUES LAB DEFAULT DATA
  const defaultColleaguesTeam = [
    {
      name: "Arsène MANZI MUGENI",
      role: "Founder & Lead Architect",
      bio: "Architecture student and founder of ASPIRE Design Lab, passionate about bridging academia and professional practice.",
      display_order: 1
    },
    {
      name: "Dr. Elena Rodriguez",
      role: "Educational Advisor", 
      bio: "Former professor of educational technology with 15+ years experience in digital learning platforms.",
      display_order: 2
    },
    {
      name: "Marcus Chen",
      role: "Technical Advisor",
      bio: "Software engineer specializing in scalable learning management systems and AI-driven recommendations.",
      display_order: 3
    },
    {
      name: "Olivia Johnson",
      role: "Learning Coordinator",
      bio: "Curriculum designer focused on adult learning principles and professional development pathways.",
      display_order: 4
    }
  ];

  const defaultColleaguesInitiatives = [
    {
      title: "Launch mentorship program",
      description: "Connecting architecture students with experienced professionals for guidance and career development",
      status: "planned",
      target_date: "2025-03-01",
      display_order: 1
    },
    {
      title: "Collaborative design workshops",
      description: "Hands-on workshops where students work together on real-world architectural challenges",
      status: "planned", 
      target_date: "2025-04-15",
      display_order: 2
    },
    {
      title: "Rwandan architectural heritage archive",
      description: "Digital archive documenting and preserving Rwandan architectural traditions and innovations",
      status: "in_progress",
      target_date: "2025-06-30",
      display_order: 3
    },
    {
      title: "Community design-build projects",
      description: "Practical projects where students design and build solutions for local communities",
      status: "planned",
      target_date: "2025-08-01",
      display_order: 4
    }
  ];

  const defaultColleaguesValues = [
    {
      title: "Collaborative Learning",
      description: "We believe that the most powerful learning happens through collaboration, not competition.",
      display_order: 1
    },
    {
      title: "Accessibility",
      description: "Making high-quality architectural resources available to students and professionals at all stages.",
      display_order: 2
    },
    {
      title: "Innovation",
      description: "Continuously evolving to incorporate the latest research in architecture and design thinking.",
      display_order: 3
    },
    {
      title: "Community",
      description: "Building supportive, inclusive communities where members feel valued and empowered.",
      display_order: 4
    }
  ];

  const defaultColleaguesMission = [
    {
      mission_statement: "To democratize architectural education by creating a platform where students and professionals can learn from each other, regardless of geographic, economic, or hierarchical barriers.",
      vision_statement: "We envision a world where architectural development is continuous, collaborative, and integrated into daily practice through peer connections and organic learning."
    }
  ];

  // RESEARCH DEFAULT DATA
  const defaultResearchArticles = [
    {
      title: "Modular Housing for Climate Refugees",
      description: "A comprehensive study on adaptable housing solutions for populations displaced by climate events, featuring innovative construction techniques.",
      tag: "Housing",
      year: "2023",
      icon_name: "FaChartBar",
      category: "case_studies",
      is_featured: true
    },
    {
      title: "Biophilic Design in Urban Hospitals",
      description: "Examining how nature-integrated design improves patient outcomes and staff wellbeing in high-density medical facilities.",
      tag: "Healthcare",
      year: "2023",
      icon_name: "FaHospital",
      category: "case_studies",
      is_featured: true
    },
    {
      title: "Adaptive Reuse of Industrial Heritage",
      description: "Case study on transforming a 19th-century factory complex into a mixed-use cultural hub while preserving historical integrity.",
      tag: "Adaptive Reuse",
      year: "2022",
      icon_name: "FaIndustry",
      category: "case_studies",
      is_featured: true
    },
    {
      title: "Net-Zero Energy School Campus",
      description: "Documenting the design process and performance data of Indonesia's first net-zero energy educational facility.",
      tag: "Education",
      year: "2022",
      icon_name: "FaGraduationCap",
      category: "case_studies",
      is_featured: true
    },
    {
      title: "Post-Occupancy Evaluation of High-Density Housing",
      description: "Longitudinal study measuring resident satisfaction and environmental performance in vertical communities.",
      tag: "Housing",
      year: "2021",
      icon_name: "FaBuilding",
      category: "case_studies",
      is_featured: true
    },
    {
      title: "Parametric Design for Tropical Climates",
      description: "Exploring computational design approaches to optimize building forms for passive cooling in equatorial regions.",
      tag: "Computational Design",
      year: "2021",
      icon_name: "FaLaptop",
      category: "case_studies",
      is_featured: true
    }
  ];

  const defaultSustainablePractices = [
    {
      title: "Circular Material Strategies",
      description: "Implementing cradle-to-cradle approaches to minimize waste and maximize resource efficiency throughout building lifecycles.",
      icon_name: "FaRecycle"
    },
    {
      title: "Bioclimatic Design Principles",
      description: "Harnessing local climate conditions to reduce energy demands through passive heating, cooling, and daylighting strategies.",
      icon_name: "FaSun"
    },
    {
      title: "Regenerative Energy Systems",
      description: "Integrating renewable energy generation with building design to create structures that give back to the grid.",
      icon_name: "FaBolt"
    },
    {
      title: "Water Stewardship",
      description: "Implementing rainwater harvesting, greywater recycling, and sustainable drainage systems to minimize water footprint.",
      icon_name: "FaTint"
    },
    {
      title: "Biodiversity Enhancement",
      description: "Designing buildings and landscapes that support local ecosystems and promote urban biodiversity.",
      icon_name: "FaLeaf"
    },
    {
      title: "Low-Carbon Construction",
      description: "Reducing embodied carbon through material selection, prefabrication, and efficient construction techniques.",
      icon_name: "FaHardHat"
    }
  ];

  const defaultClimateStrategies = [
    {
      title: "Coastal Resilience Design",
      description: "Adapting to sea-level rise through amphibious architecture, flood-resistant materials, and strategic retreat planning.",
      icon_name: "FaWater"
    },
    {
      title: "Wildfire-Resistant Communities",
      description: "Implementing defensible space, non-combustible materials, and community evacuation infrastructure in fire-prone regions.",
      icon_name: "FaFire"
    },
    {
      title: "Heat-Resilient Urban Design",
      description: "Combating urban heat island effect through reflective surfaces, green infrastructure, and passive cooling strategies.",
      icon_name: "FaTemperatureHigh"
    },
    {
      title: "Earthquake-Resistant Structures",
      description: "Employing base isolation, damping systems, and flexible materials in seismic zones to protect lives and property.",
      icon_name: "FaBuilding"
    },
    {
      title: "Stormwater Management",
      description: "Designing landscapes and buildings that absorb, store, and slowly release rainwater to prevent flooding.",
      icon_name: "FaCloudRain"
    },
    {
      title: "Community Resilience Hubs",
      description: "Creating multi-functional spaces that provide resources and shelter during climate emergencies.",
      icon_name: "FaHome"
    }
  ];

  const defaultSocialStudies = [
    {
      title: "Indigenous Building Traditions",
      description: "Research on integrating traditional knowledge systems with contemporary design in collaboration with First Nations communities.",
      focus_area: "Cultural Preservation",
      icon_name: "FaUsers"
    },
    {
      title: "Design for Aging Populations",
      description: "Studying how architectural design can support dignity, independence, and social connection for elderly residents.",
      focus_area: "Social Equity",
      icon_name: "FaHeart"
    },
    {
      title: "Post-Disaster Community Recovery",
      description: "Documenting the role of participatory design in rebuilding social cohesion after natural disasters.",
      focus_area: "Community Resilience",
      icon_name: "FaHandsHelping"
    },
    {
      title: "Migration and Housing Justice",
      description: "Examining architectural responses to global migration patterns and the right to adequate housing.",
      focus_area: "Social Justice",
      icon_name: "FaBalanceScale"
    },
    {
      title: "Sacred Space in Secular Contexts",
      description: "Exploring how design can create opportunities for contemplation and meaning in diverse contemporary settings.",
      focus_area: "Cultural Expression",
      icon_name: "FaPray"
    },
    {
      title: "Playful Cities for Child Development",
      description: "Research on how urban design impacts child development and intergenerational interaction.",
      focus_area: "Social Development",
      icon_name: "FaChild"
    }
  ];

  const defaultResearchStats = [
    {
      stat_label: "Published Papers",
      stat_value: "45+",
      icon_name: "FaChartBar",
      category: "overview"
    },
    {
      stat_label: "Research Grants",
      stat_value: "$2.5M",
      icon_name: "FaGraduationCap",
      category: "overview"
    },
    {
      stat_label: "PhD Researchers",
      stat_value: "12",
      icon_name: "FaUsers",
      category: "overview"
    },
    {
      stat_label: "International Collaborations",
      stat_value: "18",
      icon_name: "FaBuilding",
      category: "overview"
    },
    {
      stat_label: "Average Energy Reduction",
      stat_value: "65%",
      icon_name: "FaBolt",
      category: "sustainable"
    },
    {
      stat_label: "Water Consumption Saved",
      stat_value: "40%",
      icon_name: "FaTint",
      category: "sustainable"
    },
    {
      stat_label: "Construction Waste Diverted",
      stat_value: "85%",
      icon_name: "FaRecycle",
      category: "sustainable"
    },
    {
      stat_label: "Native Plants Specified",
      stat_value: "200+",
      icon_name: "FaLeaf",
      category: "sustainable"
    },
    {
      stat_label: "Community Partnerships",
      stat_value: "35+",
      icon_name: "FaUsers",
      category: "social"
    },
    {
      stat_label: "Cultural Heritage Projects",
      stat_value: "22",
      icon_name: "FaBuilding",
      category: "social"
    },
    {
      stat_label: "Community Members Engaged",
      stat_value: "1,200+",
      icon_name: "FaHandsHelping",
      category: "social"
    },
    {
      stat_label: "Countries of Research",
      stat_value: "15",
      icon_name: "FaChartBar",
      category: "social"
    }
  ];

  // NEW: DEFAULT DESIGN PROJECTS DATA
  const defaultDesignProjects = [
    {
      title: "Modern Campus Library",
      summary: "A sustainable library concept integrating natural light and community spaces.",
      description: "This library design focuses on sustainability, using glass facades for natural light and open spaces for collaborative learning. It integrates green courtyards and modern interiors. The project demonstrates innovative approaches to educational architecture while maintaining environmental consciousness.",
      category: "academic",
      sector: "educational",
      main_image: "/images/library.jpg",
      gallery_images: ["/images/library.jpg", "/images/library2.jpg"],
      is_featured: true
    },
    {
      title: "Student Housing Concept",
      summary: "Affordable housing designed with modular units and green courtyards.",
      description: "The student housing project prioritizes affordability while maximizing comfort. Modular units are prefabricated and arranged around shared courtyards to foster community living. This approach reduces construction time and costs while creating vibrant student communities.",
      category: "academic",
      sector: "residential",
      main_image: "/images/housing.jpg",
      gallery_images: ["/images/housing.jpg", "/images/housing2.jpg"],
      is_featured: false
    },
    {
      title: "Luxury Residential Villa",
      summary: "High-end villa design blending modern architecture with natural landscapes.",
      description: "The villa design merges minimalism with luxury, featuring an infinity pool, open floor plans, and natural stone facades that harmonize with the surrounding landscape. Every detail is carefully considered to create a seamless indoor-outdoor living experience.",
      category: "professional",
      sector: "residential",
      main_image: "/images/villa.jpg",
      gallery_images: ["/images/villa.jpg", "/images/villa2.jpg"],
      is_featured: true
    },
    {
      title: "Office Tower Concept",
      summary: "An energy-efficient high-rise designed for flexible work environments.",
      description: "This office tower reimagines workplace design with flexible interiors, solar glass technology, and smart energy systems to minimize environmental impact. The design promotes collaboration while reducing the building's carbon footprint through innovative sustainable technologies.",
      category: "professional",
      sector: "commercial",
      main_image: "/images/office.jpg",
      gallery_images: ["/images/office.jpg", "/images/office2.jpg"],
      is_featured: false
    },
    {
      title: "Urban Green Park",
      summary: "A competition entry transforming abandoned urban land into a green hub.",
      description: "The park project transforms a neglected urban area into a thriving green hub with walking paths, cultural pavilions, and recreational spaces. This competition-winning design addresses urban decay while creating valuable community assets that promote social interaction and environmental awareness.",
      category: "competition",
      sector: "landscape",
      main_image: "/images/park.jpg",
      gallery_images: ["/images/park.jpg", "/images/park2.jpg"],
      is_featured: true
    },
    {
      title: "Cultural Pavilion",
      summary: "A winning concept celebrating local heritage through modern design.",
      description: "The cultural pavilion combines traditional motifs with modern construction. It serves as an exhibition space and a landmark for cultural events. This award-winning design successfully bridges historical context with contemporary architectural expression.",
      category: "competition",
      sector: "cultural",
      main_image: "/images/pavilion.jpg",
      gallery_images: ["/images/pavilion.jpg", "/images/pavilion2.jpg"],
      is_featured: false
    }
  ];

  // NEW: DEFAULT NEWS & EVENTS DATA
  const defaultNewsArticles = [
    {
      title: "New Sustainable Architecture Award",
      excerpt: "Sustainable design recognition for Urban Green Park project",
      content: "ASPIRE Architecture has been awarded the prestigious Sustainable Design Award for our innovative Urban Green Park project. The award recognizes excellence in environmentally conscious design and community-focused architecture.",
      image_url: "/images/park.jpg",
      category: "news",
      author: "Sarah Johnson",
      date: "2023-05-15",
      read_time: "3 min read",
      is_featured: true
    },
    {
      title: "Construction Begins on Modern Campus Library",
      excerpt: "Construction starts on innovative campus library design",
      content: "We're excited to announce that construction has officially commenced on the Modern Campus Library at Northwood University. This state-of-the-art facility will feature innovative glass façade and energy-efficient design.",
      image_url: "/images/library.jpg",
      category: "news",
      author: "James Wilson",
      date: "2023-04-28",
      read_time: "4 min read",
      is_featured: false
    },
    {
      title: "New Research Partnership Announced",
      excerpt: "Collaboration with leading university for sustainable design research",
      content: "ASPIRE Design Lab has entered into a strategic research partnership with the University of Sustainable Architecture to advance innovative approaches to climate-resilient building design.",
      image_url: "/images/office.jpg",
      category: "news",
      author: "Dr. Elena Martinez",
      date: "2023-06-10",
      read_time: "5 min read",
      is_featured: true
    },
    {
      title: "Community Design Workshop Success",
      excerpt: "Local community engagement in urban planning initiative",
      content: "Our recent community design workshop brought together residents, architects, and city planners to co-create solutions for neighborhood revitalization. The collaborative approach yielded innovative ideas for public spaces.",
      image_url: "/images/pome.jpg",
      category: "news",
      author: "Lisa Rodriguez",
      date: "2023-05-22",
      read_time: "2 min read",
      is_featured: false
    }
  ];

  const defaultEvents = [
    {
      title: "Future of Urban Living Conference",
      excerpt: "Architects discuss sustainable urban development",
      description: "Join leading architects and urban planners as we explore the future of sustainable urban living. This conference will feature keynote presentations, panel discussions, and networking opportunities focused on innovative approaches to urban development.",
      image_url: "/images/conference.jpg",
      event_date: "2023-06-02",
      event_time: "9:00 AM - 6:00 PM",
      location: "Main Conference Center, Downtown",
      category: "event",
      author: "Michael Chen",
      read_time: "5 min read",
      is_featured: true
    },
    {
      title: "Design Workshop: Community Spaces",
      excerpt: "Workshop on designing community-centered spaces",
      description: "Interactive workshop focused on creating public areas that foster community interaction. Learn design principles for inclusive, accessible, and engaging community spaces through hands-on activities and case studies.",
      image_url: "/images/workshop.jpg",
      event_date: "2023-06-15",
      event_time: "10:00 AM - 4:00 PM",
      location: "Design Studio, ASPIRE Lab",
      category: "event",
      author: "Lisa Martinez",
      read_time: "2 min read",
      is_featured: false
    },
    {
      title: "Sustainable Architecture Tour",
      excerpt: "Guided tour of eco-friendly projects",
      description: "Experience sustainable architecture firsthand with our guided tour of award-winning eco-friendly projects. Visit buildings that demonstrate innovative approaches to energy efficiency, material selection, and environmental integration.",
      image_url: "/images/villa.jpg",
      event_date: "2023-06-22",
      event_time: "2:00 PM - 5:00 PM",
      location: "Various locations across the city",
      category: "event",
      author: "Robert Kim",
      read_time: "3 min read",
      is_featured: true
    },
    {
      title: "Architectural Photography Exhibition",
      excerpt: "Showcasing the beauty of modern architecture through photography",
      description: "An exhibition featuring stunning architectural photography that captures the essence of modern design. The event includes talks by renowned architectural photographers and opportunities to network with industry professionals.",
      image_url: "/images/pavilion.jpg",
      event_date: "2023-07-05",
      event_time: "6:00 PM - 9:00 PM",
      location: "Art Gallery, Cultural District",
      category: "event",
      author: "Sophia Chen",
      read_time: "4 min read",
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

  // Insert default education workshops
  for (const workshop of defaultWorkshops) {
    const exists = await client.query(
      'SELECT id FROM education_workshops WHERE title = $1 AND instructor = $2',
      [workshop.title, workshop.instructor]
    );
    
    if (exists.rows.length === 0) {
      await client.query(
        `INSERT INTO education_workshops (title, description, tag, duration, date, instructor, instructor_bio, price, capacity, location, image_url, document_url, is_featured) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [workshop.title, workshop.description, workshop.tag, workshop.duration, workshop.date, workshop.instructor, workshop.instructor_bio, workshop.price, workshop.capacity, workshop.location, workshop.image_url, workshop.document_url, workshop.is_featured]
      );
      console.log(`✅ Added education workshop: ${workshop.title}`);
    }
  }

  // Insert default education tutorials
  for (const tutorial of defaultTutorials) {
    const exists = await client.query(
      'SELECT id FROM education_tutorials WHERE title = $1 AND category = $2',
      [tutorial.title, tutorial.category]
    );
    
    if (exists.rows.length === 0) {
      await client.query(
        `INSERT INTO education_tutorials (title, description, category, level, format, duration, document_url, video_url, thumbnail_url, download_count, is_featured) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [tutorial.title, tutorial.description, tutorial.category, tutorial.level, tutorial.format, tutorial.duration, tutorial.document_url, tutorial.video_url, tutorial.thumbnail_url, tutorial.download_count, tutorial.is_featured]
      );
      console.log(`✅ Added education tutorial: ${tutorial.title}`);
    }
  }

  // Insert default education exhibitions
  for (const exhibition of defaultExhibitions) {
    const exists = await client.query(
      'SELECT id FROM education_exhibitions WHERE title = $1 AND curator = $2',
      [exhibition.title, exhibition.curator]
    );
    
    if (exists.rows.length === 0) {
      await client.query(
        `INSERT INTO education_exhibitions (title, description, start_date, end_date, location, curator, curator_bio, image_url, brochure_url, virtual_tour_url, is_featured) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [exhibition.title, exhibition.description, exhibition.start_date, exhibition.end_date, exhibition.location, exhibition.curator, exhibition.curator_bio, exhibition.image_url, exhibition.brochure_url, exhibition.virtual_tour_url, exhibition.is_featured]
      );
      console.log(`✅ Added education exhibition: ${exhibition.title}`);
    }
  }

  // Insert Architecture Colleagues Lab default data
  for (const member of defaultColleaguesTeam) {
    const exists = await client.query(
      'SELECT id FROM architecture_colleagues_team WHERE name = $1 AND role = $2',
      [member.name, member.role]
    );
    
    if (exists.rows.length === 0) {
      await client.query(
        `INSERT INTO architecture_colleagues_team (name, role, bio, display_order) 
         VALUES ($1, $2, $3, $4)`,
        [member.name, member.role, member.bio, member.display_order]
      );
      console.log(`✅ Added architecture colleagues team member: ${member.name}`);
    }
  }

  for (const initiative of defaultColleaguesInitiatives) {
    const exists = await client.query(
      'SELECT id FROM architecture_colleagues_initiatives WHERE title = $1',
      [initiative.title]
    );
    
    if (exists.rows.length === 0) {
      await client.query(
        `INSERT INTO architecture_colleagues_initiatives (title, description, status, target_date, display_order) 
         VALUES ($1, $2, $3, $4, $5)`,
        [initiative.title, initiative.description, initiative.status, initiative.target_date, initiative.display_order]
      );
      console.log(`✅ Added architecture colleagues initiative: ${initiative.title}`);
    }
  }

  for (const value of defaultColleaguesValues) {
    const exists = await client.query(
      'SELECT id FROM architecture_colleagues_values WHERE title = $1',
      [value.title]
    );
    
    if (exists.rows.length === 0) {
      await client.query(
        `INSERT INTO architecture_colleagues_values (title, description, display_order) 
         VALUES ($1, $2, $3)`,
        [value.title, value.description, value.display_order]
      );
      console.log(`✅ Added architecture colleagues value: ${value.title}`);
    }
  }

  for (const mission of defaultColleaguesMission) {
    const exists = await client.query(
      'SELECT id FROM architecture_colleagues_mission'
    );
    
    if (exists.rows.length === 0) {
      await client.query(
        `INSERT INTO architecture_colleagues_mission (mission_statement, vision_statement) 
         VALUES ($1, $2)`,
        [mission.mission_statement, mission.vision_statement]
      );
      console.log(`✅ Added architecture colleagues mission and vision`);
    }
  }

  // Insert default research articles
  for (const article of defaultResearchArticles) {
    const exists = await client.query(
      'SELECT id FROM research_articles WHERE title = $1',
      [article.title]
    );
    
    if (exists.rows.length === 0) {
      await client.query(
        `INSERT INTO research_articles (title, description, tag, year, icon_name, category, is_featured) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [article.title, article.description, article.tag, article.year, article.icon_name, article.category, article.is_featured]
      );
      console.log(`✅ Added research article: ${article.title}`);
    }
  }

  // Insert default sustainable practices
  for (const practice of defaultSustainablePractices) {
    const exists = await client.query(
      'SELECT id FROM sustainable_practices WHERE title = $1',
      [practice.title]
    );
    
    if (exists.rows.length === 0) {
      await client.query(
        `INSERT INTO sustainable_practices (title, description, icon_name) 
         VALUES ($1, $2, $3)`,
        [practice.title, practice.description, practice.icon_name]
      );
      console.log(`✅ Added sustainable practice: ${practice.title}`);
    }
  }

  // Insert default climate strategies
  for (const strategy of defaultClimateStrategies) {
    const exists = await client.query(
      'SELECT id FROM climate_strategies WHERE title = $1',
      [strategy.title]
    );
    
    if (exists.rows.length === 0) {
      await client.query(
        `INSERT INTO climate_strategies (title, description, icon_name) 
         VALUES ($1, $2, $3)`,
        [strategy.title, strategy.description, strategy.icon_name]
      );
      console.log(`✅ Added climate strategy: ${strategy.title}`);
    }
  }

  // Insert default social studies
  for (const study of defaultSocialStudies) {
    const exists = await client.query(
      'SELECT id FROM social_studies WHERE title = $1',
      [study.title]
    );
    
    if (exists.rows.length === 0) {
      await client.query(
        `INSERT INTO social_studies (title, description, focus_area, icon_name) 
         VALUES ($1, $2, $3, $4)`,
        [study.title, study.description, study.focus_area, study.icon_name]
      );
      console.log(`✅ Added social study: ${study.title}`);
    }
  }

  // Insert default research stats
  for (const stat of defaultResearchStats) {
    const exists = await client.query(
      'SELECT id FROM research_stats WHERE stat_label = $1 AND category = $2',
      [stat.stat_label, stat.category]
    );
    
    if (exists.rows.length === 0) {
      await client.query(
        `INSERT INTO research_stats (stat_label, stat_value, icon_name, category) 
         VALUES ($1, $2, $3, $4)`,
        [stat.stat_label, stat.stat_value, stat.icon_name, stat.category]
      );
      console.log(`✅ Added research stat: ${stat.stat_label}`);
    }
  }

  // Insert default design projects
  for (const project of defaultDesignProjects) {
    const exists = await client.query(
      'SELECT id FROM design_projects WHERE title = $1 AND category = $2',
      [project.title, project.category]
    );
    
    if (exists.rows.length === 0) {
      await client.query(
        `INSERT INTO design_projects (title, summary, description, category, sector, main_image, gallery_images, is_featured) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [project.title, project.summary, project.description, project.category, project.sector, project.main_image, JSON.stringify(project.gallery_images), project.is_featured]
      );
      console.log(`✅ Added design project: ${project.title}`);
    }
  }

  // NEW: Insert default news articles
  for (const article of defaultNewsArticles) {
    const exists = await client.query(
      'SELECT id FROM news_articles WHERE title = $1 AND author = $2',
      [article.title, article.author]
    );
    
    if (exists.rows.length === 0) {
      await client.query(
        `INSERT INTO news_articles (title, excerpt, content, image_url, category, author, date, read_time, is_featured) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [article.title, article.excerpt, article.content, article.image_url, article.category, article.author, article.date, article.read_time, article.is_featured]
      );
      console.log(`✅ Added news article: ${article.title}`);
    }
  }

  // NEW: Insert default events
  for (const event of defaultEvents) {
    const exists = await client.query(
      'SELECT id FROM events WHERE title = $1 AND event_date = $2',
      [event.title, event.event_date]
    );
    
    if (exists.rows.length === 0) {
      await client.query(
        `INSERT INTO events (title, excerpt, description, image_url, event_date, event_time, location, category, author, read_time, is_featured) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [event.title, event.excerpt, event.description, event.image_url, event.event_date, event.event_time, event.location, event.category, event.author, event.read_time, event.is_featured]
      );
      console.log(`✅ Added event: ${event.title}`);
    }
  }
  
  console.log('✅ Default data insertion completed');
}

// Enhanced query function with connection recovery
async function query(text, params) {
  let client;
  let retries = 2;
  
  while (retries > 0) {
    try {
      client = await pool.connect();
      const result = await client.query(text, params);
      return result;
    } catch (error) {
      console.error('Database query error (attempt ' + (3 - retries) + '):', error);
      
      // If it's a connection error, try to reconnect
      if (error.message.includes('Connection terminated') || error.message.includes('connection')) {
        retries--;
        if (retries > 0) {
          console.log('🔄 Retrying query in 1 second...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
      }
      
      throw error;
    } finally {
      if (client) client.release();
    }
  }
}

module.exports = {
  initDb,
  getPool: () => pool,
  query,
  testConnection
};