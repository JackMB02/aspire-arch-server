const express = require('express');
const nodemailer = require('nodemailer');
const { query } = require('../db');

const router = express.Router();
// Add this route at the top of your routes/contact.js file
router.get('/test', (req, res) => {
  console.log('✅ Test endpoint hit');
  res.setHeader('Content-Type', 'application/json');
  res.json({ 
    success: true, 
    message: 'Contact API is working!',
    timestamp: new Date().toISOString()
  });
});
// Get contact information for frontend
router.get('/info', async (req, res) => {
  let client;
  try {
    console.log('📞 Fetching contact information...');
    
    const result = await query(
      'SELECT * FROM contact_info WHERE is_active = true ORDER BY display_order ASC'
    );
    
    console.log(`✅ Found ${result.rows.length} contact info items`);
    
    // Ensure proper JSON response
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(result.rows);
    
  } catch (error) {
    console.error('❌ Database error in /info:', error);
    
    // Ensure proper JSON error response
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch contact information',
      details: error.message 
    });
  }
});

// Submit contact form
router.post('/submit', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    // Log incoming request for debugging
    console.log('📝 Contact form submission received:', { 
      name: name?.substring(0, 20), 
      email: email?.substring(0, 20),
      message: message?.substring(0, 50) + '...' 
    });

    // Validation
    if (!name || !email || !message) {
      console.log('❌ Validation failed: Missing required fields');
      return res.status(400).json({ 
        success: false,
        error: 'All fields are required' 
      });
    }

    if (name.length < 2) {
      console.log('❌ Validation failed: Name too short');
      return res.status(400).json({ 
        success: false,
        error: 'Name must be at least 2 characters long' 
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Validation failed: Invalid email format');
      return res.status(400).json({ 
        success: false,
        error: 'Invalid email format' 
      });
    }

    if (message.length < 10) {
      console.log('❌ Validation failed: Message too short');
      return res.status(400).json({ 
        success: false,
        error: 'Message must be at least 10 characters long' 
      });
    }

    // Save to database
    console.log('💾 Saving contact submission to database...');
    const result = await query(
      'INSERT INTO contact_submissions (name, email, message) VALUES ($1, $2, $3) RETURNING *',
      [name.trim(), email.trim(), message.trim()]
    );

    const submission = result.rows[0];
    
    console.log('✅ Contact submission saved to database with ID:', submission.id);
    
    // Send email notification (non-blocking)
    sendEmailNotification(name, email, message, submission.id).catch(console.error);

    // Ensure proper JSON response
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json({ 
      success: true, 
      message: 'Thank you for your message! We will get back to you soon.',
      id: submission.id 
    });
    
  } catch (error) {
    console.error('❌ Contact form error:', error);
    
    // Ensure proper JSON error response
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Get contact submissions (admin only)
router.get('/submissions', async (req, res) => {
  try {
    console.log('👨‍💼 Fetching contact submissions (admin)...');
    
    if (!await authenticateAdmin(req)) {
      console.log('❌ Admin authentication failed');
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }

    const result = await query(`
      SELECT * FROM contact_submissions 
      ORDER BY 
        CASE status 
          WHEN 'new' THEN 1
          WHEN 'read' THEN 2
          WHEN 'replied' THEN 3
          ELSE 4
        END,
        created_at DESC
    `);
    
    console.log(`✅ Found ${result.rows.length} submissions`);
    
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('❌ Database error in /submissions:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch submissions',
      details: error.message 
    });
  }
});

// Get submission statistics (admin only)
router.get('/submissions/stats', async (req, res) => {
  try {
    console.log('📊 Fetching submission statistics...');
    
    if (!await authenticateAdmin(req)) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }

    const totalResult = await query('SELECT COUNT(*) as total FROM contact_submissions');
    const statusResult = await query('SELECT status, COUNT(*) as count FROM contact_submissions GROUP BY status');
    const recentResult = await query(
      'SELECT COUNT(*) as recent FROM contact_submissions WHERE created_at >= NOW() - INTERVAL \'7 days\''
    );

    const stats = {
      total: parseInt(totalResult.rows[0].total),
      byStatus: statusResult.rows,
      recent: parseInt(recentResult.rows[0].recent)
    };

    console.log('✅ Statistics fetched successfully');
    
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('❌ Database error in /submissions/stats:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch statistics',
      details: error.message 
    });
  }
});

