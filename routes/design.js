const express = require("express");
const router = express.Router();
const { query } = require("../db");
// Helper function to parse gallery_images JSON strings and add contentBlocks
const parseProjectGalleryImages = (projects) => {
    return projects.map((project) => {
        if (
            project.gallery_images &&
            typeof project.gallery_images === "string"
        ) {
            try {
                project.gallery_images = JSON.parse(project.gallery_images);
            } catch (e) {
                console.error(
                    "Error parsing gallery_images for project:",
                    project.id,
                    e
                );
                project.gallery_images = [];
            }
        }
        
        // Add contentBlocks field for frontend compatibility
        project.contentBlocks = project.gallery_images || [];
        project.content_blocks = project.gallery_images || [];
        
        return project;
    });
};

// ===== PUBLIC ROUTES =====

// @desc    Get all design projects
// @route   GET /api/design/projects
// @access  Public
router.get("/projects", async (req, res) => {
    try {
        const result = await query(
            `SELECT * FROM design_projects 
       WHERE is_published = true 
       ORDER BY display_order, created_at DESC`
        );

        res.status(200).json({
            success: true,
            data: parseProjectGalleryImages(result.rows),
        });
    } catch (error) {
        console.error("Get design projects error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching design projects",
        });
    }
});

// ===== SPECIFIC CATEGORY ROUTES (Add these before the parameterized route) =====

// @desc    Get academic design projects
// @route   GET /api/design/projects/academic
// @access  Public
router.get("/projects/academic", async (req, res) => {
    try {
        const result = await query(
            `SELECT * FROM design_projects 
       WHERE category = 'academic' AND is_published = true 
       ORDER BY display_order, created_at DESC`
        );

        res.status(200).json({
            success: true,
            data: parseProjectGalleryImages(result.rows),
        });
    } catch (error) {
        console.error("Get academic projects error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching academic projects",
        });
    }
});

// @desc    Get professional design projects
// @route   GET /api/design/projects/professional
// @access  Public
router.get("/projects/professional", async (req, res) => {
    try {
        const result = await query(
            `SELECT * FROM design_projects 
       WHERE category = 'professional' AND is_published = true 
       ORDER BY display_order, created_at DESC`
        );

        res.status(200).json({
            success: true,
            data: parseProjectGalleryImages(result.rows),
        });
    } catch (error) {
        console.error("Get professional projects error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching professional projects",
        });
    }
});

// @desc    Get competition design projects
// @route   GET /api/design/projects/competition
// @access  Public
router.get("/projects/competition", async (req, res) => {
    try {
        const result = await query(
            `SELECT * FROM design_projects 
       WHERE category = 'competition' AND is_published = true 
       ORDER BY display_order, created_at DESC`
        );

        res.status(200).json({
            success: true,
            data: parseProjectGalleryImages(result.rows),
        });
    } catch (error) {
        console.error("Get competition projects error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching competition projects",
        });
    }
});

// @desc    Get design projects by category (parameterized route - for other categories)
// @route   GET /api/design/projects/:category
// @access  Public
router.get("/projects/:category", async (req, res) => {
    try {
        const { category } = req.params;

        const result = await query(
            `SELECT * FROM design_projects 
       WHERE category = $1 AND is_published = true 
       ORDER BY display_order, created_at DESC`,
            [category]
        );

        res.status(200).json({
            success: true,
            data: parseProjectGalleryImages(result.rows),
        });
    } catch (error) {
        console.error("Get design projects by category error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching design projects by category",
        });
    }
});

// @desc    Get design projects by sector
// @route   GET /api/design/sector/:sector
// @access  Public
router.get("/sector/:sector", async (req, res) => {
    try {
        const { sector } = req.params;

        const result = await query(
            `SELECT * FROM design_projects 
       WHERE sector = $1 AND is_published = true 
       ORDER BY display_order, created_at DESC`,
            [sector]
        );

        res.status(200).json({
            success: true,
            data: parseProjectGalleryImages(result.rows),
        });
    } catch (error) {
        console.error("Get design projects by sector error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching design projects by sector",
        });
    }
});

// @desc    Get single design project by ID
// @route   GET /api/design/project/:id
// @access  Public
router.get("/project/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            "SELECT * FROM design_projects WHERE id = $1 AND is_published = true",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Design project not found",
            });
        }

        // Parse gallery_images if it's a JSON string
        const project = result.rows[0];
        if (
            project.gallery_images &&
            typeof project.gallery_images === "string"
        ) {
            try {
                project.gallery_images = JSON.parse(project.gallery_images);
            } catch (e) {
                console.error("Error parsing gallery_images:", e);
                project.gallery_images = [];
            }
        }
        
        // Add contentBlocks field for frontend compatibility
        project.contentBlocks = project.gallery_images || [];
        project.content_blocks = project.gallery_images || [];

        res.status(200).json({
            success: true,
            data: project,
        });
    } catch (error) {
        console.error("Get design project error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching design project",
        });
    }
});

