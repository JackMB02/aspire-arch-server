const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { processMulterFile } = require("../utils/imageHandler");

// Use memory storage instead of disk storage (for Render compatibility)
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

// Helper function to get file URL
const getFileUrl = (filePath) => {
    // Extract the path relative to the uploads directory
    const relativePath = filePath.replace(uploadsDir, "").replace(/\\/g, "/");
    return `/uploads${relativePath}`;
};

// Enhanced single file upload
router.post("/", upload.single("file"), (req, res) => {
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

        const fileUrl = getFileUrl(req.file.path);

        console.log("✅ File uploaded successfully:", {
            filename: req.file.filename,
            originalname: req.file.originalname,
            size: (req.file.size / 1024 / 1024).toFixed(2) + " MB",
            url: fileUrl,
        });

        res.json({
            success: true,
            message: "File uploaded successfully",
            fileUrl: fileUrl,
            fileName: req.file.filename,
            originalName: req.file.originalname,
            fileSize: req.file.size,
            fileSizeMB: (req.file.size / 1024 / 1024).toFixed(2),
            mimeType: req.file.mimetype,
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

// Multiple files upload
router.post("/multiple", upload.array("files", 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: "No files uploaded. Please select files to upload.",
            });
        }

        console.log(`✅ Uploaded ${req.files.length} files successfully`);

        const uploadResults = req.files.map((file) => ({
            fileUrl: getFileUrl(file.path),
            fileName: file.filename,
            originalName: file.originalname,
            fileSize: file.size,
            fileSizeMB: (file.size / 1024 / 1024).toFixed(2),
            mimeType: file.mimetype,
        }));

        res.json({
            success: true,
            message: `${req.files.length} files uploaded successfully`,
            files: uploadResults,
            totalSize: req.files.reduce((total, file) => total + file.size, 0),
            totalSizeMB: (
                req.files.reduce((total, file) => total + file.size, 0) /
                1024 /
                1024
            ).toFixed(2),
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
        const uploadsExist = fs.existsSync(uploadsDir);
        const subDirs = ["images", "videos", "documents", "general"];
        const dirStats = {};

        subDirs.forEach((dir) => {
            const dirPath = path.join(uploadsDir, dir);
            dirStats[dir] = {
                exists: fs.existsSync(dirPath),
                fileCount: 0,
            };

            if (dirStats[dir].exists) {
                try {
                    const files = fs.readdirSync(dirPath);
                    dirStats[dir].fileCount = files.length;
                } catch (err) {
                    dirStats[dir].fileCount = "Error reading directory";
                }
            }
        });

        res.json({
            success: true,
            message: "Upload system is working",
            uploadsDirectory: uploadsDir,
            uploadsDirectoryExists: uploadsExist,
            directories: dirStats,
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
        const stats = {
            totalFiles: 0,
            totalSize: 0,
            byType: {
                images: { count: 0, size: 0 },
                videos: { count: 0, size: 0 },
                documents: { count: 0, size: 0 },
                general: { count: 0, size: 0 },
            },
        };

        const scanDirectory = (dirPath, type) => {
            if (fs.existsSync(dirPath)) {
                const files = fs.readdirSync(dirPath);
                stats.byType[type].count = files.length;

                files.forEach((file) => {
                    const filePath = path.join(dirPath, file);
                    try {
                        const fileStat = fs.statSync(filePath);
                        stats.byType[type].size += fileStat.size;
                        stats.totalSize += fileStat.size;
                        stats.totalFiles++;
                    } catch (err) {
                        console.warn(`Could not stat file: ${filePath}`);
                    }
                });
            }
        };

        // Scan all directories
        scanDirectory(path.join(uploadsDir, "images"), "images");
        scanDirectory(path.join(uploadsDir, "videos"), "videos");
        scanDirectory(path.join(uploadsDir, "documents"), "documents");
        scanDirectory(path.join(uploadsDir, "general"), "general");

        // Convert sizes to human readable format
        stats.totalSizeMB = (stats.totalSize / (1024 * 1024)).toFixed(2);
        Object.keys(stats.byType).forEach((type) => {
            stats.byType[type].sizeMB = (
                stats.byType[type].size /
                (1024 * 1024)
            ).toFixed(2);
        });

        res.json({
            success: true,
            ...stats,
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
