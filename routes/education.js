const express = require('express');
const router = express.Router();
const { query } = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/education';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow specific file types
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, Word, PowerPoint, Video, and Image files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Helper function to construct proper file URLs
const getFullFileUrl = (filePath) => {
  if (!filePath) return null;
  
  // If it's already a full URL, return as is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  
  // For relative paths, construct full URL
  const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
  return `${baseUrl}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
};

// Get all workshops
router.get('/workshops', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id,
        title,
        description,
        tag,
        duration,
        date,
        instructor,
        instructor_bio,
        price,
        capacity,
        enrolled_count,
        location,
        image_url as image,
        document_url as document,
        video_url as video,
        is_featured,
        is_published,
        status,
        created_at,
        updated_at
      FROM education_workshops 
      WHERE is_published = true AND status = $1
      ORDER BY date ASC, created_at DESC
    `, ['published']);

    const workshops = result.rows.map(workshop => ({
      id: workshop.id,
      title: workshop.title,
      description: workshop.description,
      tag: workshop.tag,
      duration: workshop.duration,
      date: workshop.date,
      instructor: workshop.instructor,
      instructorBio: workshop.instructor_bio,
      price: workshop.price,
      capacity: workshop.capacity,
      enrolledCount: workshop.enrolled_count,
      location: workshop.location,
      image: getFullFileUrl(workshop.image),
      document: getFullFileUrl(workshop.document),
      video: getFullFileUrl(workshop.video),
      isFeatured: workshop.is_featured,
      isPublished: workshop.is_published,
      status: workshop.status,
      createdAt: workshop.created_at,
      updatedAt: workshop.updated_at
    }));

    res.json(workshops);
  } catch (error) {
    console.error('Error fetching workshops:', error);
    res.status(500).json({ error: 'Failed to fetch workshops' });
  }
});

// Get all tutorials
router.get('/tutorials', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id,
        title,
        description,
        category,
        level,
        format,
        duration,
        document_url as document,
        video_url as video,
        thumbnail_url as thumbnail,
        download_count,
        is_featured,
        is_published,
        status,
        created_at,
        updated_at
      FROM education_tutorials 
      WHERE is_published = true AND status = $1
      ORDER BY created_at DESC
    `, ['published']);

    const tutorials = result.rows.map(tutorial => ({
      id: tutorial.id,
      title: tutorial.title,
      description: tutorial.description,
      category: tutorial.category,
      level: tutorial.level,
      format: tutorial.format,
      duration: tutorial.duration,
      document: getFullFileUrl(tutorial.document),
      video: getFullFileUrl(tutorial.video),
      thumbnail: getFullFileUrl(tutorial.thumbnail),
      downloadCount: tutorial.download_count,
      isFeatured: tutorial.is_featured,
      isPublished: tutorial.is_published,
      status: tutorial.status,
      createdAt: tutorial.created_at,
      updatedAt: tutorial.updated_at
    }));

    res.json(tutorials);
  } catch (error) {
    console.error('Error fetching tutorials:', error);
    res.status(500).json({ error: 'Failed to fetch tutorials' });
  }
});

// Get all exhibitions
router.get('/exhibitions', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id,
        title,
        description,
        start_date,
        end_date,
        location,
        curator,
        curator_bio,
        image_url as image,
        virtual_tour_url as virtualTour,
        brochure_url as brochure,
        is_featured,
        is_published,
        status,
        created_at,
        updated_at
      FROM education_exhibitions 
      WHERE is_published = true AND status = $1
      ORDER BY start_date ASC, created_at DESC
    `, ['published']);

    const exhibitions = result.rows.map(exhibition => ({
      id: exhibition.id,
      title: exhibition.title,
      description: exhibition.description,
      startDate: exhibition.start_date,
      endDate: exhibition.end_date,
      location: exhibition.location,
      curator: exhibition.curator,
      curatorBio: exhibition.curator_bio,
      image: getFullFileUrl(exhibition.image),
      virtualTour: getFullFileUrl(exhibition.virtual_tour_url),
      brochure: getFullFileUrl(exhibition.brochure_url),
      isFeatured: exhibition.is_featured,
      isPublished: exhibition.is_published,
      status: exhibition.status,
      createdAt: exhibition.created_at,
      updatedAt: exhibition.updated_at
    }));

    res.json(exhibitions);
  } catch (error) {
    console.error('Error fetching exhibitions:', error);
    res.status(500).json({ error: 'Failed to fetch exhibitions' });
  }
});

