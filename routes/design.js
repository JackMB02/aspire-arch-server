const express = require('express');
const router = express.Router();
const { query } = require('../db');

// ===== PUBLIC ROUTES =====

// @desc    Get all design projects
// @route   GET /api/design/projects
// @access  Public
router.get('/projects', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM design_projects 
       WHERE is_published = true 
       ORDER BY display_order, created_at DESC`
    );

    res.status(200).json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get design projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching design projects'
    });
  }
});

// @desc    Get design projects by category
// @route   GET /api/design/projects/:category
// @access  Public
router.get('/projects/:category', async (req, res) => {
  try {
    const { category } = req.params;

    const result = await query(
      `SELECT * FROM design_projects 
       WHERE category = $1 AND is_published = true 
       ORDER BY display_order, created_at DESC`,
      [category]
    );

    res.status(200).json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get design projects by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching design projects by category'
    });
  }
});

// @desc    Get single design project by ID
// @route   GET /api/design/project/:id
// @access  Public
router.get('/project/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM design_projects WHERE id = $1 AND is_published = true',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Design project not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Get design project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching design project'
    });
  }
});

// @desc    Get featured design projects (mixed categories)
// @route   GET /api/design/featured
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM design_projects 
       WHERE is_featured = true AND is_published = true 
       ORDER BY display_order, created_at DESC 
       LIMIT 6`
    );

    res.status(200).json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get featured design projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured design projects'
    });
  }
});

// ===== ADMIN ROUTES =====

// @desc    Get all design projects for admin (including unpublished)
// @route   GET /api/design/admin/projects
// @access  Private
router.get('/admin/projects', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM design_projects ORDER BY category, display_order, created_at DESC'
    );

    res.status(200).json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get admin design projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching design projects for admin'
    });
  }
});

// @desc    Create design project
// @route   POST /api/design/projects
// @access  Private
router.post('/projects', async (req, res) => {
  try {
    const {
      title,
      summary,
      description,
      category,
      main_image,
      gallery_images,
      display_order,
      is_featured,
      is_published
    } = req.body;

    const result = await query(
      `INSERT INTO design_projects 
       (title, summary, description, category, main_image, gallery_images, display_order, is_featured, is_published) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        title,
        summary,
        description,
        category,
        main_image,
        JSON.stringify(gallery_images || []),
        display_order || 0,
        is_featured || false,
        is_published || true
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Create design project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating design project'
    });
  }
});

// @desc    Update design project
// @route   PUT /api/design/projects/:id
// @access  Private
router.put('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      summary,
      description,
      category,
      main_image,
      gallery_images,
      display_order,
      is_featured,
      is_published
    } = req.body;

    const result = await query(
      `UPDATE design_projects 
       SET title = $1, summary = $2, description = $3, category = $4, 
           main_image = $5, gallery_images = $6, display_order = $7, 
           is_featured = $8, is_published = $9, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $10 
       RETURNING *`,
      [
        title,
        summary,
        description,
        category,
        main_image,
        JSON.stringify(gallery_images || []),
        display_order,
        is_featured,
        is_published,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Design project not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update design project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating design project'
    });
  }
});

// @desc    Delete design project
// @route   DELETE /api/design/projects/:id
// @access  Private
router.delete('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM design_projects WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Design project not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Design project deleted successfully'
    });

  } catch (error) {
    console.error('Delete design project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting design project'
    });
  }
});

// @desc    Toggle design project published status
// @route   PATCH /api/design/projects/:id/toggle
// @access  Private
router.patch('/projects/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE design_projects 
       SET is_published = NOT is_published, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Design project not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Toggle design project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling design project'
    });
  }
});

// @desc    Get design projects statistics for admin
// @route   GET /api/design/admin/stats
// @access  Private
router.get('/admin/stats', async (req, res) => {
  try {
    const [
      totalResult,
      academicResult,
      professionalResult,
      competitionResult,
      featuredResult
    ] = await Promise.all([
      query('SELECT COUNT(*) FROM design_projects'),
      query('SELECT COUNT(*) FROM design_projects WHERE category = $1', ['academic']),
      query('SELECT COUNT(*) FROM design_projects WHERE category = $1', ['professional']),
      query('SELECT COUNT(*) FROM design_projects WHERE category = $1', ['competition']),
      query('SELECT COUNT(*) FROM design_projects WHERE is_featured = true')
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: parseInt(totalResult.rows[0].count),
        academic: parseInt(academicResult.rows[0].count),
        professional: parseInt(professionalResult.rows[0].count),
        competition: parseInt(competitionResult.rows[0].count),
        featured: parseInt(featuredResult.rows[0].count)
      }
    });

  } catch (error) {
    console.error('Get design stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching design statistics'
    });
  }
});

module.exports = router;