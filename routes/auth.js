const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query } = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'aspire_design_lab_secret_key_2024';

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const result = await query('SELECT * FROM admins WHERE username = $1', [username]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const admin = result.rows[0];
    const isValid = await bcrypt.compare(password, admin.password);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        sub: admin.id, 
        username: admin.username,
        role: 'admin'
      }, 
      JWT_SECRET, 
      { expiresIn: '8h' }
    );
    
    res.json({ 
      success: true,
      token,
      user: {
        id: admin.id,
        username: admin.username
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token endpoint
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ 
      valid: true, 
      user: decoded 
    });
  } catch (error) {
    res.json({ 
      valid: false,
      error: 'Invalid or expired token' 
    });
  }
});

// Change password endpoint
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword, token } = req.body;
    
    if (!currentPassword || !newPassword || !token) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const adminResult = await query('SELECT * FROM admins WHERE id = $1', [decoded.sub]);
    
    if (adminResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const admin = adminResult.rows[0];
    const isValid = await bcrypt.compare(currentPassword, admin.password);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    await query(
      'UPDATE admins SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, admin.id]
    );
    
    res.json({ success: true, message: 'Password updated successfully' });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router;