// @desc    Get featured design projects (mixed categories)
// @route   GET /api/design/featured
// @access  Public
router.get("/featured", async (req, res) => {
    try {
        const result = await query(
            `SELECT * FROM design_projects 
       WHERE is_featured = true AND is_published = true 
       ORDER BY display_order, created_at DESC 
       LIMIT 6`
        );

        res.status(200).json({
            success: true,
            data: parseProjectGalleryImages(result.rows),
        });
    } catch (error) {
        console.error("Get featured design projects error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching featured design projects",
        });
    }
});

// ===== ADMIN ROUTES =====

// @desc    Get all design projects for admin (including unpublished)
// @route   GET /api/design/admin/projects
// @access  Private
router.get("/admin/projects", async (req, res) => {
    try {
        const result = await query(
            "SELECT * FROM design_projects ORDER BY category, display_order, created_at DESC"
        );

        res.status(200).json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error("Get admin design projects error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching design projects for admin",
        });
    }
});

// @desc    Create new design project (admin)
// @route   POST /api/design/admin/projects
// @access  Private
router.post("/admin/projects", async (req, res) => {
    try {
        const {
            title,
            summary,
            description,
            category,
            sector,
            main_image,
            mainImage, // Accept camelCase from frontend
            gallery_images,
            galleryImages, // Accept camelCase from frontend
            content_blocks,
            contentBlocks, // Accept camelCase from frontend
            display_order,
            displayOrder, // Accept camelCase from frontend
            is_featured,
            isFeatured, // Accept camelCase from frontend
            is_published,
            isPublished, // Accept camelCase from frontend
        } = req.body;

        // Use either snake_case or camelCase, preferring the one that's provided
        const mainImageUrl = main_image || mainImage;
        const galleryImagesArray = gallery_images || galleryImages;
        const contentBlocksArray = content_blocks || contentBlocks;
        const displayOrderValue =
            display_order !== undefined ? display_order : displayOrder;
        const featured = is_featured !== undefined ? is_featured : isFeatured;
        const published =
            is_published !== undefined ? is_published : isPublished;

        // Validate required fields
        if (
            !title ||
            !summary ||
            !description ||
            !category ||
            !sector ||
            !mainImageUrl
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Missing required fields: title, summary, description, category, sector, and main_image are required",
            });
        }

        const result = await query(
            `INSERT INTO design_projects 
       (title, summary, description, category, sector, main_image, gallery_images, display_order, is_featured, is_published) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
            [
                title,
                summary,
                description,
                category,
                sector,
                mainImageUrl,
                JSON.stringify(contentBlocksArray || galleryImagesArray || []),
                displayOrderValue || 0,
                featured || false,
                published !== undefined ? published : true,
            ]
        );

        const project = result.rows[0];
        res.status(201).json({
            success: true,
            data: {
                ...project,
                mainImage: project.main_image,
                main_image: project.main_image,
                galleryImages: project.gallery_images,
                gallery_images: project.gallery_images,
                displayOrder: project.display_order,
                display_order: project.display_order,
                isFeatured: project.is_featured,
                is_featured: project.is_featured,
                isPublished: project.is_published,
                is_published: project.is_published,
            },
            message: "Design project created successfully",
        });
    } catch (error) {
        console.error("Create design project error:", error);
        res.status(500).json({
            success: false,
            message: "Error creating design project: " + error.message,
        });
    }
});

// @desc    Get single design project by ID for admin
// @route   GET /api/design/admin/projects/:id
// @access  Private
router.get("/admin/projects/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Check if the parameter is a number (ID) or a string (category)
        // If it's a valid integer, treat it as an ID
        if (/^\d+$/.test(id)) {
            const result = await query(
                "SELECT * FROM design_projects WHERE id = $1",
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Design project not found",
                });
            }

            return res.status(200).json(result.rows[0]);
        }

        // Otherwise, treat it as a category (fallback to existing behavior)
        const result = await query(
            `SELECT * FROM design_projects 
       WHERE category = $1 
       ORDER BY display_order, created_at DESC`,
            [id]
        );

        return res.status(200).json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error("Get admin design project error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching design project for admin",
        });
    }
});

// @desc    Update design project (admin)
// @route   PUT /api/design/admin/projects/:id
// @access  Private
router.put("/admin/projects/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            summary,
            description,
            category,
            sector,
            main_image,
            mainImage, // Accept camelCase from frontend
            gallery_images,
            galleryImages, // Accept camelCase from frontend
            display_order,
            displayOrder, // Accept camelCase from frontend
            is_featured,
            isFeatured, // Accept camelCase from frontend
            is_published,
            isPublished, // Accept camelCase from frontend
        } = req.body;

        // Use either snake_case or camelCase, preferring the one that's provided
        const mainImageUrl = main_image || mainImage;
        const galleryImagesArray = gallery_images || galleryImages;
        const displayOrderValue =
            display_order !== undefined ? display_order : displayOrder;
        const featured = is_featured !== undefined ? is_featured : isFeatured;
        const published =
            is_published !== undefined ? is_published : isPublished;

        // Check if project exists first
        const checkResult = await query(
            "SELECT main_image FROM design_projects WHERE id = $1",
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Design project not found",
            });
        }

        // Use existing main_image if no new one provided
        const finalMainImage = mainImageUrl || checkResult.rows[0].main_image;

        const result = await query(
            `UPDATE design_projects 
       SET title = $1, summary = $2, description = $3, category = $4, sector = $5,
           main_image = $6, gallery_images = $7, display_order = $8, 
           is_featured = $9, is_published = $10, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $11 
       RETURNING *`,
            [
                title,
                summary,
                description,
                category,
                sector,
                finalMainImage,
                JSON.stringify(galleryImagesArray || []),
                displayOrderValue || 0,
                featured !== undefined ? featured : false,
                published !== undefined ? published : true,
                id,
            ]
        );

        const project = result.rows[0];
        res.status(200).json({
            success: true,
            data: {
                ...project,
                mainImage: project.main_image,
                main_image: project.main_image,
                galleryImages: project.gallery_images,
                gallery_images: project.gallery_images,
                displayOrder: project.display_order,
                display_order: project.display_order,
                isFeatured: project.is_featured,
                is_featured: project.is_featured,
                isPublished: project.is_published,
                is_published: project.is_published,
            },
            message: "Design project updated successfully",
        });
    } catch (error) {
        console.error("Update design project error:", error);
        res.status(500).json({
            success: false,
            message: "Error updating design project: " + error.message,
        });
    }
});

// ===== ADMIN SPECIFIC CATEGORY ROUTES =====

// @desc    Get academic design projects for admin
// @route   GET /api/design/admin/category/academic
// @access  Private
router.get("/admin/category/academic", async (req, res) => {
    try {
        const result = await query(
            `SELECT * FROM design_projects 
       WHERE category = 'academic'
       ORDER BY display_order, created_at DESC`
        );

        res.status(200).json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error("Get admin academic projects error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching academic projects for admin",
        });
    }
});

// @desc    Get professional design projects for admin
// @route   GET /api/design/admin/category/professional
// @access  Private
router.get("/admin/category/professional", async (req, res) => {
    try {
        const result = await query(
            `SELECT * FROM design_projects 
       WHERE category = 'professional'
       ORDER BY display_order, created_at DESC`
        );

        res.status(200).json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error("Get admin professional projects error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching professional projects for admin",
        });
    }
});

// @desc    Get competition design projects for admin
// @route   GET /api/design/admin/category/competition
// @access  Private
router.get("/admin/category/competition", async (req, res) => {
    try {
        const result = await query(
            `SELECT * FROM design_projects 
       WHERE category = 'competition'
       ORDER BY display_order, created_at DESC`
        );

        res.status(200).json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error("Get admin competition projects error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching competition projects for admin",
        });
    }
});

// @desc    Get design projects by category for admin (parameterized route)
// @route   GET /api/design/admin/category/:category
// @access  Private
router.get("/admin/category/:category", async (req, res) => {
    try {
        const { category } = req.params;

        const result = await query(
            `SELECT * FROM design_projects 
       WHERE category = $1 
       ORDER BY display_order, created_at DESC`,
            [category]
        );

        res.status(200).json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error("Get admin design projects by category error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching design projects by category for admin",
        });
    }
});

// @desc    Create design project
// @route   POST /api/design/projects
// @access  Private
router.post("/projects", async (req, res) => {
    try {
        const {
            title,
            summary,
            description,
            category,
            sector,
            main_image,
            mainImage, // Accept camelCase from frontend
            gallery_images,
            galleryImages, // Accept camelCase from frontend
            display_order,
            displayOrder, // Accept camelCase from frontend
            is_featured,
            isFeatured, // Accept camelCase from frontend
            is_published,
            isPublished, // Accept camelCase from frontend
        } = req.body;

        // Use either snake_case or camelCase, preferring the one that's provided
        const mainImageUrl = main_image || mainImage;
        const galleryImagesArray = gallery_images || galleryImages;
        const displayOrderValue =
            display_order !== undefined ? display_order : displayOrder;
        const featured = is_featured !== undefined ? is_featured : isFeatured;
        const published =
            is_published !== undefined ? is_published : isPublished;

        // Validate required fields
        if (
            !title ||
            !summary ||
            !description ||
            !category ||
            !sector ||
            !mainImageUrl
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Missing required fields: title, summary, description, category, sector, and main_image are required",
            });
        }

        const result = await query(
            `INSERT INTO design_projects 
       (title, summary, description, category, sector, main_image, gallery_images, display_order, is_featured, is_published) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
            [
                title,
                summary,
                description,
                category,
                sector,
                mainImageUrl,
                JSON.stringify(galleryImagesArray || []),
                displayOrderValue || 0,
                featured || false,
                published !== undefined ? published : true,
            ]
        );

        const project = result.rows[0];
        res.status(201).json({
            success: true,
            data: {
                ...project,
                mainImage: project.main_image,
                main_image: project.main_image,
                galleryImages: project.gallery_images,
                gallery_images: project.gallery_images,
                displayOrder: project.display_order,
                display_order: project.display_order,
                isFeatured: project.is_featured,
                is_featured: project.is_featured,
                isPublished: project.is_published,
                is_published: project.is_published,
            },
            message: "Design project created successfully",
        });
    } catch (error) {
        console.error("Create design project error:", error);
        res.status(500).json({
            success: false,
            message: "Error creating design project: " + error.message,
        });
    }
});

