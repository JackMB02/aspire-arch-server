const express = require('express');
const { query } = require('../db');

const router = express.Router();

// Submit membership application
router.post('/membership', async (req, res) => {
  try {
    const {
      full_name,
      email,
      phone,
      membership_type,
      organization,
      position,
      experience_years,
      interests,
      message
    } = req.body;

    // Validation
    if (!full_name || !email || !membership_type) {
      return res.status(400).json({
        success: false,
        error: 'Full name, email, and membership type are required'
      });
    }

    const result = await query(
      `INSERT INTO membership_applications 
       (full_name, email, phone, membership_type, organization, position, experience_years, interests, message) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        full_name,
        email,
        phone,
        membership_type,
        organization,
        position,
        experience_years,
        interests ? JSON.stringify(interests) : null,
        message
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Membership application submitted successfully!',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Membership application error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit membership application'
    });
  }
});

// Submit donation
router.post('/donate', async (req, res) => {
  try {
    const {
      full_name,
      email,
      amount,
      currency,
      payment_method,
      transaction_id,
      bank_name,
      account_number,
      mtn_mobile_number,
      payment_proof
    } = req.body;

    // Validation
    if (!full_name || !email || !amount || !payment_method) {
      return res.status(400).json({
        success: false,
        error: 'Full name, email, amount, and payment method are required'
      });
    }

    const result = await query(
      `INSERT INTO donations 
       (full_name, email, amount, currency, payment_method, transaction_id, bank_name, account_number, mtn_mobile_number, payment_proof) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [
        full_name,
        email,
        amount,
        currency || 'USD',
        payment_method,
        transaction_id,
        bank_name,
        account_number,
        mtn_mobile_number,
        payment_proof
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Donation submitted successfully! We will verify your payment shortly.',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Donation submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit donation'
    });
  }
});

// Submit feedback
router.post('/feedback', async (req, res) => {
  try {
    const {
      full_name,
      email,
      category,
      subject,
      message,
      rating
    } = req.body;

    // Validation
    if (!full_name || !email || !category || !message) {
      return res.status(400).json({
        success: false,
        error: 'Full name, email, category, and message are required'
      });
    }

    const result = await query(
      `INSERT INTO feedback_submissions 
       (full_name, email, category, subject, message, rating) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [full_name, email, category, subject, message, rating]
    );

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully! Thank you for your input.',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback'
    });
  }
});

// Submit idea
router.post('/ideas', async (req, res) => {
  try {
    const {
      full_name,
      email,
      idea_title,
      category,
      description,
      expected_outcomes,
      target_audience
    } = req.body;

    // Validation
    if (!full_name || !email || !idea_title || !category || !description) {
      return res.status(400).json({
        success: false,
        error: 'Full name, email, idea title, category, and description are required'
      });
    }

    const result = await query(
      `INSERT INTO idea_submissions 
       (full_name, email, idea_title, category, description, expected_outcomes, target_audience) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [full_name, email, idea_title, category, description, expected_outcomes, target_audience]
    );

    res.status(201).json({
      success: true,
      message: 'Idea submitted successfully! We will review it and get back to you.',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Idea submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit idea'
    });
  }
});

