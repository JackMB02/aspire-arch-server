const express = require("express");
const router = express.Router();
const { query } = require("../db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = "uploads/education";
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(
            null,
            file.fieldname +
                "-" +
                uniqueSuffix +
                path.extname(file.originalname)
        );
    },
});

const fileFilter = (req, file, cb) => {
    // Allow specific file types
    const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "video/mp4",
        "video/mpeg",
        "video/quicktime",
        "image/jpeg",
        "image/png",
        "image/gif",
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                "Invalid file type. Only PDF, Word, PowerPoint, Video, and Image files are allowed."
            ),
            false
        );
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
});

// Helper function to construct proper file URLs
const getFullFileUrl = (filePath) => {
    if (!filePath) return null;

    // If it's already a full URL, return as is
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
        return filePath;
    }

    // For relative paths, construct full URL
    const baseUrl = process.env.BASE_URL || "http://localhost:4000";
    return `${baseUrl}${filePath.startsWith("/") ? "" : "/"}${filePath}`;
};

// Get all workshops
router.get("/workshops", async (req, res) => {
    try {
        const result = await query(
            `
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
    `,
            ["published"]
        );

        const workshops = result.rows.map((workshop) => ({
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
            updatedAt: workshop.updated_at,
        }));

        res.json(workshops);
    } catch (error) {
        console.error("Error fetching workshops:", error);
        res.status(500).json({ error: "Failed to fetch workshops" });
    }
});

// Get all tutorials
router.get("/tutorials", async (req, res) => {
    try {
        const result = await query(
            `
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
    `,
            ["published"]
        );

        const tutorials = result.rows.map((tutorial) => ({
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
            updatedAt: tutorial.updated_at,
        }));

        res.json(tutorials);
    } catch (error) {
        console.error("Error fetching tutorials:", error);
        res.status(500).json({ error: "Failed to fetch tutorials" });
    }
});

// Get all exhibitions
router.get("/exhibitions", async (req, res) => {
    try {
        const result = await query(
            `
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
    `,
            ["published"]
        );

        const exhibitions = result.rows.map((exhibition) => ({
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
            updatedAt: exhibition.updated_at,
        }));

        res.json(exhibitions);
    } catch (error) {
        console.error("Error fetching exhibitions:", error);
        res.status(500).json({ error: "Failed to fetch exhibitions" });
    }
});

// Get education stats
router.get("/stats", async (req, res) => {
    try {
        const workshopsResult = await query(
            "SELECT COUNT(*) FROM education_workshops WHERE is_published = true AND status = $1",
            ["published"]
        );
        const tutorialsResult = await query(
            "SELECT COUNT(*) FROM education_tutorials WHERE is_published = true AND status = $1",
            ["published"]
        );
        const exhibitionsResult = await query(
            "SELECT COUNT(*) FROM education_exhibitions WHERE is_published = true AND status = $1",
            ["published"]
        );
        const instructorsResult = await query(
            "SELECT COUNT(DISTINCT instructor) FROM education_workshops WHERE is_published = true AND status = $1",
            ["published"]
        );

        const stats = {
            workshops: parseInt(workshopsResult.rows[0].count),
            tutorials: parseInt(tutorialsResult.rows[0].count),
            exhibitions: parseInt(exhibitionsResult.rows[0].count),
            instructors: parseInt(instructorsResult.rows[0].count),
        };

        res.json(stats);
    } catch (error) {
        console.error("Error fetching education stats:", error);
        res.status(500).json({ error: "Failed to fetch education statistics" });
    }
});

