const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Check for required Cloudinary credentials
const hasCloudinaryCredentials = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Log configuration status
if (!hasCloudinaryCredentials()) {
  console.warn('⚠️  WARNING: Cloudinary credentials not configured!');
  console.warn('   Please add the following to your .env file:');
  console.warn('   CLOUDINARY_CLOUD_NAME=your_cloud_name');
  console.warn('   CLOUDINARY_API_KEY=your_api_key');
  console.warn('   CLOUDINARY_API_SECRET=your_api_secret');
} else {
  console.log('✅ Cloudinary configured successfully');
}

/**
 * Upload file buffer to Cloudinary
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadToCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    // Check if credentials are configured
    if (!hasCloudinaryCredentials()) {
      return reject(new Error(
        'Cloudinary credentials not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env file.'
      ));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'aspire-arch',
        resource_type: options.resource_type || 'auto',
        transformation: options.transformation || [],
        quality: options.quality || 'auto',
        fetch_format: 'auto',
        ...options
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('✅ Cloudinary upload successful:', result.secure_url);
          resolve(result);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete file from Cloudinary
 * @param {String} publicId - Cloudinary public ID
 * @param {String} resourceType - Resource type (image, video, raw)
 * @returns {Promise<Object>} Deletion result
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    console.log('✅ Cloudinary delete successful:', publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Get Cloudinary URL with transformations
 * @param {String} publicId - Cloudinary public ID
 * @param {Object} options - Transformation options
 * @returns {String} Transformed URL
 */
const getCloudinaryUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    secure: true,
    ...options
  });
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  getCloudinaryUrl,
  hasCloudinaryCredentials
};