// Submit partnership inquiry
router.post('/partnership', async (req, res) => {
  try {
    const {
      full_name,
      email,
      organization,
      position,
      partnership_type,
      proposal,
      budget_range,
      timeline
    } = req.body;

    // Validation
    if (!full_name || !email || !organization || !partnership_type) {
      return res.status(400).json({
        success: false,
        error: 'Full name, email, organization, and partnership type are required'
      });
    }

    const result = await query(
      `INSERT INTO partnership_inquiries 
       (full_name, email, organization, position, partnership_type, proposal, budget_range, timeline) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [full_name, email, organization, position, partnership_type, proposal, budget_range, timeline]
    );

    res.status(201).json({
      success: true,
      message: 'Partnership inquiry submitted successfully! We will contact you soon.',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Partnership inquiry error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit partnership inquiry'
    });
  }
});

// Get community stories (public endpoint)
router.get('/stories', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM community_stories 
       WHERE is_published = true 
       ORDER BY is_featured DESC, created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch community stories'
    });
  }
});

// ADMIN ROUTES - Require authentication

// Get all membership applications (admin)
router.get('/admin/membership', async (req, res) => {
  try {
    if (!await authenticateAdmin(req)) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await query(
      `SELECT * FROM membership_applications 
       ORDER BY created_at DESC`
    );

    res.json(result.rows);

  } catch (error) {
    console.error('Get membership applications error:', error);
    res.status(500).json({ error: 'Failed to fetch membership applications' });
  }
});

// Get all donations (admin)
router.get('/admin/donations', async (req, res) => {
  try {
    if (!await authenticateAdmin(req)) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await query(
      `SELECT * FROM donations 
       ORDER BY created_at DESC`
    );

    res.json(result.rows);

  } catch (error) {
    console.error('Get donations error:', error);
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
});

// Get all feedback (admin)
router.get('/admin/feedback', async (req, res) => {
  try {
    if (!await authenticateAdmin(req)) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await query(
      `SELECT * FROM feedback_submissions 
       ORDER BY created_at DESC`
    );

    res.json(result.rows);

  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// Get all ideas (admin)
router.get('/admin/ideas', async (req, res) => {
  try {
    if (!await authenticateAdmin(req)) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await query(
      `SELECT * FROM idea_submissions 
       ORDER BY 
         CASE priority 
           WHEN 'high' THEN 1
           WHEN 'medium' THEN 2
           WHEN 'low' THEN 3
           ELSE 4
         END,
         created_at DESC`
    );

    res.json(result.rows);

  } catch (error) {
    console.error('Get ideas error:', error);
    res.status(500).json({ error: 'Failed to fetch ideas' });
  }
});

// Get all partnership inquiries (admin)
router.get('/admin/partnerships', async (req, res) => {
  try {
    if (!await authenticateAdmin(req)) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await query(
      `SELECT * FROM partnership_inquiries 
       ORDER BY created_at DESC`
    );

    res.json(result.rows);

  } catch (error) {
    console.error('Get partnership inquiries error:', error);
    res.status(500).json({ error: 'Failed to fetch partnership inquiries' });
  }
});

// Get all community stories (admin)
router.get('/admin/stories', async (req, res) => {
  try {
    if (!await authenticateAdmin(req)) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await query(
      `SELECT * FROM community_stories 
       ORDER BY created_at DESC`
    );

    res.json(result.rows);

  } catch (error) {
    console.error('Get stories admin error:', error);
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});

// Update submission status (admin)
router.put('/admin/:type/:id/status', async (req, res) => {
  try {
    if (!await authenticateAdmin(req)) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { type, id } = req.params;
    const { status, notes } = req.body;

    const validTypes = ['membership', 'donations', 'feedback', 'ideas', 'partnerships', 'stories'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid type' });
    }

    let tableName;
    switch (type) {
      case 'membership': tableName = 'membership_applications'; break;
      case 'donations': tableName = 'donations'; break;
      case 'feedback': tableName = 'feedback_submissions'; break;
      case 'ideas': tableName = 'idea_submissions'; break;
      case 'partnerships': tableName = 'partnership_inquiries'; break;
      case 'stories': tableName = 'community_stories'; break;
    }

    const updateData = [status];
    let queryText = `UPDATE ${tableName} SET status = $1, updated_at = CURRENT_TIMESTAMP`;
    let paramCount = 2;

    if (notes !== undefined) {
      queryText += `, notes = $${paramCount}`;
      updateData.push(notes);
      paramCount++;
    }

    queryText += ` WHERE id = $${paramCount} RETURNING *`;
    updateData.push(id);

    const result = await query(queryText, updateData);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json({ success: true, updated: result.rows[0] });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Delete submission (admin)
router.delete('/admin/:type/:id', async (req, res) => {
  try {
    if (!await authenticateAdmin(req)) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { type, id } = req.params;

    const validTypes = ['membership', 'donations', 'feedback', 'ideas', 'partnerships', 'stories'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid type' });
    }

    let tableName;
    switch (type) {
      case 'membership': tableName = 'membership_applications'; break;
      case 'donations': tableName = 'donations'; break;
      case 'feedback': tableName = 'feedback_submissions'; break;
      case 'ideas': tableName = 'idea_submissions'; break;
      case 'partnerships': tableName = 'partnership_inquiries'; break;
      case 'stories': tableName = 'community_stories'; break;
    }

    const result = await query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING *`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json({ success: true, deleted: result.rows[0] });

  } catch (error) {
    console.error('Delete submission error:', error);
    res.status(500).json({ error: 'Failed to delete submission' });
  }
});

// Create new community story (admin)
router.post('/admin/stories', async (req, res) => {
  try {
    if (!await authenticateAdmin(req)) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      author_name,
      author_title,
      author_organization,
      story_title,
      story_content,
      category,
      featured_image,
      is_featured,
      is_published
    } = req.body;

    if (!author_name || !story_title || !story_content) {
      return res.status(400).json({ error: 'Author name, story title, and content are required' });
    }

    const result = await query(
      `INSERT INTO community_stories 
       (author_name, author_title, author_organization, story_title, story_content, category, featured_image, is_featured, is_published) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        author_name,
        author_title,
        author_organization,
        story_title,
        story_content,
        category,
        featured_image,
        is_featured || false,
        is_published !== undefined ? is_published : true
      ]
    );

    res.json({ success: true, created: result.rows[0] });

  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ error: 'Failed to create story' });
  }
});

// Update community story (admin)
router.put('/admin/stories/:id', async (req, res) => {
  try {
    if (!await authenticateAdmin(req)) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const {
      author_name,
      author_title,
      author_organization,
      story_title,
      story_content,
      category,
      featured_image,
      is_featured,
      is_published
    } = req.body;

    const result = await query(
      `UPDATE community_stories 
       SET author_name = $1, author_title = $2, author_organization = $3, story_title = $4, 
           story_content = $5, category = $6, featured_image = $7, is_featured = $8, 
           is_published = $9, updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 RETURNING *`,
      [
        author_name,
        author_title,
        author_organization,
        story_title,
        story_content,
        category,
        featured_image,
        is_featured,
        is_published,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Story not found' });
    }

    res.json({ success: true, updated: result.rows[0] });

  } catch (error) {
    console.error('Update story error:', error);
    res.status(500).json({ error: 'Failed to update story' });
  }
});

// Helper function for admin authentication
async function authenticateAdmin(req) {
  const auth = req.headers.authorization;
  if (!auth) return false;
  
  const token = auth.split(' ')[1];
  if (!token) return false;
  
  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'aspire_design_lab_secret_key_2024';
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verify admin exists
    const result = await query('SELECT id FROM admins WHERE id = $1', [decoded.sub]);
    return result.rows.length > 0;
  } catch (error) {
    return false;
  }
}

module.exports = router;