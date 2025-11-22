const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { uploadToCloudinary } = require("../config/cloudinary");

// Use memory storage (required for Cloudinary uploads)
const storage = multer.memoryStorage();

// Enhanced file filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = {
        // Images
        "image/jpeg": true,
        "image/jpg": true,
        "image/png": true,
        "image/gif": true,
        "image/webp": true,
        "image/svg+xml": true,

        // Videos
        "video/mp4": true,
        "video/webm": true,
        "video/ogg": true,
        "video/quicktime": true,

        // Documents
        "application/pdf": true,
        "application/msword": true,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
        "application/vnd.ms-excel": true,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": true,
        "application/vnd.ms-powerpoint": true,
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": true,
        "text/plain": true,
    };

    if (allowedTypes[file.mimetype]) {
        cb(null, true);
    } else {
        cb(
            new Error(
                `File type '${file.mimetype}' is not supported. Please upload images, videos, or documents.`
            ),
            false
        );
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max file size
        files: 10, // Max 10 files
    },
    fileFilter: fileFilter,
});

// Enhanced single file upload with Cloudinary
router.post("/", upload.single("file"), async (req, res) => {
    try {
        console.log("📤 Upload request received:", {
            hasFile: !!req.file,
            fieldName: req.file?.fieldname,
            originalName: req.file?.originalname,
            fileType: req.file?.mimetype,
            uploadType: req.body.type || "general",
        });

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "No file uploaded. Please select a file to upload.",
            });
        }

        // Determine folder based on upload type
        const uploadType = req.body.type || "general";
        const folder = `aspire-arch/${uploadType}`;

        // Determine resource type
        let resourceType = 'auto';
        if (req.file.mimetype.startsWith('video/')) {
            resourceType = 'video';
        } else if (req.file.mimetype.startsWith('image/')) {
            resourceType = 'image';
        } else {
            resourceType = 'raw'; // For documents
        }

        // Upload to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer, {
            folder: folder,
            resource_type: resourceType,
            public_id: `${Date.now()}-${req.file.originalname.replace(/\.[^/.]+$/, "")}`,
        });

        console.log("✅ File uploaded to Cloudinary:", {
            url: result.secure_url,
            publicId: result.public_id,
            size: (result.bytes / 1024 / 1024).toFixed(2) + " MB",
        });

        res.json({
            success: true,
            message: "File uploaded successfully to Cloudinary",
            fileUrl: result.secure_url,
            publicId: result.public_id,
            originalName: req.file.originalname,
            fileSize: result.bytes,
            fileSizeMB: (result.bytes / 1024 / 1024).toFixed(2),
            mimeType: req.file.mimetype,
            resourceType: result.resource_type,
            format: result.format,
            width: result.width,
            height: result.height,
            uploadDate: new Date().toISOString(),
        });
    } catch (error) {
        console.error("❌ Upload error:", error);
        res.status(500).json({
            success: false,
            error: "Upload failed: " + error.message,
        });
    }
});

// Multiple files upload with Cloudinary
router.post("/multiple", upload.array("files", 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: "No files uploaded. Please select files to upload.",
            });
        }

        const uploadType = req.body.type || "general";
        const folder = `aspire-arch/${uploadType}`;

        // Upload all files to Cloudinary in parallel
        const uploadPromises = req.files.map(async (file) => {
            let resourceType = 'auto';
            if (file.mimetype.startsWith('video/')) {
                resourceType = 'video';
            } else if (file.mimetype.startsWith('image/')) {
                resourceType = 'image';
            } else {
                resourceType = 'raw';
            }

            const result = await uploadToCloudinary(file.buffer, {
                folder: folder,
                resource_type: resourceType,
                public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, "")}`,
            });

            return {
                fileUrl: result.secure_url,
                publicId: result.public_id,
                originalName: file.originalname,
                fileSize: result.bytes,
                fileSizeMB: (result.bytes / 1024 / 1024).toFixed(2),
                mimeType: file.mimetype,
                resourceType: result.resource_type,
                format: result.format,
                width: result.width,
                height: result.height,
            };
        });

        const uploadResults = await Promise.all(uploadPromises);

        console.log(`✅ Uploaded ${req.files.length} files to Cloudinary successfully`);

        const totalSize = uploadResults.reduce((total, file) => total + parseInt(file.fileSize), 0);

        res.json({
            success: true,
            message: `${req.files.length} files uploaded successfully to Cloudinary`,
            files: uploadResults,
            totalFiles: req.files.length,
            totalSize: totalSize,
            totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
        });
    } catch (error) {
        console.error("❌ Multiple upload error:", error);
        res.status(500).json({
            success: false,
            error: "Upload failed: " + error.message,
        });
    }
});

// Test endpoint to verify upload functionality
router.get("/test", (req, res) => {
    try {
        res.json({
            success: true,
            message: "Upload system is working with Cloudinary",
            storageType: "cloudinary",
            maxFileSize: "100MB",
            maxFiles: 10,
            supportedTypes: {
                images: ["jpeg", "jpg", "png", "gif", "webp", "svg"],
                videos: ["mp4", "webm", "ogg", "quicktime"],
                documents: [
                    "pdf",
                    "doc",
                    "docx",
                    "xls",
                    "xlsx",
                    "ppt",
                    "pptx",
                    "txt",
                ],
            },
            serverTime: new Date().toISOString(),
        });
    } catch (error) {
        console.error("❌ Upload test error:", error);
        res.status(500).json({
            success: false,
            error: "Upload test failed: " + error.message,
        });
    }
});

// Get upload statistics
router.get("/stats", (req, res) => {
    try {
        res.json({
            success: true,
            message: "Upload statistics",
            note: "Files are stored on Cloudinary CDN, not locally",
            storageType: "cloudinary",
            maxFileSize: "100MB",
            maxFiles: 10,
        });
    } catch (error) {
        console.error("❌ Stats error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to get upload statistics: " + error.message,
        });
    }
});

// Enhanced error handling middleware
router.use((error, req, res, next) => {
    console.error("🛑 Upload middleware error:", error);

    if (error instanceof multer.MulterError) {
        let message = "Upload error occurred";

        switch (error.code) {
            case "LIMIT_FILE_SIZE":
                message = "File too large. Maximum size is 100MB.";
                break;
            case "LIMIT_FILE_COUNT":
                message =
                    "Too many files. Maximum 10 files allowed per upload.";
                break;
            case "LIMIT_UNEXPECTED_FILE":
                message =
                    "Unexpected file field. Please check your file input names.";
                break;
            case "LIMIT_PART_COUNT":
                message = "Too many form parts.";
                break;
            default:
                message = `Upload error: ${error.code}`;
        }

        return res.status(400).json({
            success: false,
            error: message,
            code: error.code,
        });
    }

    // Handle other errors
    res.status(400).json({
        success: false,
        error: error.message || "Upload failed",
    });
});

module.exports = router;
