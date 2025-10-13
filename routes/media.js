const express = require('express');
const router = express.Router();
const { query } = require('../db');

// Helper function to construct proper image URLs
const getFullImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    
    // If it's a data URL (base64 image), return as is
    if (imagePath.startsWith('data:')) {
        return imagePath;
    }
    
    // For relative paths, construct full URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
    return `${baseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

// Get media statistics
router.get('/stats', async (req, res) => {
  try {
    const photosResult = await query('SELECT COUNT(*) FROM media_photos WHERE is_published = true AND status = $1', ['published']);
    const videosResult = await query('SELECT COUNT(*) FROM media_videos WHERE is_published = true AND status = $1', ['published']);
    const designsResult = await query('SELECT COUNT(*) FROM media_designs WHERE is_published = true AND status = $1', ['published']);
    const testimonialsResult = await query('SELECT COUNT(*) FROM media_testimonials WHERE is_published = true AND status = $1', ['published']);

    const stats = {
      photos: parseInt(photosResult.rows[0].count),
      videos: parseInt(videosResult.rows[0].count),
      designs: parseInt(designsResult.rows[0].count),
      testimonials: parseInt(testimonialsResult.rows[0].count)
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching media stats:', error);
    res.status(500).json({ error: 'Failed to fetch media statistics' });
  }
});

// Get all photos
router.get('/photos', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id,
        title,
        description,
        image_url as image,
        category,
        album_name as album,
        tags,
        display_order,
        is_featured,
        created_at
      FROM media_photos 
      WHERE is_published = true AND status = $1
      ORDER BY display_order, created_at DESC
    `, ['published']);

    const photos = result.rows.map(photo => ({
      id: photo.id,
      title: photo.title,
      image: getFullImageUrl(photo.image),
      category: photo.category,
      description: photo.description,
      album: photo.album,
      tags: photo.tags,
      isFeatured: photo.is_featured,
      createdAt: photo.created_at
    }));

    console.log('Photos API Response:', photos); // Debug log
    res.json(photos);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

// Get all videos - FIXED
router.get('/videos', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id,
        title,
        description,
        video_url as "videoSrc",
        thumbnail_url as thumbnail,
        duration,
        category,
        tags,
        is_featured,
        created_at
      FROM media_videos 
      WHERE is_published = true AND status = $1
      ORDER BY created_at DESC
    `, ['published']);

    const videos = result.rows.map(video => ({
      id: video.id,
      title: video.title,
      thumbnail: getFullImageUrl(video.thumbnail),
      duration: video.duration,
      videoSrc: getFullImageUrl(video.videoSrc),
      category: video.category,
      description: video.description,
      tags: video.tags,
      isFeatured: video.is_featured,
      createdAt: video.created_at
    }));

    console.log('Videos API Response:', videos); // Debug log
    res.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Get all designs
router.get('/designs', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id,
        title,
        description,
        image_url as image,
        design_type as type,
        category,
        project_name as project,
        tags,
        display_order,
        is_featured,
        created_at
      FROM media_designs 
      WHERE is_published = true AND status = $1
      ORDER BY display_order, created_at DESC
    `, ['published']);

    const designs = result.rows.map(design => ({
      id: design.id,
      title: design.title,
      image: getFullImageUrl(design.image),
      type: design.type,
      category: design.category,
      description: design.description,
      project: design.project,
      tags: design.tags,
      isFeatured: design.is_featured,
      createdAt: design.created_at
    }));

    console.log('Designs API Response:', designs); // Debug log
    res.json(designs);
  } catch (error) {
    console.error('Error fetching designs:', error);
    res.status(500).json({ error: 'Failed to fetch designs' });
  }
});

