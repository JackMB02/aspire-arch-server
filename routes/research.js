const express = require('express');
const router = express.Router();
const { query } = require('../db');

// Icon mapping for React components
const iconMap = {
  FaChartBar: 'FaChartBar',
  FaHospital: 'FaHospital',
  FaIndustry: 'FaIndustry',
  FaGraduationCap: 'FaGraduationCap',
  FaBuilding: 'FaBuilding',
  FaLaptop: 'FaLaptop',
  FaRecycle: 'FaRecycle',
  FaSun: 'FaSun',
  FaBolt: 'FaBolt',
  FaTint: 'FaTint',
  FaLeaf: 'FaLeaf',
  FaHardHat: 'FaHardHat',
  FaWater: 'FaWater',
  FaFire: 'FaFire',
  FaTemperatureHigh: 'FaTemperatureHigh',
  FaCloudRain: 'FaCloudRain',
  FaHome: 'FaHome',
  FaUsers: 'FaUsers',
  FaHeart: 'FaHeart',
  FaHandsHelping: 'FaHandsHelping',
  FaBalanceScale: 'FaBalanceScale',
  FaPray: 'FaPray',
  FaChild: 'FaChild'
};

// ===== PUBLIC ROUTES =====

// @desc    Get all research data for overview
// @route   GET /api/research/overview
// @access  Public
router.get('/overview', async (req, res) => {
  try {
    // Get overview stats
    const statsResult = await query(
      'SELECT * FROM research_stats WHERE category = $1 AND is_active = true ORDER BY display_order',
      ['overview']
    );

    res.status(200).json({
      success: true,
      data: {
        stats: statsResult.rows
      }
    });

  } catch (error) {
    console.error('Get research overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching research overview data'
    });
  }
});

// @desc    Get articles and case studies
// @route   GET /api/research/articles
// @access  Public
router.get('/articles', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM research_articles WHERE is_published = true ORDER BY year DESC, display_order'
    );

    // Map icon names to actual icon components
    const articles = result.rows.map(article => ({
      ...article,
      icon: iconMap[article.icon_name] || 'FaChartBar'
    }));

    res.status(200).json({
      success: true,
      data: articles
    });

  } catch (error) {
    console.error('Get research articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching research articles'
    });
  }
});

// @desc    Get sustainable practices
// @route   GET /api/research/sustainable-practices
// @access  Public
router.get('/sustainable-practices', async (req, res) => {
  try {
    const practicesResult = await query(
      'SELECT * FROM sustainable_practices WHERE is_active = true ORDER BY display_order'
    );

    const statsResult = await query(
      'SELECT * FROM research_stats WHERE category = $1 AND is_active = true ORDER BY display_order',
      ['sustainable']
    );

    const practices = practicesResult.rows.map(practice => ({
      ...practice,
      icon: iconMap[practice.icon_name] || 'FaRecycle'
    }));

    res.status(200).json({
      success: true,
      data: {
        practices: practices,
        stats: statsResult.rows
      }
    });

  } catch (error) {
    console.error('Get sustainable practices error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sustainable practices'
    });
  }
});

// @desc    Get climate strategies
// @route   GET /api/research/climate-strategies
// @access  Public
router.get('/climate-strategies', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM climate_strategies WHERE is_active = true ORDER BY display_order'
    );

    const strategies = result.rows.map(strategy => ({
      ...strategy,
      icon: iconMap[strategy.icon_name] || 'FaWater'
    }));

    res.status(200).json({
      success: true,
      data: strategies
    });

  } catch (error) {
    console.error('Get climate strategies error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching climate strategies'
    });
  }
});

// @desc    Get social studies
// @route   GET /api/research/social-studies
// @access  Public
router.get('/social-studies', async (req, res) => {
  try {
    const studiesResult = await query(
      'SELECT * FROM social_studies WHERE is_active = true ORDER BY display_order'
    );

    const statsResult = await query(
      'SELECT * FROM research_stats WHERE category = $1 AND is_active = true ORDER BY display_order',
      ['social']
    );

    const studies = studiesResult.rows.map(study => ({
      ...study,
      icon: iconMap[study.icon_name] || 'FaUsers'
    }));

    res.status(200).json({
      success: true,
      data: {
        studies: studies,
        stats: statsResult.rows
      }
    });

  } catch (error) {
    console.error('Get social studies error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching social studies'
    });
  }
});

