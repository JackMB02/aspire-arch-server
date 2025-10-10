const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    
    // Create more organized filenames based on file type
    let prefix = 'file';
    if (file.mimetype.startsWith('image/')) {
      prefix = 'image';
    } else if (file.mimetype.startsWith('video/')) {
      prefix = 'video';
    }
    
    cb(null, `${prefix}-${uniqueSuffix}${extension}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'image/jpeg': true,
    'image/jpg': true,
    'image/png': true,
    'image/gif': true,
    'image/webp': true,
    'video/mp4': true,
    'video/webm': true,
    'video/quicktime': true
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM, MOV) are allowed.`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  },
  fileFilter: fileFilter
});

// Helper function to construct full URL
const getFullUrl = (filePath) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
  return `${baseUrl}${filePath}`;
};

// Upload endpoint
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File uploaded successfully:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });

    // Generate both relative and full URLs for the uploaded file
    const relativeUrl = `/uploads/${req.file.filename}`;
    const fullUrl = getFullUrl(relativeUrl);

    res.json({
      message: 'File uploaded successfully',
      fileUrl: fullUrl, // Return full URL for frontend
      relativeUrl: relativeUrl, // Also return relative URL for database storage
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      mimetype: req.file.mimetype,
      uploadTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file: ' + error.message });
  }
});

// Multiple file upload endpoint
router.post('/multiple', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    console.log(`Uploaded ${req.files.length} files successfully`);

    const uploadResults = req.files.map(file => {
      const relativeUrl = `/uploads/${file.filename}`;
      const fullUrl = getFullUrl(relativeUrl);

      return {
        fileUrl: fullUrl,
        relativeUrl: relativeUrl,
        fileName: file.filename,
        originalName: file.originalname,
        fileSize: file.size,
        mimetype: file.mimetype
      };
    });

    res.json({
      message: `${req.files.length} files uploaded successfully`,
      files: uploadResults,
      totalSize: req.files.reduce((total, file) => total + file.size, 0),
      uploadTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({ error: 'Failed to upload files: ' + error.message });
  }
});

// Get upload statistics
router.get('/stats', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    const stats = {
      totalFiles: files.length,
      totalSize: 0,
      byType: {
        images: 0,
        videos: 0,
        others: 0
      }
    };

    files.forEach(file => {
      const filePath = path.join(uploadsDir, file);
      const fileStat = fs.statSync(filePath);
      stats.totalSize += fileStat.size;

      // Categorize by file extension
      const ext = path.extname(file).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
        stats.byType.images++;
      } else if (['.mp4', '.webm', '.mov'].includes(ext)) {
        stats.byType.videos++;
      } else {
        stats.byType.others++;
      }
    });

    // Convert size to human readable format
    stats.totalSizeMB = (stats.totalSize / (1024 * 1024)).toFixed(2);

    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get upload statistics' });
  }
});

// List uploaded files
router.get('/files', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    
    const fileList = files.map(file => {
      const filePath = path.join(uploadsDir, file);
      const fileStat = fs.statSync(filePath);
      const relativeUrl = `/uploads/${file}`;
      const fullUrl = getFullUrl(relativeUrl);

      return {
        name: file,
        url: fullUrl,
        relativeUrl: relativeUrl,
        size: fileStat.size,
        sizeMB: (fileStat.size / (1024 * 1024)).toFixed(2),
        modified: fileStat.mtime,
        created: fileStat.birthtime
      };
    });

    // Sort by modification time (newest first)
    fileList.sort((a, b) => new Date(b.modified) - new Date(a.modified));

    res.json({
      files: fileList,
      total: fileList.length
    });
  } catch (error) {
    console.error('File list error:', error);
    res.status(500).json({ error: 'Failed to list uploaded files' });
  }
});

// Delete uploaded file
router.delete('/files/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    
    // Security check: prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filePath = path.join(uploadsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    fs.unlinkSync(filePath);
    
    res.json({
      message: 'File deleted successfully',
      deletedFile: filename
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete file: ' + error.message });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File too large. Maximum size is 50MB.',
        details: 'Please upload a smaller file or compress your media.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        error: 'Too many files.',
        details: 'Maximum 10 files allowed per upload.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        error: 'Unexpected file field.',
        details: 'Please use the correct field name for file uploads.'
      });
    }
  }
  
  console.error('Upload route error:', error);
  res.status(400).json({ 
    error: 'Upload failed',
    details: error.message 
  });
});

module.exports = router;