// Get all testimonials
router.get('/testimonials', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id,
        name,
        role,
        organization,
        quote,
        project_name as project,
        image_url as image,
        rating,
        is_featured,
        display_order,
        created_at
      FROM media_testimonials 
      WHERE is_published = true AND status = $1
      ORDER BY display_order, created_at DESC
    `, ['published']);

    const testimonials = result.rows.map(testimonial => ({
      id: testimonial.id,
      name: testimonial.name,
      role: testimonial.role,
      organization: testimonial.organization,
      quote: testimonial.quote,
      project: testimonial.project,
      image: getFullImageUrl(testimonial.image),
      rating: testimonial.rating,
      isFeatured: testimonial.is_featured,
      createdAt: testimonial.created_at
    }));

    console.log('Testimonials API Response:', testimonials); // Debug log
    res.json(testimonials);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

// Get single photo by ID
router.get('/photos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT 
        id,
        title,
        description,
        image_url as image,
        category,
        album_name as album,
        tags,
        display_order,
        is_featured,
        created_at
      FROM media_photos 
      WHERE id = $1 AND is_published = true AND status = $2
    `, [id, 'published']);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const photo = result.rows[0];
    res.json({
      id: photo.id,
      title: photo.title,
      image: getFullImageUrl(photo.image),
      category: photo.category,
      description: photo.description,
      album: photo.album,
      tags: photo.tags,
      isFeatured: photo.is_featured,
      createdAt: photo.created_at
    });
  } catch (error) {
    console.error('Error fetching photo:', error);
    res.status(500).json({ error: 'Failed to fetch photo' });
  }
});

// Get single video by ID - FIXED
router.get('/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT 
        id,
        title,
        description,
        video_url as "videoSrc",
        thumbnail_url as thumbnail,
        duration,
        category,
        tags,
        is_featured,
        created_at
      FROM media_videos 
      WHERE id = $1 AND is_published = true AND status = $2
    `, [id, 'published']);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const video = result.rows[0];
    res.json({
      id: video.id,
      title: video.title,
      thumbnail: getFullImageUrl(video.thumbnail),
      duration: video.duration,
      videoSrc: getFullImageUrl(video.videoSrc),
      category: video.category,
      description: video.description,
      tags: video.tags,
      isFeatured: video.is_featured,
      createdAt: video.created_at
    });
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

// Get photos by category
router.get('/photos/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const result = await query(`
      SELECT 
        id,
        title,
        description,
        image_url as image,
        category,
        album_name as album,
        tags,
        display_order,
        is_featured,
        created_at
      FROM media_photos 
      WHERE category = $1 AND is_published = true AND status = $2
      ORDER BY display_order, created_at DESC
    `, [category, 'published']);

    const photos = result.rows.map(photo => ({
      id: photo.id,
      title: photo.title,
      image: getFullImageUrl(photo.image),
      category: photo.category,
      description: photo.description,
      album: photo.album,
      tags: photo.tags,
      isFeatured: photo.is_featured,
      createdAt: photo.created_at
    }));

    res.json(photos);
  } catch (error) {
    console.error('Error fetching photos by category:', error);
    res.status(500).json({ error: 'Failed to fetch photos by category' });
  }
});

// Get featured media
router.get('/featured', async (req, res) => {
  try {
    const featuredPhotos = await query(`
      SELECT id, title, image_url as image, category 
      FROM media_photos 
      WHERE is_featured = true AND is_published = true AND status = $1
      ORDER BY display_order
      LIMIT 4
    `, ['published']);

    const featuredVideos = await query(`
      SELECT id, title, thumbnail_url as thumbnail, duration
      FROM media_videos 
      WHERE is_featured = true AND is_published = true AND status = $1
      ORDER BY created_at DESC
      LIMIT 2
    `, ['published']);

    const featuredDesigns = await query(`
      SELECT id, title, image_url as image, design_type as type
      FROM media_designs 
      WHERE is_featured = true AND is_published = true AND status = $1
      ORDER BY display_order
      LIMIT 3
    `, ['published']);

    const featuredTestimonials = await query(`
      SELECT id, name, role, quote, image_url as image
      FROM media_testimonials 
      WHERE is_featured = true AND is_published = true AND status = $1
      ORDER BY display_order
      LIMIT 3
    `, ['published']);

    res.json({
      photos: featuredPhotos.rows.map(photo => ({
        ...photo,
        image: getFullImageUrl(photo.image)
      })),
      videos: featuredVideos.rows.map(video => ({
        ...video,
        thumbnail: getFullImageUrl(video.thumbnail)
      })),
      designs: featuredDesigns.rows.map(design => ({
        ...design,
        image: getFullImageUrl(design.image)
      })),
      testimonials: featuredTestimonials.rows.map(testimonial => ({
        ...testimonial,
        image: getFullImageUrl(testimonial.image)
      }))
    });
  } catch (error) {
    console.error('Error fetching featured media:', error);
    res.status(500).json({ error: 'Failed to fetch featured media' });
  }
});

// NEW: Create a new photo
router.post('/photos', async (req, res) => {
  try {
    const { title, description, image_url, category, album_name, tags, is_featured, is_published, status } = req.body;
    
    const result = await query(`
      INSERT INTO media_photos 
        (title, description, image_url, category, album_name, tags, is_featured, is_published, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [title, description, image_url, category, album_name, JSON.stringify(tags || []), is_featured || false, is_published || true, status || 'published']);

    const photo = result.rows[0];
    res.status(201).json({
      id: photo.id,
      title: photo.title,
      image: getFullImageUrl(photo.image_url),
      category: photo.category,
      description: photo.description,
      album: photo.album_name,
      tags: photo.tags,
      isFeatured: photo.is_featured,
      createdAt: photo.created_at
    });
  } catch (error) {
    console.error('Error creating photo:', error);
    res.status(500).json({ error: 'Failed to create photo' });
  }
});