// ADMIN ROUTES - Create new workshop
router.post(
    "/workshops",
    upload.fields([
        { name: "image", maxCount: 1 },
        { name: "document", maxCount: 1 },
        { name: "video", maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            const {
                title,
                description,
                tag,
                duration,
                date,
                instructor,
                instructor_bio,
                instructorBio, // Accept camelCase from frontend
                price,
                capacity,
                location,
                is_featured,
                isFeatured, // Accept camelCase from frontend
                is_published,
                isPublished, // Accept camelCase from frontend
                status,
            } = req.body;

            // Use either snake_case or camelCase, preferring the one that's provided
            const instructorBioValue = instructor_bio || instructorBio;
            const featured =
                is_featured !== undefined ? is_featured : isFeatured;
            const published =
                is_published !== undefined ? is_published : isPublished;

            const imageFile = req.files?.image ? req.files.image[0] : null;
            const documentFile = req.files?.document
                ? req.files.document[0]
                : null;
            const videoFile = req.files?.video ? req.files.video[0] : null;

            const result = await query(
                `
      INSERT INTO education_workshops 
        (title, description, tag, duration, date, instructor, instructor_bio, price, capacity, location, 
         image_url, document_url, video_url, is_featured, is_published, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `,
                [
                    title,
                    description || "",
                    tag || "Architecture",
                    duration || "2 hours",
                    date || new Date().toISOString(),
                    instructor || "ASPIRE Team",
                    instructorBioValue || "",
                    price || 0,
                    capacity || 0,
                    location || "TBD",
                    imageFile
                        ? `/uploads/education/${imageFile.filename}`
                        : null,
                    documentFile
                        ? `/uploads/education/${documentFile.filename}`
                        : null,
                    videoFile
                        ? `/uploads/education/${videoFile.filename}`
                        : null,
                    featured || false,
                    published !== undefined ? published : true,
                    status || "published",
                ]
            );

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
                instructor_bio: workshop.instructor_bio,
                price: workshop.price,
                capacity: workshop.capacity,
                location: workshop.location,
                image: getFullFileUrl(workshop.image_url),
                image_url: getFullFileUrl(workshop.image_url),
                document: getFullFileUrl(workshop.document_url),
                document_url: getFullFileUrl(workshop.document_url),
                video: getFullFileUrl(workshop.video_url),
                video_url: getFullFileUrl(workshop.video_url),
                isFeatured: workshop.is_featured,
                is_featured: workshop.is_featured,
                isPublished: workshop.is_published,
                is_published: workshop.is_published,
                status: workshop.status,
                createdAt: workshop.created_at,
                created_at: workshop.created_at,
            });
        } catch (error) {
            console.error("Error creating workshop:", error);
            res.status(500).json({
                error: "Failed to create workshop",
                details: error.message,
            });
        }
    }
);

// ADMIN ROUTES - Create new tutorial
router.post(
    "/tutorials",
    upload.fields([
        { name: "document", maxCount: 1 },
        { name: "video", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            const {
                title,
                description,
                category,
                level,
                format,
                duration,
                is_featured,
                isFeatured, // Accept camelCase from frontend
                is_published,
                isPublished, // Accept camelCase from frontend
                status,
            } = req.body;

            // Use either snake_case or camelCase, preferring the one that's provided
            const featured =
                is_featured !== undefined ? is_featured : isFeatured;
            const published =
                is_published !== undefined ? is_published : isPublished;

            const documentFile = req.files?.document
                ? req.files.document[0]
                : null;
            const videoFile = req.files?.video ? req.files.video[0] : null;
            const thumbnailFile = req.files?.thumbnail
                ? req.files.thumbnail[0]
                : null;

            const result = await query(
                `
      INSERT INTO education_tutorials 
        (title, description, category, level, format, duration, 
         document_url, video_url, thumbnail_url, is_featured, is_published, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `,
                [
                    title,
                    description || "",
                    category || "Architecture",
                    level || "Beginner",
                    format || "Video",
                    duration || "30 min",
                    documentFile
                        ? `/uploads/education/${documentFile.filename}`
                        : null,
                    videoFile
                        ? `/uploads/education/${videoFile.filename}`
                        : null,
                    thumbnailFile
                        ? `/uploads/education/${thumbnailFile.filename}`
                        : null,
                    featured || false,
                    published !== undefined ? published : true,
                    status || "published",
                ]
            );

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
                document_url: getFullFileUrl(tutorial.document_url),
                video: getFullFileUrl(tutorial.video_url),
                video_url: getFullFileUrl(tutorial.video_url),
                thumbnail: getFullFileUrl(tutorial.thumbnail_url),
                thumbnail_url: getFullFileUrl(tutorial.thumbnail_url),
                isFeatured: tutorial.is_featured,
                is_featured: tutorial.is_featured,
                isPublished: tutorial.is_published,
                is_published: tutorial.is_published,
                status: tutorial.status,
                createdAt: tutorial.created_at,
                created_at: tutorial.created_at,
            });
        } catch (error) {
            console.error("Error creating tutorial:", error);
            res.status(500).json({
                error: "Failed to create tutorial",
                details: error.message,
            });
        }
    }
);