// Get education stats
router.get('/stats', async (req, res) => {
  try {
    const workshopsResult = await query('SELECT COUNT(*) FROM education_workshops WHERE is_published = true AND status = $1', ['published']);
    const tutorialsResult = await query('SELECT COUNT(*) FROM education_tutorials WHERE is_published = true AND status = $1', ['published']);
    const exhibitionsResult = await query('SELECT COUNT(*) FROM education_exhibitions WHERE is_published = true AND status = $1', ['published']);
    const instructorsResult = await query('SELECT COUNT(DISTINCT instructor) FROM education_workshops WHERE is_published = true AND status = $1', ['published']);

    const stats = {
      workshops: parseInt(workshopsResult.rows[0].count),
      tutorials: parseInt(tutorialsResult.rows[0].count),
      exhibitions: parseInt(exhibitionsResult.rows[0].count),
      instructors: parseInt(instructorsResult.rows[0].count)
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching education stats:', error);
    res.status(500).json({ error: 'Failed to fetch education statistics' });
  }
});

// ADMIN ROUTES - Create new workshop
router.post('/workshops', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'document', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      title,
      description,
      tag,
      duration,
      date,
      instructor,
      instructor_bio,
      price,
      capacity,
      location,
      is_featured,
      is_published,
      status
    } = req.body;

    const imageFile = req.files?.image ? req.files.image[0] : null;
    const documentFile = req.files?.document ? req.files.document[0] : null;
    const videoFile = req.files?.video ? req.files.video[0] : null;

    const result = await query(`
      INSERT INTO education_workshops 
        (title, description, tag, duration, date, instructor, instructor_bio, price, capacity, location, 
         image_url, document_url, video_url, is_featured, is_published, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `, [
      title, description, tag, duration, date, instructor, instructor_bio, price || 0, capacity || 0, location,
      imageFile ? `/uploads/education/${imageFile.filename}` : null,
      documentFile ? `/uploads/education/${documentFile.filename}` : null,
      videoFile ? `/uploads/education/${videoFile.filename}` : null,
      is_featured || false, is_published || true, status || 'published'
    ]);

    const workshop = result.rows[0];
    res.status(201).json({
      id: workshop.id,
      title: workshop.title,
      description: workshop.description,
      tag: workshop.tag,
      duration: workshop.duration,
      date: workshop.date,
      instructor: workshop.instructor,
      instructorBio: workshop.instructor_bio,
      price: workshop.price,
      capacity: workshop.capacity,
      location: workshop.location,
      image: getFullFileUrl(workshop.image_url),
      document: getFullFileUrl(workshop.document_url),
      video: getFullFileUrl(workshop.video_url),
      isFeatured: workshop.is_featured,
      isPublished: workshop.is_published,
      status: workshop.status,
      createdAt: workshop.created_at
    });
  } catch (error) {
    console.error('Error creating workshop:', error);
    res.status(500).json({ error: 'Failed to create workshop' });
  }
});

// ADMIN ROUTES - Create new tutorial
router.post('/tutorials', upload.fields([
  { name: 'document', maxCount: 1 },
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      level,
      format,
      duration,
      is_featured,
      is_published,
      status
    } = req.body;

    const documentFile = req.files?.document ? req.files.document[0] : null;
    const videoFile = req.files?.video ? req.files.video[0] : null;
    const thumbnailFile = req.files?.thumbnail ? req.files.thumbnail[0] : null;

    const result = await query(`
      INSERT INTO education_tutorials 
        (title, description, category, level, format, duration, 
         document_url, video_url, thumbnail_url, is_featured, is_published, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      title, description, category, level, format, duration,
      documentFile ? `/uploads/education/${documentFile.filename}` : null,
      videoFile ? `/uploads/education/${videoFile.filename}` : null,
      thumbnailFile ? `/uploads/education/${thumbnailFile.filename}` : null,
      is_featured || false, is_published || true, status || 'published'
    ]);

    const tutorial = result.rows[0];
    res.status(201).json({
      id: tutorial.id,
      title: tutorial.title,
      description: tutorial.description,
      category: tutorial.category,
      level: tutorial.level,
      format: tutorial.format,
      duration: tutorial.duration,
      document: getFullFileUrl(tutorial.document_url),
      video: getFullFileUrl(tutorial.video_url),
      thumbnail: getFullFileUrl(tutorial.thumbnail_url),
      isFeatured: tutorial.is_featured,
      isPublished: tutorial.is_published,
      status: tutorial.status,
      createdAt: tutorial.created_at
    });
  } catch (error) {
    console.error('Error creating tutorial:', error);
    res.status(500).json({ error: 'Failed to create tutorial' });
  }
});

// ADMIN ROUTES - Create new exhibition
router.post('/exhibitions', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'brochure', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      title,
      description,
      start_date,
      end_date,
      location,
      curator,
      curator_bio,
      virtual_tour_url,
      is_featured,
      is_published,
      status
    } = req.body;

    const imageFile = req.files?.image ? req.files.image[0] : null;
    const brochureFile = req.files?.brochure ? req.files.brochure[0] : null;

    const result = await query(`
      INSERT INTO education_exhibitions 
        (title, description, start_date, end_date, location, curator, curator_bio, 
         image_url, brochure_url, virtual_tour_url, is_featured, is_published, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      title, description, start_date, end_date, location, curator, curator_bio,
      imageFile ? `/uploads/education/${imageFile.filename}` : null,
      brochureFile ? `/uploads/education/${brochureFile.filename}` : null,
      virtual_tour_url,
      is_featured || false, is_published || true, status || 'published'
    ]);

    const exhibition = result.rows[0];
    res.status(201).json({
      id: exhibition.id,
      title: exhibition.title,
      description: exhibition.description,
      startDate: exhibition.start_date,
      endDate: exhibition.end_date,
      location: exhibition.location,
      curator: exhibition.curator,
      curatorBio: exhibition.curator_bio,
      image: getFullFileUrl(exhibition.image_url),
      brochure: getFullFileUrl(exhibition.brochure_url),
      virtualTour: getFullFileUrl(exhibition.virtual_tour_url),
      isFeatured: exhibition.is_featured,
      isPublished: exhibition.is_published,
      status: exhibition.status,
      createdAt: exhibition.created_at
    });
  } catch (error) {
    console.error('Error creating exhibition:', error);
    res.status(500).json({ error: 'Failed to create exhibition' });
  }
});