// Update submission status (admin only)
router.put('/submissions/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    console.log(`🔄 Updating submission ${id} status to:`, status);
    
    if (!await authenticateAdmin(req)) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }

    const validStatuses = ['new', 'read', 'replied', 'archived'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid status' 
      });
    }

    const updateData = [status];
    let queryText = 'UPDATE contact_submissions SET status = $1, updated_at = CURRENT_TIMESTAMP';
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
      console.log(`❌ Submission ${id} not found`);
      return res.status(404).json({ 
        success: false,
        error: 'Submission not found' 
      });
    }

    console.log(`✅ Submission ${id} updated successfully`);
    
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ 
      success: true, 
      data: result.rows[0] 
    });
    
  } catch (error) {
    console.error('❌ Database error in /submissions/:id/status:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      success: false,
      error: 'Failed to update status',
      details: error.message 
    });
  }
});

// Delete submission (admin only)
router.delete('/submissions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting submission ${id}...`);
    
    if (!await authenticateAdmin(req)) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }

    const result = await query('DELETE FROM contact_submissions WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      console.log(`❌ Submission ${id} not found for deletion`);
      return res.status(404).json({ 
        success: false,
        error: 'Submission not found' 
      });
    }

    console.log(`✅ Submission ${id} deleted successfully`);
    
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ 
      success: true, 
      data: result.rows[0] 
    });
    
  } catch (error) {
    console.error('❌ Database error in DELETE /submissions/:id:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete submission',
      details: error.message 
    });
  }
});

// Get all contact info (admin only)
router.get('/admin/info', async (req, res) => {
  try {
    console.log('👨‍💼 Fetching all contact info (admin)...');
    
    if (!await authenticateAdmin(req)) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }

    const result = await query('SELECT * FROM contact_info ORDER BY display_order ASC');
    
    console.log(`✅ Found ${result.rows.length} contact info items`);
    
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('❌ Database error in /admin/info:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch contact information',
      details: error.message 
    });
  }
});

// Update contact information (admin only)
router.put('/info/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, value, description, display_order, is_active } = req.body;
    
    console.log(`🔄 Updating contact info ${id}:`, { title, display_order });
    
    if (!await authenticateAdmin(req)) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }

    if (!title || !value) {
      return res.status(400).json({ 
        success: false,
        error: 'Title and value are required' 
      });
    }

    const result = await query(
      `UPDATE contact_info 
       SET title = $1, value = $2, description = $3, display_order = $4, is_active = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [title, value, description, display_order, is_active, id]
    );

    if (result.rows.length === 0) {
      console.log(`❌ Contact info ${id} not found`);
      return res.status(404).json({ 
        success: false,
        error: 'Contact info not found' 
      });
    }

    console.log(`✅ Contact info ${id} updated successfully`);
    
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ 
      success: true, 
      data: result.rows[0] 
    });
    
  } catch (error) {
    console.error('❌ Database error in PUT /info/:id:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      success: false,
      error: 'Failed to update contact info',
      details: error.message 
    });
  }
});

// Create new contact info (admin only)
router.post('/info', async (req, res) => {
  try {
    const { type, title, value, description, display_order, is_active } = req.body;
    
    console.log('🆕 Creating new contact info:', { type, title });
    
    if (!await authenticateAdmin(req)) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }

    if (!type || !title || !value) {
      return res.status(400).json({ 
        success: false,
        error: 'Type, title and value are required' 
      });
    }

    const result = await query(
      `INSERT INTO contact_info (type, title, value, description, display_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [type, title, value, description, display_order, is_active]
    );

    console.log(`✅ New contact info created with ID: ${result.rows[0].id}`);
    
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json({ 
      success: true, 
      data: result.rows[0] 
    });
    
  } catch (error) {
    console.error('❌ Database error in POST /info:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      success: false,
      error: 'Failed to create contact info',
      details: error.message 
    });
  }
});