// ADMIN ROUTES - Create new exhibition
router.post(
    "/exhibitions",
    upload.fields([
        { name: "image", maxCount: 1 },
        { name: "brochure", maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            const {
                title,
                description,
                start_date,
                startDate, // Accept camelCase from frontend
                end_date,
                endDate, // Accept camelCase from frontend
                location,
                curator,
                curator_bio,
                curatorBio, // Accept camelCase from frontend
                virtual_tour_url,
                virtualTourUrl, // Accept camelCase from frontend
                is_featured,
                isFeatured, // Accept camelCase from frontend
                is_published,
                isPublished, // Accept camelCase from frontend
                status,
            } = req.body;

            // Use either snake_case or camelCase, preferring the one that's provided
            const startDateValue = start_date || startDate;
            const endDateValue = end_date || endDate;
            const curatorBioValue = curator_bio || curatorBio;
            const virtualTourValue = virtual_tour_url || virtualTourUrl;
            const featured =
                is_featured !== undefined ? is_featured : isFeatured;
            const published =
                is_published !== undefined ? is_published : isPublished;

            const imageFile = req.files?.image ? req.files.image[0] : null;
            const brochureFile = req.files?.brochure
                ? req.files.brochure[0]
                : null;

            const result = await query(
                `
      INSERT INTO education_exhibitions 
        (title, description, start_date, end_date, location, curator, curator_bio, 
         image_url, brochure_url, virtual_tour_url, is_featured, is_published, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `,
                [
                    title,
                    description || "",
                    startDateValue || new Date().toISOString(),
                    endDateValue || new Date().toISOString(),
                    location || "TBD",
                    curator || "ASPIRE Team",
                    curatorBioValue || "",
                    imageFile
                        ? `/uploads/education/${imageFile.filename}`
                        : null,
                    brochureFile
                        ? `/uploads/education/${brochureFile.filename}`
                        : null,
                    virtualTourValue || null,
                    featured || false,
                    published !== undefined ? published : true,
                    status || "published",
                ]
            );

            const exhibition = result.rows[0];
            res.status(201).json({
                id: exhibition.id,
                title: exhibition.title,
                description: exhibition.description,
                startDate: exhibition.start_date,
                start_date: exhibition.start_date,
                endDate: exhibition.end_date,
                end_date: exhibition.end_date,
                location: exhibition.location,
                curator: exhibition.curator,
                curatorBio: exhibition.curator_bio,
                curator_bio: exhibition.curator_bio,
                image: getFullFileUrl(exhibition.image_url),
                image_url: getFullFileUrl(exhibition.image_url),
                brochure: getFullFileUrl(exhibition.brochure_url),
                brochure_url: getFullFileUrl(exhibition.brochure_url),
                virtualTour: getFullFileUrl(exhibition.virtual_tour_url),
                virtualTourUrl: getFullFileUrl(exhibition.virtual_tour_url),
                virtual_tour_url: getFullFileUrl(exhibition.virtual_tour_url),
                isFeatured: exhibition.is_featured,
                is_featured: exhibition.is_featured,
                isPublished: exhibition.is_published,
                is_published: exhibition.is_published,
                status: exhibition.status,
                createdAt: exhibition.created_at,
                created_at: exhibition.created_at,
            });
        } catch (error) {
            console.error("Error creating exhibition:", error);
            res.status(500).json({
                error: "Failed to create exhibition",
                details: error.message,
            });
        }
    }
);

// ADMIN ROUTES - Update workshop
router.put(
    "/workshops/:id",
    upload.fields([
        { name: "image", maxCount: 1 },
        { name: "document", maxCount: 1 },
        { name: "video", maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            const { id } = req.params;
            const {
                title,
                description,
                tag,
                duration,
                date,
                instructor,
                instructor_bio,
                instructorBio,
                price,
                capacity,
                enrolled_count,
                enrolledCount,
                location,
                is_featured,
                isFeatured,
                is_published,
                isPublished,
                status,
            } = req.body;

            const instructorBioValue = instructor_bio || instructorBio;
            const enrolledCountValue = enrolled_count || enrolledCount;
            const featured =
                is_featured !== undefined ? is_featured : isFeatured;
            const published =
                is_published !== undefined ? is_published : isPublished;

            // Handle file updates
            const imageFile = req.files?.image ? req.files.image[0] : null;
            const documentFile = req.files?.document
                ? req.files.document[0]
                : null;
            const videoFile = req.files?.video ? req.files.video[0] : null;

            let updateQuery = `UPDATE education_workshops SET `;
            const values = [];
            let paramCount = 1;

            if (title) {
                updateQuery += `title = $${paramCount}, `;
                values.push(title);
                paramCount++;
            }
            if (description) {
                updateQuery += `description = $${paramCount}, `;
                values.push(description);
                paramCount++;
            }
            if (tag) {
                updateQuery += `tag = $${paramCount}, `;
                values.push(tag);
                paramCount++;
            }
            if (duration) {
                updateQuery += `duration = $${paramCount}, `;
                values.push(duration);
                paramCount++;
            }
            if (date) {
                updateQuery += `date = $${paramCount}, `;
                values.push(date);
                paramCount++;
            }
            if (instructor) {
                updateQuery += `instructor = $${paramCount}, `;
                values.push(instructor);
                paramCount++;
            }
            if (instructorBioValue) {
                updateQuery += `instructor_bio = $${paramCount}, `;
                values.push(instructorBioValue);
                paramCount++;
            }
            if (price) {
                updateQuery += `price = $${paramCount}, `;
                values.push(price);
                paramCount++;
            }
            if (capacity) {
                updateQuery += `capacity = $${paramCount}, `;
                values.push(capacity);
                paramCount++;
            }
            if (enrolledCountValue) {
                updateQuery += `enrolled_count = $${paramCount}, `;
                values.push(enrolledCountValue);
                paramCount++;
            }
            if (location) {
                updateQuery += `location = $${paramCount}, `;
                values.push(location);
                paramCount++;
            }
            if (imageFile) {
                updateQuery += `image_url = $${paramCount}, `;
                values.push(`/uploads/education/${imageFile.filename}`);
                paramCount++;
            }
            if (documentFile) {
                updateQuery += `document_url = $${paramCount}, `;
                values.push(`/uploads/education/${documentFile.filename}`);
                paramCount++;
            }
            if (videoFile) {
                updateQuery += `video_url = $${paramCount}, `;
                values.push(`/uploads/education/${videoFile.filename}`);
                paramCount++;
            }
            if (featured !== undefined) {
                updateQuery += `is_featured = $${paramCount}, `;
                values.push(featured);
                paramCount++;
            }
            if (published !== undefined) {
                updateQuery += `is_published = $${paramCount}, `;
                values.push(published);
                paramCount++;
            }
            if (status) {
                updateQuery += `status = $${paramCount}, `;
                values.push(status);
                paramCount++;
            }

            updateQuery += `updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
            values.push(id);

            const result = await query(updateQuery, values);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: "Workshop not found" });
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
                enrolledCount: workshop.enrolled_count,
                location: workshop.location,
                image: getFullFileUrl(workshop.image_url),
                document: getFullFileUrl(workshop.document_url),
                video: getFullFileUrl(workshop.video_url),
                isFeatured: workshop.is_featured,
                isPublished: workshop.is_published,
                status: workshop.status,
                createdAt: workshop.created_at,
                updatedAt: workshop.updated_at,
            });
        } catch (error) {
            console.error("Error updating workshop:", error);
            res.status(500).json({ error: "Failed to update workshop" });
        }
    }
);

// ADMIN ROUTES - Delete workshop
router.delete("/workshops/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            "DELETE FROM education_workshops WHERE id = $1 RETURNING id",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Workshop not found" });
        }

        res.json({ message: "Workshop deleted successfully" });
    } catch (error) {
        console.error("Error deleting workshop:", error);
        res.status(500).json({ error: "Failed to delete workshop" });
    }
});

// ADMIN ROUTES - Get all workshops (including unpublished)
router.get("/admin/workshops", async (req, res) => {
    try {
        const result = await query(`
      SELECT * FROM education_workshops 
      ORDER BY created_at DESC
    `);

        const workshops = result.rows.map((workshop) => ({
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
            updatedAt: workshop.updated_at,
        }));

        res.json(workshops);
    } catch (error) {
        console.error("Error fetching workshops for admin:", error);
        res.status(500).json({ error: "Failed to fetch workshops" });
    }
});

// ADMIN ROUTES - Update tutorial
router.put(
    "/tutorials/:id",
    upload.fields([
        { name: "document", maxCount: 1 },
        { name: "video", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            const { id } = req.params;
            const {
                title,
                description,
                category,
                level,
                format,
                duration,
                is_featured,
                isFeatured,
                is_published,
                isPublished,
                status,
            } = req.body;

            const featured =
                is_featured !== undefined ? is_featured : isFeatured;
            const published =
                is_published !== undefined ? is_published : isPublished;

            const documentFile = req.files?.document
                ? req.files.document[0]
                : null;
            const videoFile = req.files?.video ? req.files.video[0] : null;
            const thumbnailFile = req.files?.thumbnail
                ? req.files.thumbnail[0]
                : null;

            let updateQuery = `UPDATE education_tutorials SET `;
            const values = [];
            let paramCount = 1;

            if (title) {
                updateQuery += `title = $${paramCount}, `;
                values.push(title);
                paramCount++;
            }
            if (description) {
                updateQuery += `description = $${paramCount}, `;
                values.push(description);
                paramCount++;
            }
            if (category) {
                updateQuery += `category = $${paramCount}, `;
                values.push(category);
                paramCount++;
            }
            if (level) {
                updateQuery += `level = $${paramCount}, `;
                values.push(level);
                paramCount++;
            }
            if (format) {
                updateQuery += `format = $${paramCount}, `;
                values.push(format);
                paramCount++;
            }
            if (duration) {
                updateQuery += `duration = $${paramCount}, `;
                values.push(duration);
                paramCount++;
            }
            if (documentFile) {
                updateQuery += `document_url = $${paramCount}, `;
                values.push(`/uploads/education/${documentFile.filename}`);
                paramCount++;
            }
            if (videoFile) {
                updateQuery += `video_url = $${paramCount}, `;
                values.push(`/uploads/education/${videoFile.filename}`);
                paramCount++;
            }
            if (thumbnailFile) {
                updateQuery += `thumbnail_url = $${paramCount}, `;
                values.push(`/uploads/education/${thumbnailFile.filename}`);
                paramCount++;
            }
            if (featured !== undefined) {
                updateQuery += `is_featured = $${paramCount}, `;
                values.push(featured);
                paramCount++;
            }
            if (published !== undefined) {
                updateQuery += `is_published = $${paramCount}, `;
                values.push(published);
                paramCount++;
            }
            if (status) {
                updateQuery += `status = $${paramCount}, `;
                values.push(status);
                paramCount++;
            }

            updateQuery += `updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
            values.push(id);

            const result = await query(updateQuery, values);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: "Tutorial not found" });
            }

            const tutorial = result.rows[0];
            res.json({
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
                createdAt: tutorial.created_at,
                updatedAt: tutorial.updated_at,
            });
        } catch (error) {
            console.error("Error updating tutorial:", error);
            res.status(500).json({ error: "Failed to update tutorial" });
        }
    }
);

