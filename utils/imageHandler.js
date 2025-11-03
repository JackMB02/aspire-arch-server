// Utility to convert files to base64 and handle image storage

/**
 * Convert file buffer to base64 data URL
 * @param {Buffer} buffer - File buffer
 * @param {string} mimetype - File mimetype (e.g., 'image/jpeg')
 * @returns {string} - Base64 data URL
 */
function bufferToBase64(buffer, mimetype) {
    if (!buffer) return null;
    const base64 = buffer.toString("base64");
    return `data:${mimetype};base64,${base64}`;
}

/**
 * Extract base64 data from data URL
 * @param {string} dataUrl - Base64 data URL
 * @returns {Object} - { data: string, mimetype: string }
 */
function parseBase64DataUrl(dataUrl) {
    if (!dataUrl || !dataUrl.startsWith("data:")) {
        return null;
    }

    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) return null;

    return {
        mimetype: matches[1],
        data: matches[2],
    };
}

/**
 * Check if value is a valid base64 data URL
 * @param {string} value - Value to check
 * @returns {boolean}
 */
function isBase64DataUrl(value) {
    if (!value || typeof value !== "string") return false;
    return value.startsWith("data:") && value.includes("base64,");
}

/**
 * Process multer file to base64
 * @param {Object} file - Multer file object
 * @returns {string|null} - Base64 data URL or null
 */
function processMulterFile(file) {
    if (!file || !file.buffer) return null;
    return bufferToBase64(file.buffer, file.mimetype);
}

/**
 * Get image from database or return as-is if already base64
 * @param {string} imageData - Image URL or base64 string
 * @returns {string} - Image data
 */
function getImageData(imageData) {
    if (!imageData) return null;

    // If it's already a base64 data URL, return it
    if (isBase64DataUrl(imageData)) {
        return imageData;
    }

    // If it's a relative path (old system), return null
    // Frontend should handle missing images gracefully
    if (imageData.startsWith("/uploads/") || imageData.startsWith("/images/")) {
        return null;
    }

    return imageData;
}

module.exports = {
    bufferToBase64,
    parseBase64DataUrl,
    isBase64DataUrl,
    processMulterFile,
    getImageData,
};