// @desc    Get all research data for admin
// @route   GET /api/research/admin
// @access  Private
router.get('/admin', async (req, res) => {
  try {
    const [
      articlesResult,
      practicesResult,
      strategiesResult,
      studiesResult,
      statsResult
    ] = await Promise.all([
      query('SELECT COUNT(*) FROM research_articles'),
      query('SELECT COUNT(*) FROM sustainable_practices'),
      query('SELECT COUNT(*) FROM climate_strategies'),
      query('SELECT COUNT(*) FROM social_studies'),
      query('SELECT COUNT(*) FROM research_stats')
    ]);

    res.status(200).json({
      success: true,
      data: {
        articles_count: parseInt(articlesResult.rows[0].count),
        practices_count: parseInt(practicesResult.rows[0].count),
        strategies_count: parseInt(strategiesResult.rows[0].count),
        studies_count: parseInt(studiesResult.rows[0].count),
        stats_count: parseInt(statsResult.rows[0].count)
      }
    });

  } catch (error) {
    console.error('Get research admin data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching research admin data'
    });
  }
});

// ===== NEW ENDPOINTS FOR DASHBOARD INTEGRATION =====

// @desc    Get research stats for admin dashboard
// @route   GET /api/research/admin/stats
// @access  Private
router.get('/admin/stats', async (req, res) => {
  try {
    const [
      totalResult,
      sustainableResult,
      climateResult,
      socialResult,
      technologicalResult,
      featuredResult
    ] = await Promise.all([
      query('SELECT COUNT(*) FROM research_articles'),
      query('SELECT COUNT(*) FROM research_articles WHERE category = $1', ['sustainable']),
      query('SELECT COUNT(*) FROM research_articles WHERE category = $1', ['climate']),
      query('SELECT COUNT(*) FROM research_articles WHERE category = $1', ['social']),
      query('SELECT COUNT(*) FROM research_articles WHERE category = $1', ['technological']),
      query('SELECT COUNT(*) FROM research_articles WHERE is_featured = true')
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: parseInt(totalResult.rows[0].count),
        sustainable: parseInt(sustainableResult.rows[0].count),
        climate: parseInt(climateResult.rows[0].count),
        social: parseInt(socialResult.rows[0].count),
        technological: parseInt(technologicalResult.rows[0].count),
        featured: parseInt(featuredResult.rows[0].count)
      }
    });

  } catch (error) {
    console.error('Get research admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching research admin stats'
    });
  }
});

// @desc    Get all research articles for admin (dashboard format)
// @route   GET /api/research/admin/articles
// @access  Private
router.get('/admin/articles', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM research_articles ORDER BY created_at DESC'
    );

    const articles = result.rows.map(article => ({
      id: article.id,
      title: article.title,
      abstract: article.description, // Using description as abstract
      content: article.content,
      category: article.category,
      authors: 'ASPIRE Research Team', // Default author since your table doesn't have authors column
      publication_date: article.created_at,
      main_image: article.image_url,
      gallery_images: article.document_url ? [article.document_url] : [],
      display_order: article.display_order,
      is_featured: article.is_featured,
      is_published: article.is_published,
      created_at: article.created_at,
      updated_at: article.updated_at
    }));

    res.status(200).json({
      success: true,
      data: articles
    });

  } catch (error) {
    console.error('Get research admin articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching research admin articles'
    });
  }
});

// @desc    Get sustainable research articles
// @route   GET /api/research/articles/sustainable
// @access  Public
router.get('/articles/sustainable', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM research_articles WHERE category = $1 AND is_published = true ORDER BY created_at DESC',
      ['sustainable']
    );

    const articles = result.rows.map(article => ({
      id: article.id,
      title: article.title,
      abstract: article.description,
      content: article.content,
      category: article.category,
      authors: 'ASPIRE Research Team',
      publication_date: article.created_at,
      main_image: article.image_url,
      gallery_images: article.document_url ? [article.document_url] : [],
      display_order: article.display_order,
      is_featured: article.is_featured,
      is_published: article.is_published,
      created_at: article.created_at,
      updated_at: article.updated_at
    }));

    res.status(200).json({
      success: true,
      data: articles
    });

  } catch (error) {
    console.error('Get sustainable research articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sustainable research articles'
    });
  }
});