// ADMIN ROUTES - Delete tutorial
router.delete("/tutorials/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            "DELETE FROM education_tutorials WHERE id = $1 RETURNING id",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Tutorial not found" });
        }

        res.json({ message: "Tutorial deleted successfully" });
    } catch (error) {
        console.error("Error deleting tutorial:", error);
        res.status(500).json({ error: "Failed to delete tutorial" });
    }
});

// ADMIN ROUTES - Update exhibition
router.put(
    "/exhibitions/:id",
    upload.fields([
        { name: "image", maxCount: 1 },
        { name: "brochure", maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            const { id } = req.params;
            const {
                title,
                description,
                start_date,
                startDate,
                end_date,
                endDate,
                location,
                curator,
                curator_bio,
                curatorBio,
                virtual_tour_url,
                virtualTourUrl,
                is_featured,
                isFeatured,
                is_published,
                isPublished,
                status,
            } = req.body;

            const startDateValue = start_date || startDate;
            const endDateValue = end_date || endDate;
            const curatorBioValue = curator_bio || curatorBio;
            const virtualTourValue = virtual_tour_url || virtualTourUrl;
            const featured =
                is_featured !== undefined ? is_featured : isFeatured;
            const published =
                is_published !== undefined ? is_published : isPublished;

            const imageFile = req.files?.image ? req.files.image[0] : null;
            const brochureFile = req.files?.brochure
                ? req.files.brochure[0]
                : null;

            let updateQuery = `UPDATE education_exhibitions SET `;
            const values = [];
            let paramCount = 1;

            if (title) {
                updateQuery += `title = $${paramCount}, `;
                values.push(title);
                paramCount++;
            }
            if (description) {
                updateQuery += `description = $${paramCount}, `;
                values.push(description);
                paramCount++;
            }
            if (startDateValue) {
                updateQuery += `start_date = $${paramCount}, `;
                values.push(startDateValue);
                paramCount++;
            }
            if (endDateValue) {
                updateQuery += `end_date = $${paramCount}, `;
                values.push(endDateValue);
                paramCount++;
            }
            if (location) {
                updateQuery += `location = $${paramCount}, `;
                values.push(location);
                paramCount++;
            }
            if (curator) {
                updateQuery += `curator = $${paramCount}, `;
                values.push(curator);
                paramCount++;
            }
            if (curatorBioValue) {
                updateQuery += `curator_bio = $${paramCount}, `;
                values.push(curatorBioValue);
                paramCount++;
            }
            if (virtualTourValue) {
                updateQuery += `virtual_tour_url = $${paramCount}, `;
                values.push(virtualTourValue);
                paramCount++;
            }
            if (imageFile) {
                updateQuery += `image_url = $${paramCount}, `;
                values.push(`/uploads/education/${imageFile.filename}`);
                paramCount++;
            }
            if (brochureFile) {
                updateQuery += `brochure_url = $${paramCount}, `;
                values.push(`/uploads/education/${brochureFile.filename}`);
                paramCount++;
            }
            if (featured !== undefined) {
                updateQuery += `is_featured = $${paramCount}, `;
                values.push(featured);
                paramCount++;
            }
            if (published !== undefined) {
                updateQuery += `is_published = $${paramCount}, `;
                values.push(published);
                paramCount++;
            }
            if (status) {
                updateQuery += `status = $${paramCount}, `;
                values.push(status);
                paramCount++;
            }

            updateQuery += `updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
            values.push(id);

            const result = await query(updateQuery, values);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: "Exhibition not found" });
            }

            const exhibition = result.rows[0];
            res.json({
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
                createdAt: exhibition.created_at,
                updatedAt: exhibition.updated_at,
            });
        } catch (error) {
            console.error("Error updating exhibition:", error);
            res.status(500).json({ error: "Failed to update exhibition" });
        }
    }
);

// ADMIN ROUTES - Delete exhibition
router.delete("/exhibitions/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            "DELETE FROM education_exhibitions WHERE id = $1 RETURNING id",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Exhibition not found" });
        }

        res.json({ message: "Exhibition deleted successfully" });
    } catch (error) {
        console.error("Error deleting exhibition:", error);
        res.status(500).json({ error: "Failed to delete exhibition" });
    }
});

// ADMIN ROUTES - Get single tutorial by ID
router.get("/tutorials/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            "SELECT * FROM education_tutorials WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Tutorial not found" });
        }

        const tutorial = result.rows[0];
        res.json({
            id: tutorial.id,
            title: tutorial.title,
            description: tutorial.description,
            category: tutorial.category,
            level: tutorial.level,
            format: tutorial.format,
            duration: tutorial.duration,
            instructor: tutorial.instructor,
            document: getFullFileUrl(tutorial.document_url),
            video: getFullFileUrl(tutorial.video_url),
            thumbnail: getFullFileUrl(tutorial.thumbnail_url),
            isFeatured: tutorial.is_featured,
            isPublished: tutorial.is_published,
            status: tutorial.status,
            createdAt: tutorial.created_at,
            updatedAt: tutorial.updated_at,
        });
    } catch (error) {
        console.error("Error fetching tutorial:", error);
        res.status(500).json({ error: "Failed to fetch tutorial" });
    }
});

// ADMIN ROUTES - Get single exhibition by ID
router.get("/exhibitions/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            "SELECT * FROM education_exhibitions WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Exhibition not found" });
        }

        const exhibition = result.rows[0];
        res.json({
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
            createdAt: exhibition.created_at,
            updatedAt: exhibition.updated_at,
        });
    } catch (error) {
        console.error("Error fetching exhibition:", error);
        res.status(500).json({ error: "Failed to fetch exhibition" });
    }
});

// Toggle published status for workshops
router.put("/workshops/:id/publish", async (req, res) => {
    try {
        const { id } = req.params;
        const { published } = req.body;

        const result = await query(
            "UPDATE education_workshops SET is_published = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
            [published, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Workshop not found" });
        }

        res.json({ success: true, isPublished: result.rows[0].is_published });
    } catch (error) {
        console.error("Error toggling workshop publish status:", error);
        res.status(500).json({ error: "Failed to update publish status" });
    }
});

// Toggle featured status for workshops
router.put("/workshops/:id/feature", async (req, res) => {
    try {
        const { id } = req.params;
        const { featured } = req.body;

        const result = await query(
            "UPDATE education_workshops SET is_featured = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
            [featured, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Workshop not found" });
        }

        res.json({ success: true, isFeatured: result.rows[0].is_featured });
    } catch (error) {
        console.error("Error toggling workshop featured status:", error);
        res.status(500).json({ error: "Failed to update featured status" });
    }
});

// Toggle published status for tutorials
router.put("/tutorials/:id/publish", async (req, res) => {
    try {
        const { id } = req.params;
        const { published } = req.body;

        const result = await query(
            "UPDATE education_tutorials SET is_published = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
            [published, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Tutorial not found" });
        }

        res.json({ success: true, isPublished: result.rows[0].is_published });
    } catch (error) {
        console.error("Error toggling tutorial publish status:", error);
        res.status(500).json({ error: "Failed to update publish status" });
    }
});

// Toggle featured status for tutorials
router.put("/tutorials/:id/feature", async (req, res) => {
    try {
        const { id } = req.params;
        const { featured } = req.body;

        const result = await query(
            "UPDATE education_tutorials SET is_featured = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
            [featured, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Tutorial not found" });
        }

        res.json({ success: true, isFeatured: result.rows[0].is_featured });
    } catch (error) {
        console.error("Error toggling tutorial featured status:", error);
        res.status(500).json({ error: "Failed to update featured status" });
    }
});

// Toggle published status for exhibitions
router.put("/exhibitions/:id/publish", async (req, res) => {
    try {
        const { id } = req.params;
        const { published } = req.body;

        const result = await query(
            "UPDATE education_exhibitions SET is_published = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
            [published, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Exhibition not found" });
        }

        res.json({ success: true, isPublished: result.rows[0].is_published });
    } catch (error) {
        console.error("Error toggling exhibition publish status:", error);
        res.status(500).json({ error: "Failed to update publish status" });
    }
});

// Toggle featured status for exhibitions
router.put("/exhibitions/:id/feature", async (req, res) => {
    try {
        const { id } = req.params;
        const { featured } = req.body;

        const result = await query(
            "UPDATE education_exhibitions SET is_featured = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
            [featured, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Exhibition not found" });
        }

        res.json({ success: true, isFeatured: result.rows[0].is_featured });
    } catch (error) {
        console.error("Error toggling exhibition featured status:", error);
        res.status(500).json({ error: "Failed to update featured status" });
    }
});

module.exports = router;