// Get email settings (admin only)
router.get('/email-settings', async (req, res) => {
  try {
    console.log('📧 Fetching email settings...');
    
    if (!await authenticateAdmin(req)) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }

    const result = await query('SELECT * FROM email_settings ORDER BY id ASC');
    
    console.log(`✅ Found ${result.rows.length} email settings`);
    
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('❌ Database error in /email-settings:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch email settings',
      details: error.message 
    });
  }
});

// Update email settings (admin only)
router.put('/email-settings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { recipient_email, subject_template, enabled } = req.body;
    
    console.log(`🔄 Updating email settings ${id}:`, { recipient_email, enabled });
    
    if (!await authenticateAdmin(req)) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }

    if (!recipient_email) {
      return res.status(400).json({ 
        success: false,
        error: 'Recipient email is required' 
      });
    }

    const result = await query(
      `UPDATE email_settings 
       SET recipient_email = $1, subject_template = $2, enabled = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [recipient_email, subject_template, enabled, id]
    );

    if (result.rows.length === 0) {
      console.log(`❌ Email setting ${id} not found`);
      return res.status(404).json({ 
        success: false,
        error: 'Email setting not found' 
      });
    }

    console.log(`✅ Email settings ${id} updated successfully`);
    
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ 
      success: true, 
      data: result.rows[0] 
    });
    
  } catch (error) {
    console.error('❌ Database error in PUT /email-settings/:id:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      success: false,
      error: 'Failed to update email settings',
      details: error.message 
    });
  }
});

// Helper function for admin authentication
async function authenticateAdmin(req) {
  const auth = req.headers.authorization;
  if (!auth) {
    console.log('🔐 No authorization header provided');
    return false;
  }
  
  const token = auth.split(' ')[1];
  if (!token) {
    console.log('🔐 No token provided');
    return false;
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'aspire_design_lab_secret_key_2024';
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verify admin exists
    const result = await query('SELECT id FROM admins WHERE id = $1', [decoded.sub]);
    
    if (result.rows.length > 0) {
      console.log(`🔐 Admin authenticated: ID ${decoded.sub}`);
      return true;
    } else {
      console.log('🔐 Admin not found in database');
      return false;
    }
  } catch (error) {
    console.error('🔐 Authentication error:', error.message);
    return false;
  }
}

// Email notification function
async function sendEmailNotification(name, email, message, submissionId) {
  try {
    console.log('📧 Preparing to send email notification...');
    
    // Get active email settings
    const result = await query('SELECT * FROM email_settings WHERE enabled = true LIMIT 1');
    
    if (result.rows.length === 0) {
      console.error('❌ No active email settings found');
      return;
    }

    const settings = result.rows[0];
    console.log(`📧 Sending email to: ${settings.recipient_email}`);

    // Configure nodemailer - using environment variables with fallbacks
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      // Add timeout and better error handling
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000
    });

    // Verify transporter configuration
    await transporter.verify();
    console.log('✅ Email transporter verified successfully');

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@aspirearchitecture.com',
      to: settings.recipient_email,
      subject: settings.subject_template || 'New Contact Form Submission - ASPIRE Design Lab',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #7a9ed9; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Submission ID:</strong> #${submissionId}</p>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0;">Message:</h3>
            <p style="white-space: pre-line; line-height: 1.6;">${message}</p>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: #e9f7fe; border-radius: 8px;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              <em>This message was sent from your ASPIRE Design Lab contact form.</em>
            </p>
          </div>
        </div>
      `,
      // Add text version for email clients that don't support HTML
      text: `
New Contact Form Submission

Submission ID: #${submissionId}
Name: ${name}
Email: ${email}
Submitted: ${new Date().toLocaleString()}

Message:
${message}

This message was sent from your ASPIRE Design Lab contact form.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email notification sent successfully:', info.messageId);
    
  } catch (error) {
    console.error('❌ Failed to send email notification:', error);
    // Don't throw error - email failure shouldn't break the form submission
  }
}

module.exports = router;