// ADMIN ROUTES - Update workshop
router.put('/workshops/:id', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'document', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const setClauses = [];
    const values = [];
    let paramCount = 1;

    // Handle file updates
    const imageFile = req.files?.image ? req.files.image[0] : null;
    const documentFile = req.files?.document ? req.files.document[0] : null;
    const videoFile = req.files?.video ? req.files.video[0] : null;

    if (imageFile) {
      setClauses.push(`image_url = $${paramCount}`);
      values.push(`/uploads/education/${imageFile.filename}`);
      paramCount++;
    }

    if (documentFile) {
      setClauses.push(`document_url = $${paramCount}`);
      values.push(`/uploads/education/${documentFile.filename}`);
      paramCount++;
    }

    if (videoFile) {
      setClauses.push(`video_url = $${paramCount}`);
      values.push(`/uploads/education/${videoFile.filename}`);
      paramCount++;
    }

    // Handle other field updates
    Object.keys(updates).forEach(key => {
      if (!['image', 'document', 'video'].includes(key)) {
        setClauses.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    
    const result = await query(`
      UPDATE education_workshops 
      SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Workshop not found' });
    }

    const workshop = result.rows[0];
    res.json({
      id: workshop.id,
      title: workshop.title,
      description: workshop.description,
      tag: workshop.tag,
      duration: workshop.duration,
      date: workshop.date,
      instructor: workshop.instructor,
      instructorBio: workshop.instructor_bio,
      price: workshop.price,
      capacity: workshop.capacity,
      location: workshop.location,
      image: getFullFileUrl(workshop.image_url),
      document: getFullFileUrl(workshop.document_url),
      video: getFullFileUrl(workshop.video_url),
      isFeatured: workshop.is_featured,
      isPublished: workshop.is_published,
      status: workshop.status,
      createdAt: workshop.created_at,
      updatedAt: workshop.updated_at
    });
  } catch (error) {
    console.error('Error updating workshop:', error);
    res.status(500).json({ error: 'Failed to update workshop' });
  }
});

// ADMIN ROUTES - Delete workshop
router.delete('/workshops/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM education_workshops WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Workshop not found' });
    }

    res.json({ message: 'Workshop deleted successfully' });
  } catch (error) {
    console.error('Error deleting workshop:', error);
    res.status(500).json({ error: 'Failed to delete workshop' });
  }
});

// ADMIN ROUTES - Get all workshops (including unpublished)
router.get('/admin/workshops', async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM education_workshops 
      ORDER BY created_at DESC
    `);

    const workshops = result.rows.map(workshop => ({
      id: workshop.id,
      title: workshop.title,
      description: workshop.description,
      tag: workshop.tag,
      duration: workshop.duration,
      date: workshop.date,
      instructor: workshop.instructor,
      instructorBio: workshop.instructor_bio,
      price: workshop.price,
      capacity: workshop.capacity,
      enrolledCount: workshop.enrolled_count,
      location: workshop.location,
      image: getFullFileUrl(workshop.image_url),
      document: getFullFileUrl(workshop.document_url),
      video: getFullFileUrl(workshop.video_url),
      isFeatured: workshop.is_featured,
      isPublished: workshop.is_published,
      status: workshop.status,
      createdAt: workshop.created_at,
      updatedAt: workshop.updated_at
    }));

    res.json(workshops);
  } catch (error) {
    console.error('Error fetching workshops for admin:', error);
    res.status(500).json({ error: 'Failed to fetch workshops' });
  }
});

module.exports = router;