// @desc    Get climate research articles
// @route   GET /api/research/articles/climate
// @access  Public
router.get('/articles/climate', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM research_articles WHERE category = $1 AND is_published = true ORDER BY created_at DESC',
      ['climate']
    );

    const articles = result.rows.map(article => ({
      id: article.id,
      title: article.title,
      abstract: article.description,
      content: article.content,
      category: article.category,
      authors: 'ASPIRE Research Team',
      publication_date: article.created_at,
      main_image: article.image_url,
      gallery_images: article.document_url ? [article.document_url] : [],
      display_order: article.display_order,
      is_featured: article.is_featured,
      is_published: article.is_published,
      created_at: article.created_at,
      updated_at: article.updated_at
    }));

    res.status(200).json({
      success: true,
      data: articles
    });

  } catch (error) {
    console.error('Get climate research articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching climate research articles'
    });
  }
});

// @desc    Get social research articles
// @route   GET /api/research/articles/social
// @access  Public
router.get('/articles/social', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM research_articles WHERE category = $1 AND is_published = true ORDER BY created_at DESC',
      ['social']
    );

    const articles = result.rows.map(article => ({
      id: article.id,
      title: article.title,
      abstract: article.description,
      content: article.content,
      category: article.category,
      authors: 'ASPIRE Research Team',
      publication_date: article.created_at,
      main_image: article.image_url,
      gallery_images: article.document_url ? [article.document_url] : [],
      display_order: article.display_order,
      is_featured: article.is_featured,
      is_published: article.is_published,
      created_at: article.created_at,
      updated_at: article.updated_at
    }));

    res.status(200).json({
      success: true,
      data: articles
    });

  } catch (error) {
    console.error('Get social research articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching social research articles'
    });
  }
});

// @desc    Get technological research articles
// @route   GET /api/research/articles/technological
// @access  Public
router.get('/articles/technological', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM research_articles WHERE category = $1 AND is_published = true ORDER BY created_at DESC',
      ['technological']
    );

    const articles = result.rows.map(article => ({
      id: article.id,
      title: article.title,
      abstract: article.description,
      content: article.content,
      category: article.category,
      authors: 'ASPIRE Research Team',
      publication_date: article.created_at,
      main_image: article.image_url,
      gallery_images: article.document_url ? [article.document_url] : [],
      display_order: article.display_order,
      is_featured: article.is_featured,
      is_published: article.is_published,
      created_at: article.created_at,
      updated_at: article.updated_at
    }));

    res.status(200).json({
      success: true,
      data: articles
    });

  } catch (error) {
    console.error('Get technological research articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching technological research articles'
    });
  }
});

// ===== ADMIN ROUTES =====

// @desc    Create research article (updated for dashboard)
// @route   POST /api/research/articles
// @access  Private
router.post('/articles', async (req, res) => {
  try {
    const {
      title,
      abstract, // Frontend sends 'abstract' which maps to 'description'
      content,
      category,
      authors,
      publication_date,
      main_image, // Frontend sends 'main_image' which maps to 'image_url'
      gallery_images,
      display_order,
      is_featured,
      is_published
    } = req.body;

    console.log('📥 Received research article data:', {
      title, abstract, category, authors, publication_date
    });

    // Map frontend fields to database columns
    const result = await query(
      `INSERT INTO research_articles 
       (title, description, content, category, image_url, display_order, is_featured, is_published, tag, year, icon_name) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING *`,
      [
        title,
        abstract || '', // Map abstract to description
        content || '',
        category || 'sustainable',
        main_image || null,
        display_order || 0,
        is_featured || false,
        is_published || true,
        'Research', // Default tag
        new Date().getFullYear().toString(), // Default year
        'FaChartBar' // Default icon
      ]
    );

    // Format response to match frontend expectations
    const newArticle = {
      id: result.rows[0].id,
      title: result.rows[0].title,
      abstract: result.rows[0].description,
      content: result.rows[0].content,
      category: result.rows[0].category,
      authors: authors || 'ASPIRE Research Team',
      publication_date: result.rows[0].created_at,
      main_image: result.rows[0].image_url,
      gallery_images: gallery_images || [],
      display_order: result.rows[0].display_order,
      is_featured: result.rows[0].is_featured,
      is_published: result.rows[0].is_published,
      created_at: result.rows[0].created_at,
      updated_at: result.rows[0].updated_at
    };

    console.log('✅ Research article created successfully:', newArticle.id);

    res.status(201).json({
      success: true,
      data: newArticle
    });

  } catch (error) {
    console.error('❌ Create research article error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating research article: ' + error.message
    });
  }
});