// NEW: Create a new video
router.post('/videos', async (req, res) => {
  try {
    const { title, description, video_url, thumbnail_url, duration, category, tags, is_featured, is_published, status } = req.body;
    
    const result = await query(`
      INSERT INTO media_videos 
        (title, description, video_url, thumbnail_url, duration, category, tags, is_featured, is_published, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [title, description, video_url, thumbnail_url, duration, category, JSON.stringify(tags || []), is_featured || false, is_published || true, status || 'published']);

    const video = result.rows[0];
    res.status(201).json({
      id: video.id,
      title: video.title,
      thumbnail: getFullImageUrl(video.thumbnail_url),
      duration: video.duration,
      videoSrc: getFullImageUrl(video.video_url),
      category: video.category,
      description: video.description,
      tags: video.tags,
      isFeatured: video.is_featured,
      createdAt: video.created_at
    });
  } catch (error) {
    console.error('Error creating video:', error);
    res.status(500).json({ error: 'Failed to create video' });
  }
});

// NEW: Create a new design
router.post('/designs', async (req, res) => {
  try {
    const { title, description, image_url, design_type, category, project_name, tags, is_featured, is_published, status } = req.body;
    
    const result = await query(`
      INSERT INTO media_designs 
        (title, description, image_url, design_type, category, project_name, tags, is_featured, is_published, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [title, description, image_url, design_type, category, project_name, JSON.stringify(tags || []), is_featured || false, is_published || true, status || 'published']);

    const design = result.rows[0];
    res.status(201).json({
      id: design.id,
      title: design.title,
      image: getFullImageUrl(design.image_url),
      type: design.design_type,
      category: design.category,
      description: design.description,
      project: design.project_name,
      tags: design.tags,
      isFeatured: design.is_featured,
      createdAt: design.created_at
    });
  } catch (error) {
    console.error('Error creating design:', error);
    res.status(500).json({ error: 'Failed to create design' });
  }
});

// NEW: Create a new testimonial
router.post('/testimonials', async (req, res) => {
  try {
    const { name, role, organization, quote, project_name, image_url, rating, is_featured, is_published, status } = req.body;
    
    const result = await query(`
      INSERT INTO media_testimonials 
        (name, role, organization, quote, project_name, image_url, rating, is_featured, is_published, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [name, role, organization, quote, project_name, image_url, rating, is_featured || false, is_published || true, status || 'published']);

    const testimonial = result.rows[0];
    res.status(201).json({
      id: testimonial.id,
      name: testimonial.name,
      role: testimonial.role,
      organization: testimonial.organization,
      quote: testimonial.quote,
      project: testimonial.project_name,
      image: getFullImageUrl(testimonial.image_url),
      rating: testimonial.rating,
      isFeatured: testimonial.is_featured,
      createdAt: testimonial.created_at
    });
  } catch (error) {
    console.error('Error creating testimonial:', error);
    res.status(500).json({ error: 'Failed to create testimonial' });
  }
});

// NEW: Update media item (featured status, etc.)
router.put('/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const updates = req.body;
    
    let tableName;
    switch(type) {
      case 'photos':
        tableName = 'media_photos';
        break;
      case 'videos':
        tableName = 'media_videos';
        break;
      case 'designs':
        tableName = 'media_designs';
        break;
      case 'testimonials':
        tableName = 'media_testimonials';
        break;
      default:
        return res.status(400).json({ error: 'Invalid media type' });
    }

    // Build dynamic update query
    const setClauses = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      setClauses.push(`${key} = $${paramCount}`);
      values.push(updates[key]);
      paramCount++;
    });

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    
    const result = await query(`
      UPDATE ${tableName} 
      SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `${type.slice(0, -1)} not found` });
    }

    const updatedItem = result.rows[0];
    
    // Return the updated item with proper image URLs
    let response;
    switch(type) {
      case 'photos':
        response = {
          id: updatedItem.id,
          title: updatedItem.title,
          image: getFullImageUrl(updatedItem.image_url),
          category: updatedItem.category,
          description: updatedItem.description,
          album: updatedItem.album_name,
          tags: updatedItem.tags,
          isFeatured: updatedItem.is_featured,
          createdAt: updatedItem.created_at
        };
        break;
      case 'videos':
        response = {
          id: updatedItem.id,
          title: updatedItem.title,
          thumbnail: getFullImageUrl(updatedItem.thumbnail_url),
          duration: updatedItem.duration,
          videoSrc: getFullImageUrl(updatedItem.video_url),
          category: updatedItem.category,
          description: updatedItem.description,
          tags: updatedItem.tags,
          isFeatured: updatedItem.is_featured,
          createdAt: updatedItem.created_at
        };
        break;
      case 'designs':
        response = {
          id: updatedItem.id,
          title: updatedItem.title,
          image: getFullImageUrl(updatedItem.image_url),
          type: updatedItem.design_type,
          category: updatedItem.category,
          description: updatedItem.description,
          project: updatedItem.project_name,
          tags: updatedItem.tags,
          isFeatured: updatedItem.is_featured,
          createdAt: updatedItem.created_at
        };
        break;
      case 'testimonials':
        response = {
          id: updatedItem.id,
          name: updatedItem.name,
          role: updatedItem.role,
          organization: updatedItem.organization,
          quote: updatedItem.quote,
          project: updatedItem.project_name,
          image: getFullImageUrl(updatedItem.image_url),
          rating: updatedItem.rating,
          isFeatured: updatedItem.is_featured,
          createdAt: updatedItem.created_at
        };
        break;
    }

    res.json(response);
  } catch (error) {
    console.error('Error updating media item:', error);
    res.status(500).json({ error: 'Failed to update media item' });
  }
});