// @desc    Update design project
// @route   PUT /api/design/projects/:id
// @access  Private
router.put("/projects/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            summary,
            description,
            category,
            sector,
            main_image,
            gallery_images,
            display_order,
            is_featured,
            is_published,
        } = req.body;

        // Validate required fields
        if (
            !title ||
            !summary ||
            !description ||
            !category ||
            !sector ||
            !main_image
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Missing required fields: title, summary, description, category, sector, and main_image are required",
            });
        }

        const result = await query(
            `UPDATE design_projects 
       SET title = $1, summary = $2, description = $3, category = $4, sector = $5,
           main_image = $6, gallery_images = $7, display_order = $8, 
           is_featured = $9, is_published = $10, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $11 
       RETURNING *`,
            [
                title,
                summary,
                description,
                category,
                sector,
                main_image,
                JSON.stringify(gallery_images || []),
                display_order,
                is_featured,
                is_published,
                id,
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Design project not found",
            });
        }

        res.status(200).json({
            success: true,
            data: result.rows[0],
            message: "Design project updated successfully",
        });
    } catch (error) {
        console.error("Update design project error:", error);
        res.status(500).json({
            success: false,
            message: "Error updating design project: " + error.message,
        });
    }
});

// @desc    Delete design project
// @route   DELETE /api/design/projects/:id
// @access  Private
router.delete("/projects/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            "DELETE FROM design_projects WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Design project not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Design project deleted successfully",
            deletedProject: result.rows[0],
        });
    } catch (error) {
        console.error("Delete design project error:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting design project: " + error.message,
        });
    }
});

