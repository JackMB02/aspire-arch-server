const express = require('express');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const { query } = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'aspire_design_lab_secret_key_2024';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    // Create directory if it doesn't exist
    if (!require('fs').existsSync(uploadDir)) {
      require('fs').mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Clean the original filename and add timestamp
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '-').toLowerCase();
    const timestamp = Date.now();
    cb(null, `${timestamp}-${cleanName}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images and PDFs
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only images and PDF files are allowed!'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Authentication middleware
async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Authentication required' });
  
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Invalid authorization format' });
  }
  
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    
    // Verify admin exists in database
    const result = await query('SELECT id FROM admins WHERE id = $1', [payload.sub]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid admin user' });
    }
    
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Get all items (public)
router.get('/', async (req, res) => {
  try {
    const { type, limit, page } = req.query;
    
    let queryText = 'SELECT * FROM items WHERE status = $1';
    const params = ['published'];
    let paramCount = 2;
    
    if (type) {
      queryText += ` AND type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }
    
    queryText += ' ORDER BY created_at DESC';
    
    if (limit) {
      queryText += ` LIMIT $${paramCount}`;
      params.push(parseInt(limit));
      paramCount++;
      
      if (page) {
        const offset = (parseInt(page) - 1) * parseInt(limit);
        queryText += ` OFFSET $${paramCount}`;
        params.push(offset);
      }
    }
    
    const result = await query(queryText, params);
    
    // Parse files JSON for each item
    const itemsWithParsedFiles = result.rows.map(item => {
      if (item.files && typeof item.files === 'object') {
        // files is already a JSON object in PostgreSQL JSONB
        item.files = item.files;
      } else {
        item.files = [];
      }
      return item;
    });
    
    res.json(itemsWithParsedFiles);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Get single item by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM items WHERE id = $1 AND status = $2', 
      [req.params.id, 'published']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    const item = result.rows[0];
    
    // Parse files JSON
    if (item.files && typeof item.files === 'object') {
      item.files = item.files;
    } else {
      item.files = [];
    }
    
    res.json(item);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// Create new item (admin only)
router.post('/', authMiddleware, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'files', maxCount: 5 }
]), async (req, res) => {
  try {
    const { title, type, content, status = 'published' } = req.body;
    
    // Validation
    if (!title || !type) {
      return res.status(400).json({ error: 'Title and type are required' });
    }

    const image = req.files['image'] ? `/uploads/${req.files['image'][0].filename}` : null;
    
    const files = req.files['files'] ? 
      req.files['files'].map(f => ({
        path: `/uploads/${f.filename}`,
        name: f.originalname,
        type: f.mimetype,
        size: f.size
      })) : [];

    const result = await query(
      'INSERT INTO items (title, type, content, image, files, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, type, content || '', image, files, status]
    );

    const item = result.rows[0];
    res.json(item);
    
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ 
      error: 'Failed to create item',
      details: error.message 
    });
  }
});

// Update item (admin only)
router.put('/:id', authMiddleware, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'files', maxCount: 5 }
]), async (req, res) => {
  try {
    const { title, type, content, status } = req.body;
    
    // First get the current item to preserve existing files if not re-uploaded
    const currentResult = await query('SELECT * FROM items WHERE id = $1', [req.params.id]);
    
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const currentItem = currentResult.rows[0];
    let image = currentItem.image;
    let files = currentItem.files;

    // Update image if new one is uploaded
    if (req.files['image']) {
      image = `/uploads/${req.files['image'][0].filename}`;
    }

    // Update files if new ones are uploaded
    if (req.files['files']) {
      const newFiles = req.files['files'].map(f => ({
        path: `/uploads/${f.filename}`,
        name: f.originalname,
        type: f.mimetype,
        size: f.size
      }));
      files = newFiles;
    }

    const updateResult = await query(
      `UPDATE items 
       SET title = $1, type = $2, content = $3, image = $4, files = $5, status = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 RETURNING *`,
      [
        title || currentItem.title,
        type || currentItem.type,
        content !== undefined ? content : currentItem.content,
        image,
        files,
        status || currentItem.status,
        req.params.id
      ]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const updatedItem = updateResult.rows[0];
    res.json(updatedItem);
    
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ 
      error: 'Failed to update item',
      details: error.message 
    });
  }
});

// Delete item (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await query('DELETE FROM items WHERE id = $1 RETURNING *', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Item deleted successfully',
      deleted: result.rows[0] 
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Get items for admin (with all statuses)
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    const result = await query('SELECT * FROM items ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

module.exports = router;