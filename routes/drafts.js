const express = require('express');
const { query } = require('../db');

const router = express.Router();

/**
 * DRAFT MANAGEMENT ENDPOINTS
 * These endpoints allow users to save, retrieve, update, and delete form drafts
 * Drafts are identified by email, form type, and can have multiple drafts per form
 */

// Save a new draft or update existing draft
router.post('/save', async (req, res) => {
  try {
    const { email, form_type, form_data, draft_name, draft_id } = req.body;

    // Validation
    if (!email || !form_type || !form_data) {
      return res.status(400).json({
        success: false,
        error: 'Email, form type, and form data are required'
      });
    }

    let result;

    if (draft_id) {
      // Update existing draft
      result = await query(
        `UPDATE form_drafts 
         SET form_data = $1, draft_name = $2, updated_at = NOW()
         WHERE id = $3 AND email = $4
         RETURNING *`,
        [JSON.stringify(form_data), draft_name || null, draft_id, email]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Draft not found'
        });
      }
    } else {
      // Create new draft
      result = await query(
        `INSERT INTO form_drafts (email, form_type, form_data, draft_name, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [email, form_type, JSON.stringify(form_data), draft_name || null, 'draft']
      );
    }

    const draft = result.rows[0];

    res.status(201).json({
      success: true,
      message: draft_id ? 'Draft updated successfully!' : 'Draft saved successfully!',
      draft: {
        id: draft.id,
        email: draft.email,
        form_type: draft.form_type,
        draft_name: draft.draft_name,
        created_at: draft.created_at,
        updated_at: draft.updated_at
      }
    });

  } catch (error) {
    console.error('Draft save error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save draft'
    });
  }
});

// Get all drafts for a user by form type
router.get('/user/:email/:form_type', async (req, res) => {
  try {
    const { email, form_type } = req.params;

    if (!email || !form_type) {
      return res.status(400).json({
        success: false,
        error: 'Email and form type are required'
      });
    }

    const result = await query(
      `SELECT id, email, form_type, draft_name, status, created_at, updated_at
       FROM form_drafts
       WHERE email = $1 AND form_type = $2 AND status = 'draft'
       ORDER BY updated_at DESC`,
      [email, form_type]
    );

    res.json({
      success: true,
      drafts: result.rows
    });

  } catch (error) {
    console.error('Get user drafts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve drafts'
    });
  }
});

// Get a specific draft by ID
router.get('/:draft_id', async (req, res) => {
  try {
    const { draft_id } = req.params;

    if (!draft_id) {
      return res.status(400).json({
        success: false,
        error: 'Draft ID is required'
      });
    }

    const result = await query(
      `SELECT * FROM form_drafts WHERE id = $1`,
      [draft_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Draft not found'
      });
    }

    const draft = result.rows[0];

    res.json({
      success: true,
      draft: {
        id: draft.id,
        email: draft.email,
        form_type: draft.form_type,
        form_data: draft.form_data,
        draft_name: draft.draft_name,
        status: draft.status,
        created_at: draft.created_at,
        updated_at: draft.updated_at
      }
    });

  } catch (error) {
    console.error('Get draft error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve draft'
    });
  }
});

// Delete a draft
router.delete('/:draft_id', async (req, res) => {
  try {
    const { draft_id } = req.params;
    const { email } = req.body;

    if (!draft_id || !email) {
      return res.status(400).json({
        success: false,
        error: 'Draft ID and email are required'
      });
    }

    const result = await query(
      `DELETE FROM form_drafts 
       WHERE id = $1 AND email = $2
       RETURNING id`,
      [draft_id, email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Draft not found'
      });
    }

    res.json({
      success: true,
      message: 'Draft deleted successfully!'
    });

  } catch (error) {
    console.error('Delete draft error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete draft'
    });
  }
});

// Mark draft as abandoned (30+ days old)
router.post('/cleanup/abandoned', async (req, res) => {
  try {
    const result = await query(
      `UPDATE form_drafts 
       SET status = 'abandoned'
       WHERE status = 'draft' 
       AND updated_at < NOW() - INTERVAL '30 days'
       RETURNING id`,
    );

    res.json({
      success: true,
      message: `${result.rowCount} old drafts marked as abandoned`,
      count: result.rowCount
    });

  } catch (error) {
    console.error('Cleanup drafts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup drafts'
    });
  }
});

// Submit a draft as a complete form submission
router.post('/:draft_id/submit', async (req, res) => {
  try {
    const { draft_id } = req.params;
    const { email } = req.body;

    if (!draft_id || !email) {
      return res.status(400).json({
        success: false,
        error: 'Draft ID and email are required'
      });
    }

    // Get the draft
    const draftResult = await query(
      `SELECT * FROM form_drafts WHERE id = $1 AND email = $2`,
      [draft_id, email]
    );

    if (draftResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Draft not found'
      });
    }

    const draft = draftResult.rows[0];

    // Mark draft as submitted
    await query(
      `UPDATE form_drafts 
       SET status = 'submitted'
       WHERE id = $1`,
      [draft_id]
    );

    res.json({
      success: true,
      message: 'Draft submitted successfully!',
      draft: {
        id: draft.id,
        form_type: draft.form_type,
        form_data: draft.form_data
      }
    });

  } catch (error) {
    console.error('Submit draft error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit draft'
    });
  }
});

// Get all drafts for a user across all form types
router.get('/user/:email', async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const result = await query(
      `SELECT id, email, form_type, draft_name, status, created_at, updated_at
       FROM form_drafts
       WHERE email = $1 AND status = 'draft'
       ORDER BY form_type, updated_at DESC`,
      [email]
    );

    // Group drafts by form type
    const groupedDrafts = {};
    result.rows.forEach(draft => {
      if (!groupedDrafts[draft.form_type]) {
        groupedDrafts[draft.form_type] = [];
      }
      groupedDrafts[draft.form_type].push(draft);
    });

    res.json({
      success: true,
      drafts: groupedDrafts,
      total: result.rowCount
    });

  } catch (error) {
    console.error('Get all user drafts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve drafts'
    });
  }
});

module.exports = router;