// @desc    Toggle design project published status
// @route   PATCH /api/design/projects/:id/toggle
// @access  Private
router.patch("/projects/:id/toggle", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            `UPDATE design_projects 
       SET is_published = NOT is_published, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Design project not found",
            });
        }

        const newStatus = result.rows[0].is_published
            ? "published"
            : "unpublished";

        res.status(200).json({
            success: true,
            data: result.rows[0],
            message: `Design project ${newStatus} successfully`,
        });
    } catch (error) {
        console.error("Toggle design project error:", error);
        res.status(500).json({
            success: false,
            message: "Error toggling design project: " + error.message,
        });
    }
});

// @desc    Toggle design project featured status
// @route   PATCH /api/design/projects/:id/toggle-featured
// @access  Private
router.patch("/projects/:id/toggle-featured", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            `UPDATE design_projects 
       SET is_featured = NOT is_featured, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Design project not found",
            });
        }

        const newStatus = result.rows[0].is_featured
            ? "featured"
            : "unfeatured";

        res.status(200).json({
            success: true,
            data: result.rows[0],
            message: `Design project ${newStatus} successfully`,
        });
    } catch (error) {
        console.error("Toggle featured design project error:", error);
        res.status(500).json({
            success: false,
            message: "Error toggling featured status: " + error.message,
        });
    }
});