// NEW: Update testimonial status specifically
router.put('/testimonials/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const result = await query(`
      UPDATE media_testimonials 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }

    const testimonial = result.rows[0];
    res.json({
      id: testimonial.id,
      name: testimonial.name,
      role: testimonial.role,
      organization: testimonial.organization,
      quote: testimonial.quote,
      project: testimonial.project_name,
      image: getFullImageUrl(testimonial.image_url),
      rating: testimonial.rating,
      isFeatured: testimonial.is_featured,
      status: testimonial.status,
      createdAt: testimonial.created_at
    });
  } catch (error) {
    console.error('Error updating testimonial status:', error);
    res.status(500).json({ error: 'Failed to update testimonial status' });
  }
});

// NEW: Delete media item
router.delete('/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    
    let tableName;
    switch(type) {
      case 'photos':
        tableName = 'media_photos';
        break;
      case 'videos':
        tableName = 'media_videos';
        break;
      case 'designs':
        tableName = 'media_designs';
        break;
      case 'testimonials':
        tableName = 'media_testimonials';
        break;
      default:
        return res.status(400).json({ error: 'Invalid media type' });
    }

    const result = await query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING id`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `${type.slice(0, -1)} not found` });
    }

    res.json({ message: `${type.slice(0, -1)} deleted successfully` });
  } catch (error) {
    console.error('Error deleting media item:', error);
    res.status(500).json({ error: 'Failed to delete media item' });
  }
});

module.exports = router;