// @desc    Update research article
// @route   PUT /api/research/articles/:id
// @access  Private
router.put('/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      tag,
      year,
      icon_name,
      category,
      content,
      image_url,
      document_url,
      display_order,
      is_featured,
      is_published
    } = req.body;

    const result = await query(
      `UPDATE research_articles 
       SET title = $1, description = $2, tag = $3, year = $4, icon_name = $5, category = $6, 
           content = $7, image_url = $8, document_url = $9, display_order = $10, 
           is_featured = $11, is_published = $12, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $13 
       RETURNING *`,
      [title, description, tag, year, icon_name, category, content, image_url, document_url, display_order, is_featured, is_published, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Research article not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update research article error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating research article'
    });
  }
});

// @desc    Delete research article
// @route   DELETE /api/research/articles/:id
// @access  Private
router.delete('/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM research_articles WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Research article not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Research article deleted successfully'
    });

  } catch (error) {
    console.error('Delete research article error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting research article'
    });
  }
});

// @desc    Toggle research article published status
// @route   PATCH /api/research/articles/:id/toggle
// @access  Private
router.patch('/articles/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE research_articles 
       SET is_published = NOT is_published, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Research article not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Toggle research article error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling research article'
    });
  }
});

// @desc    Toggle research article featured status
// @route   PATCH /api/research/articles/:id/toggle-featured
// @access  Private
router.patch('/articles/:id/toggle-featured', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE research_articles 
       SET is_featured = NOT is_featured, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Research article not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Toggle research article featured error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling research article featured status'
    });
  }
});

// @desc    Create sustainable practice
// @route   POST /api/research/sustainable-practices
// @access  Private
router.post('/sustainable-practices', async (req, res) => {
  try {
    const {
      title,
      description,
      icon_name,
      display_order,
      is_active
    } = req.body;

    const result = await query(
      `INSERT INTO sustainable_practices 
       (title, description, icon_name, display_order, is_active) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [title, description, icon_name, display_order || 0, is_active || true]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Create sustainable practice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating sustainable practice'
    });
  }
});

// @desc    Update sustainable practice
// @route   PUT /api/research/sustainable-practices/:id
// @access  Private
router.put('/sustainable-practices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      icon_name,
      display_order,
      is_active
    } = req.body;

    const result = await query(
      `UPDATE sustainable_practices 
       SET title = $1, description = $2, icon_name = $3, display_order = $4, 
           is_active = $5, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $6 
       RETURNING *`,
      [title, description, icon_name, display_order, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sustainable practice not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update sustainable practice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating sustainable practice'
    });
  }
});

// @desc    Delete sustainable practice
// @route   DELETE /api/research/sustainable-practices/:id
// @access  Private
router.delete('/sustainable-practices/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM sustainable_practices WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sustainable practice not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Sustainable practice deleted successfully'
    });

  } catch (error) {
    console.error('Delete sustainable practice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting sustainable practice'
    });
  }
});

// @desc    Create climate strategy
// @route   POST /api/research/climate-strategies
// @access  Private
router.post('/climate-strategies', async (req, res) => {
  try {
    const {
      title,
      description,
      icon_name,
      display_order,
      is_active
    } = req.body;

    const result = await query(
      `INSERT INTO climate_strategies 
       (title, description, icon_name, display_order, is_active) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [title, description, icon_name, display_order || 0, is_active || true]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Create climate strategy error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating climate strategy'
    });
  }
});

// @desc    Update climate strategy
// @route   PUT /api/research/climate-strategies/:id
// @access  Private
router.put('/climate-strategies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      icon_name,
      display_order,
      is_active
    } = req.body;

    const result = await query(
      `UPDATE climate_strategies 
       SET title = $1, description = $2, icon_name = $3, display_order = $4, 
           is_active = $5, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $6 
       RETURNING *`,
      [title, description, icon_name, display_order, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Climate strategy not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update climate strategy error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating climate strategy'
    });
  }
});

