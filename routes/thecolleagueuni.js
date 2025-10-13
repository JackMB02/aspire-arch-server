const express = require('express');
const router = express.Router();
const { query } = require('../db'); // FIXED: Changed from '../config/db' to '../db'

// @desc    Submit contact form
// @route   POST /api/thecolleagueuni/contact
// @access  Public
router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Insert into architecture_colleagues_contact table
    const result = await query(
      `INSERT INTO architecture_colleagues_contact (name, email, subject, message, status) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [name, email, subject, message, 'new']
    );

    res.status(201).json({
      success: true,
      message: 'Thank you for your message! We will get back to you soon.',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// @desc    Get team members
// @route   GET /api/thecolleagueuni/team
// @access  Public
router.get('/team', async (req, res) => {
  try {
    // Get team members from database
    const result = await query(
      'SELECT * FROM architecture_colleagues_team WHERE is_active = true ORDER BY display_order'
    );

    res.status(200).json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching team data'
    });
  }
});

// @desc    Get mission and values
// @route   GET /api/thecolleagueuni/mission
// @access  Public
router.get('/mission', async (req, res) => {
  try {
    // Get mission data
    const missionResult = await query('SELECT * FROM architecture_colleagues_mission WHERE is_active = true LIMIT 1');
    const valuesResult = await query('SELECT * FROM architecture_colleagues_values WHERE is_active = true ORDER BY display_order');

    const missionData = {
      mission: missionResult.rows[0]?.mission_statement || "To democratize architectural education by creating a platform where students and professionals can learn from each other, regardless of geographic, economic, or hierarchical barriers.",
      vision: missionResult.rows[0]?.vision_statement || "We envision a world where architectural development is continuous, collaborative, and integrated into daily practice through peer connections and organic learning.",
      values: valuesResult.rows.map(row => ({
        title: row.title,
        description: row.description
      }))
    };

    res.status(200).json({
      success: true,
      data: missionData
    });

  } catch (error) {
    console.error('Get mission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching mission data'
    });
  }
});

// @desc    Get initiatives
// @route   GET /api/thecolleagueuni/initiatives
// @access  Public
router.get('/initiatives', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM architecture_colleagues_initiatives WHERE is_active = true ORDER BY display_order'
    );

    res.status(200).json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get initiatives error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching initiatives'
    });
  }
});

// @desc    Get all contact submissions (for admin)
// @route   GET /api/thecolleagueuni/contacts
// @access  Private
router.get('/contacts', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM architecture_colleagues_contact ORDER BY created_at DESC'
    );
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contact submissions'
    });
  }
});

// @desc    Update contact status
// @route   PUT /api/thecolleagueuni/contacts/:id
// @access  Private
router.put('/contacts/:id', async (req, res) => {
  try {
    const { status } = req.body;
    
    const result = await query(
      `UPDATE architecture_colleagues_contact 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating contact'
    });
  }
});

// @desc    Get architecture colleagues lab specific data
// @route   GET /api/thecolleagueuni/about
// @access  Public
router.get('/about', async (req, res) => {
  try {
    const aboutData = {
      title: "About The Architecture Colleagues Lab",
      description: "Curious About What Rwandan (In) Architecture Really Is?",
      content: [
        "Program of Rwandan architecture students passionate about learning, working, and studying together. Through the lens of culture, society, and practice, we explore how architecture can respond to today's challenges and give communities a stronger voice in shaping their spaces.",
        "We welcome architecture students, architects, professionals (engineers, sociologists, anthropologist) and anyone even without an architecture background who believes in design that speaks for the people.",
        "Let's connect and shape a future where architecture speaks for everyone."
      ],
      features: [
        {
          title: "Our Story",
          content: "Founded in 2025 by Arsène MANZI MUGENI — the founder of ASPIRE Design Lab — during his second year of architecture school, The Architecture Colleagues Lab began as a project within ASPIRE Design Lab. It was born out of a strong intention to bridge the gap between academia and professional practice, creating a space where students could learn collaboratively, share knowledge, and experiment with ideas that go beyond the classroom. The initiative quickly evolved into a peer-driven platform for research, dialogue, and design exploration, encouraging young architects to engage with culture, society, and the environment in meaningful ways."
        },
        {
          title: "Impact to Be Made",
          content: "As students, we are not just preparing for the future — we are shaping it. We experiment, question, and collaborate to influence how spaces are designed to reflect culture, support communities, and solve real-world challenges. As Aldo Rossi reminds us, 'Architecture is the fixed stage for human events.' By rethinking how these 'stages' are designed, we aim to create environments that nurture human dignity, belonging, and possibility."
        },
        {
          title: "Why This Matters",
          content: "Architecture is more than buildings — it is a tool for change. As Le Corbusier said, 'Architecture is the learned game, correct and magnificent, of forms assembled in the light.' If this is true, then as students, we have the freedom to play, test bold ideas, and reimagine what that game could be in our cultural and social context. Our student years are the perfect laboratory for innovation — a space where failure becomes a teacher and ideas can be fearlessly explored. This is why we choose to act now: to lay the foundation for a more thoughtful, inclusive, and responsive built environment."
        }
      ]
    };

    res.status(200).json({
      success: true,
      data: aboutData
    });

  } catch (error) {
    console.error('Get about data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching about data'
    });
  }
});

module.exports = router;