// @desc    Get design projects statistics for admin
// @route   GET /api/design/admin/stats
// @access  Private
router.get("/admin/stats", async (req, res) => {
    try {
        const [
            totalResult,
            academicResult,
            professionalResult,
            competitionResult,
            featuredResult,
            publishedResult,
        ] = await Promise.all([
            query("SELECT COUNT(*) FROM design_projects"),
            query("SELECT COUNT(*) FROM design_projects WHERE category = $1", [
                "academic",
            ]),
            query("SELECT COUNT(*) FROM design_projects WHERE category = $1", [
                "professional",
            ]),
            query("SELECT COUNT(*) FROM design_projects WHERE category = $1", [
                "competition",
            ]),
            query(
                "SELECT COUNT(*) FROM design_projects WHERE is_featured = true"
            ),
            query(
                "SELECT COUNT(*) FROM design_projects WHERE is_published = true"
            ),
        ]);

        // Get sector statistics
        const sectorResult = await query(`
      SELECT sector, COUNT(*) as count 
      FROM design_projects 
      WHERE sector IS NOT NULL 
      GROUP BY sector 
      ORDER BY count DESC
    `);

        const sectorStats = {};
        sectorResult.rows.forEach((row) => {
            sectorStats[row.sector] = parseInt(row.count);
        });

        res.status(200).json({
            success: true,
            data: {
                total: parseInt(totalResult.rows[0].count),
                academic: parseInt(academicResult.rows[0].count),
                professional: parseInt(professionalResult.rows[0].count),
                competition: parseInt(competitionResult.rows[0].count),
                featured: parseInt(featuredResult.rows[0].count),
                published: parseInt(publishedResult.rows[0].count),
                unpublished:
                    parseInt(totalResult.rows[0].count) -
                    parseInt(publishedResult.rows[0].count),
                sectors: sectorStats,
            },
        });
    } catch (error) {
        console.error("Get design stats error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching design statistics: " + error.message,
        });
    }
});

// @desc    Get projects by sector for admin
// @route   GET /api/design/admin/sector/:sector
// @access  Private
router.get("/admin/sector/:sector", async (req, res) => {
    try {
        const { sector } = req.params;

        const result = await query(
            `SELECT * FROM design_projects 
       WHERE sector = $1 
       ORDER BY display_order, created_at DESC`,
            [sector]
        );

        res.status(200).json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error("Get design projects by sector error:", error);
        res.status(500).json({
            success: false,
            message:
                "Error fetching design projects by sector: " + error.message,
        });
    }
});

// @desc    Get all available sectors
// @route   GET /api/design/sectors
// @access  Public
router.get("/sectors", async (req, res) => {
    try {
        const result = await query(`
      SELECT DISTINCT sector 
      FROM design_projects 
      WHERE sector IS NOT NULL AND is_published = true 
      ORDER BY sector
    `);

        const sectors = result.rows.map((row) => row.sector);

        res.status(200).json({
            success: true,
            data: sectors,
        });
    } catch (error) {
        console.error("Get sectors error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching sectors: " + error.message,
        });
    }
});

// @desc    Search design projects
// @route   GET /api/design/search
// @access  Public
router.get("/search", async (req, res) => {
    try {
        const { q, category, sector } = req.query;

        let queryText = `
      SELECT * FROM design_projects 
      WHERE is_published = true 
    `;
        const queryParams = [];
        let paramCount = 0;

        if (q) {
            paramCount++;
            queryText += ` AND (title ILIKE $${paramCount} OR summary ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
            queryParams.push(`%${q}%`);
        }

        if (category) {
            paramCount++;
            queryText += ` AND category = $${paramCount}`;
            queryParams.push(category);
        }

        if (sector) {
            paramCount++;
            queryText += ` AND sector = $${paramCount}`;
            queryParams.push(sector);
        }

        queryText += ` ORDER BY display_order, created_at DESC`;

        const result = await query(queryText, queryParams);

        res.status(200).json({
            success: true,
            data: parseProjectGalleryImages(result.rows),
            count: result.rows.length,
        });
    } catch (error) {
        console.error("Search design projects error:", error);
        res.status(500).json({
            success: false,
            message: "Error searching design projects: " + error.message,
        });
    }
});

module.exports = router;