// @desc    Delete climate strategy
// @route   DELETE /api/research/climate-strategies/:id
// @access  Private
router.delete('/climate-strategies/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM climate_strategies WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Climate strategy not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Climate strategy deleted successfully'
    });

  } catch (error) {
    console.error('Delete climate strategy error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting climate strategy'
    });
  }
});

// @desc    Create social study
// @route   POST /api/research/social-studies
// @access  Private
router.post('/social-studies', async (req, res) => {
  try {
    const {
      title,
      description,
      focus_area,
      icon_name,
      display_order,
      is_active
    } = req.body;

    const result = await query(
      `INSERT INTO social_studies 
       (title, description, focus_area, icon_name, display_order, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [title, description, focus_area, icon_name, display_order || 0, is_active || true]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Create social study error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating social study'
    });
  }
});

// @desc    Update social study
// @route   PUT /api/research/social-studies/:id
// @access  Private
router.put('/social-studies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      focus_area,
      icon_name,
      display_order,
      is_active
    } = req.body;

    const result = await query(
      `UPDATE social_studies 
       SET title = $1, description = $2, focus_area = $3, icon_name = $4, 
           display_order = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $7 
       RETURNING *`,
      [title, description, focus_area, icon_name, display_order, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Social study not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update social study error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating social study'
    });
  }
});

// @desc    Delete social study
// @route   DELETE /api/research/social-studies/:id
// @access  Private
router.delete('/social-studies/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM social_studies WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Social study not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Social study deleted successfully'
    });

  } catch (error) {
    console.error('Delete social study error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting social study'
    });
  }
});

// @desc    Create research stat
// @route   POST /api/research/stats
// @access  Private
router.post('/stats', async (req, res) => {
  try {
    const {
      stat_label,
      stat_value,
      icon_name,
      category,
      display_order,
      is_active
    } = req.body;

    const result = await query(
      `INSERT INTO research_stats 
       (stat_label, stat_value, icon_name, category, display_order, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [stat_label, stat_value, icon_name, category, display_order || 0, is_active || true]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Create research stat error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating research stat'
    });
  }
});

// @desc    Update research stat
// @route   PUT /api/research/stats/:id
// @access  Private
router.put('/stats/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      stat_label,
      stat_value,
      icon_name,
      category,
      display_order,
      is_active
    } = req.body;

    const result = await query(
      `UPDATE research_stats 
       SET stat_label = $1, stat_value = $2, icon_name = $3, category = $4, 
           display_order = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $7 
       RETURNING *`,
      [stat_label, stat_value, icon_name, category, display_order, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Research stat not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update research stat error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating research stat'
    });
  }
});

// @desc    Delete research stat
// @route   DELETE /api/research/stats/:id
// @access  Private
router.delete('/stats/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM research_stats WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Research stat not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Research stat deleted successfully'
    });

  } catch (error) {
    console.error('Delete research stat error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting research stat'
    });
  }
});

// @desc    Get all research data for admin (including unpublished)
// @route   GET /api/research/admin/all
// @access  Private
router.get('/admin/all', async (req, res) => {
  try {
    const [
      articlesResult,
      practicesResult,
      strategiesResult,
      studiesResult,
      statsResult
    ] = await Promise.all([
      query('SELECT * FROM research_articles ORDER BY display_order, created_at DESC'),
      query('SELECT * FROM sustainable_practices ORDER BY display_order, created_at DESC'),
      query('SELECT * FROM climate_strategies ORDER BY display_order, created_at DESC'),
      query('SELECT * FROM social_studies ORDER BY display_order, created_at DESC'),
      query('SELECT * FROM research_stats ORDER BY category, display_order')
    ]);

    res.status(200).json({
      success: true,
      data: {
        articles: articlesResult.rows,
        practices: practicesResult.rows,
        strategies: strategiesResult.rows,
        studies: studiesResult.rows,
        stats: statsResult.rows
      }
    });

  } catch (error) {
    console.error('Get all research data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching research data'
    });
  }
});

module.exports = router;