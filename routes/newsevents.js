const express = require("express");
const router = express.Router();
const { query } = require("../db");
const { clearCachePattern } = require("../middleware/cache");

// Helper function to construct proper image URLs
const getFullImageUrl = (imagePath) => {
    if (!imagePath) return null;

    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        return imagePath;
    }

    if (imagePath.startsWith("data:")) {
        return imagePath;
    }

    const baseUrl = process.env.BASE_URL || "http://localhost:4000";
    return `${baseUrl}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
};

// Get all news articles
router.get("/news", async (req, res) => {
    try {
        // Check if admin (has authorization header) - show all items
        const isAdmin = req.headers.authorization;
        
        const result = await query(
            `
            SELECT 
                id,
                title,
                excerpt,
                content,
                image_url as image,
                category,
                author,
                date,
                read_time as "readTime",
                is_featured as "isFeatured",
                is_published as "isPublished",
                status,
                created_at as "createdAt",
                updated_at as "updatedAt"
            FROM news_articles 
            ${isAdmin ? '' : 'WHERE is_published = true AND status = $1'}
            ORDER BY date DESC, created_at DESC
        `,
            isAdmin ? [] : ["published"]
        );

        const news = result.rows.map((article) => ({
            id: article.id,
            title: article.title,
            excerpt: article.excerpt,
            content: article.content,
            image: getFullImageUrl(article.image),
            category: article.category,
            author: article.author,
            date: article.date,
            readTime: article.readTime,
            isFeatured: article.isFeatured,
            isPublished: article.isPublished,
            status: article.status,
            createdAt: article.createdAt,
        }));

        console.log("News API Response:", news.length, "articles found");
        res.json(news);
    } catch (error) {
        console.error("Error fetching news:", error);
        res.status(500).json({ error: "Failed to fetch news articles" });
    }
});

// Get all events
router.get("/events", async (req, res) => {
    try {
        // Check if admin (has authorization header) - show all items
        const isAdmin = req.headers.authorization;
        
        const result = await query(
            `
            SELECT 
                id,
                title,
                description,
                excerpt,
                image_url as image,
                event_date as "eventDate",
                event_time as "eventTime",
                location,
                category,
                author,
                read_time as "readTime",
                is_featured as "isFeatured",
                is_published as "isPublished",
                status,
                created_at as "createdAt",
                updated_at as "updatedAt"
            FROM events 
            ${isAdmin ? '' : 'WHERE is_published = true AND status = $1'}
            ORDER BY event_date ASC, created_at DESC
        `,
            isAdmin ? [] : ["published"]
        );

        const events = result.rows.map((event) => ({
            id: event.id,
            title: event.title,
            description: event.description,
            excerpt: event.excerpt,
            image: getFullImageUrl(event.image),
            eventDate: event.eventDate,
            eventTime: event.eventTime,
            location: event.location,
            category: event.category,
            author: event.author,
            readTime: event.readTime,
            isFeatured: event.isFeatured,
            createdAt: event.createdAt,
        }));

        console.log("Events API Response:", events.length, "events found");
        res.json(events);
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ error: "Failed to fetch events" });
    }
});

// Get combined news and events for the main page
router.get("/all", async (req, res) => {
    try {
        // Check if admin (has authorization header) - show all items
        const isAdmin = req.headers.authorization;
        
        const newsResult = await query(
            `
            SELECT 
                id,
                title,
                excerpt,
                content,
                image_url as image,
                'news' as type,
                category,
                author,
                date,
                read_time as "readTime",
                is_featured as "isFeatured",
                is_published as "isPublished",
                status,
                created_at as "createdAt"
            FROM news_articles 
            ${isAdmin ? '' : 'WHERE is_published = true AND status = $1'}
            ORDER BY date DESC
            ${isAdmin ? '' : 'LIMIT 6'}
        `,
            isAdmin ? [] : ["published"]
        );

        const eventsResult = await query(
            `
            SELECT 
                id,
                title,
                excerpt,
                description as content,
                image_url as image,
                'event' as type,
                category,
                author,
                event_date as date,
                event_time as "eventTime",
                location,
                read_time as "readTime",
                is_featured as "isFeatured",
                is_published as "isPublished",
                status,
                created_at as "createdAt"
            FROM events 
            ${isAdmin ? '' : 'WHERE is_published = true AND status = $1'}
            ORDER BY event_date ASC
            ${isAdmin ? '' : 'LIMIT 6'}
        `,
            isAdmin ? [] : ["published"]
        );

        const news = newsResult.rows.map((article) => ({
            id: article.id,
            title: article.title,
            excerpt: article.excerpt,
            content: article.content,
            image: getFullImageUrl(article.image),
            type: article.type,
            category: article.category,
            author: article.author,
            date: article.date,
            readTime: article.readTime,
            isFeatured: article.isFeatured,
            createdAt: article.createdAt,
        }));

        const events = eventsResult.rows.map((event) => ({
            id: event.id,
            title: event.title,
            excerpt: event.excerpt,
            content: event.content,
            image: getFullImageUrl(event.image),
            type: event.type,
            category: event.category,
            author: event.author,
            date: event.date,
            eventTime: event.eventTime,
            location: event.location,
            readTime: event.readTime,
            isFeatured: event.isFeatured,
            createdAt: event.createdAt,
        }));

        // Combine and sort by date
        const allItems = [...news, ...events].sort(
            (a, b) => new Date(b.date) - new Date(a.date)
        );

        res.json(allItems);
    } catch (error) {
        console.error("Error fetching news and events:", error);
        res.status(500).json({ error: "Failed to fetch news and events" });
    }
});

// Get featured news and events
router.get("/featured", async (req, res) => {
    try {
        const featuredNews = await query(
            `
            SELECT 
                id,
                title,
                excerpt,
                image_url as image,
                'news' as type,
                category,
                author,
                date,
                read_time as "readTime"
            FROM news_articles 
            WHERE is_featured = true AND is_published = true AND status = $1
            ORDER BY date DESC
            LIMIT 3
        `,
            ["published"]
        );

        const featuredEvents = await query(
            `
            SELECT 
                id,
                title,
                excerpt,
                image_url as image,
                'event' as type,
                category,
                author,
                event_date as date,
                event_time as "eventTime",
                location
            FROM events 
            WHERE is_featured = true AND is_published = true AND status = $1
            ORDER BY event_date ASC
            LIMIT 3
        `,
            ["published"]
        );

        const featuredItems = [
            ...featuredNews.rows.map((article) => ({
                ...article,
                image: getFullImageUrl(article.image),
            })),
            ...featuredEvents.rows.map((event) => ({
                ...event,
                image: getFullImageUrl(event.image),
            })),
        ];

        res.json(featuredItems);
    } catch (error) {
        console.error("Error fetching featured items:", error);
        res.status(500).json({
            error: "Failed to fetch featured news and events",
        });
    }
});

// Get single news article by ID
router.get("/news/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            `
            SELECT 
                id,
                title,
                excerpt,
                content,
                image_url as image,
                category,
                author,
                date,
                read_time as "readTime",
                is_featured as "isFeatured",
                created_at as "createdAt"
            FROM news_articles 
            WHERE id = $1 AND is_published = true AND status = $2
        `,
            [id, "published"]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "News article not found" });
        }

        const article = result.rows[0];
        res.json({
            ...article,
            image: getFullImageUrl(article.image),
        });
    } catch (error) {
        console.error("Error fetching news article:", error);
        res.status(500).json({ error: "Failed to fetch news article" });
    }
});

// Get single event by ID
router.get("/events/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            `
            SELECT 
                id,
                title,
                description,
                excerpt,
                image_url as image,
                event_date as "eventDate",
                event_time as "eventTime",
                location,
                category,
                author,
                read_time as "readTime",
                is_featured as "isFeatured",
                created_at as "createdAt"
            FROM events 
            WHERE id = $1 AND is_published = true AND status = $2
        `,
            [id, "published"]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Event not found" });
        }

        const event = result.rows[0];
        res.json({
            ...event,
            image: getFullImageUrl(event.image),
        });
    } catch (error) {
        console.error("Error fetching event:", error);
        res.status(500).json({ error: "Failed to fetch event" });
    }
});

// Create new news article
router.post("/news", async (req, res) => {
    try {
        const {
            title,
            excerpt,
            content,
            image_url,
            image, // Accept camelCase from frontend
            category,
            author,
            date,
            read_time,
            readTime, // Accept camelCase from frontend
            is_featured,
            isFeatured, // Accept camelCase from frontend
            is_published,
            isPublished, // Accept camelCase from frontend
            status,
        } = req.body;

        // Use either snake_case or camelCase, preferring the one that's provided
        const imageUrl = image_url || image;
        const readTimeValue = read_time || readTime;
        const featured = is_featured !== undefined ? is_featured : isFeatured;
        const published =
            is_published !== undefined ? is_published : isPublished;

        if (!title) {
            return res.status(400).json({
                error: "Title is required",
            });
        }

        const result = await query(
            `
            INSERT INTO news_articles 
                (title, excerpt, content, image_url, category, author, date, read_time, is_featured, is_published, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `,
            [
                title,
                excerpt || "",
                content || "",
                imageUrl || null,
                category || "Architecture",
                author || "ASPIRE Team",
                date || new Date().toISOString(),
                readTimeValue || "5 min",
                featured || false,
                published !== undefined ? published : true,
                status || "published",
            ]
        );

        const article = result.rows[0];
        res.status(201).json({
            id: article.id,
            title: article.title,
            excerpt: article.excerpt,
            content: article.content,
            image: getFullImageUrl(article.image_url),
            image_url: getFullImageUrl(article.image_url),
            imageUrl: getFullImageUrl(article.image_url),
            category: article.category,
            author: article.author,
            date: article.date,
            readTime: article.read_time,
            read_time: article.read_time,
            isFeatured: article.is_featured,
            is_featured: article.is_featured,
            isPublished: article.is_published,
            is_published: article.is_published,
            createdAt: article.created_at,
        });
    } catch (error) {
        console.error("Error creating news article:", error);
        res.status(500).json({
            error: "Failed to create news article",
            details: error.message,
        });
    }
});

// Create new event
router.post("/events", async (req, res) => {
    try {
        const {
            title,
            description,
            excerpt,
            image_url,
            image, // Accept camelCase from frontend
            event_date,
            eventDate, // Accept camelCase from frontend
            event_time,
            eventTime, // Accept camelCase from frontend
            location,
            category,
            author,
            read_time,
            readTime, // Accept camelCase from frontend
            is_featured,
            isFeatured, // Accept camelCase from frontend
            is_published,
            isPublished, // Accept camelCase from frontend
            status,
        } = req.body;

        // Use either snake_case or camelCase, preferring the one that's provided
        const imageUrl = image_url || image;
        const eventDateValue = event_date || eventDate;
        const eventTimeValue = event_time || eventTime;
        const readTimeValue = read_time || readTime;
        const featured = is_featured !== undefined ? is_featured : isFeatured;
        const published =
            is_published !== undefined ? is_published : isPublished;

        if (!title) {
            return res.status(400).json({
                error: "Title is required",
            });
        }

        const result = await query(
            `
            INSERT INTO events 
                (title, description, excerpt, image_url, event_date, event_time, location, category, author, read_time, is_featured, is_published, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `,
            [
                title,
                description || "",
                excerpt || "",
                imageUrl || null,
                eventDateValue || new Date().toISOString(),
                eventTimeValue || "10:00 AM",
                location || "TBD",
                category || "Architecture",
                author || "ASPIRE Team",
                readTimeValue || "5 min",
                featured || false,
                published !== undefined ? published : true,
                status || "published",
            ]
        );

        const event = result.rows[0];
        res.status(201).json({
            id: event.id,
            title: event.title,
            description: event.description,
            excerpt: event.excerpt,
            image: getFullImageUrl(event.image_url),
            image_url: getFullImageUrl(event.image_url),
            imageUrl: getFullImageUrl(event.image_url),
            eventDate: event.event_date,
            event_date: event.event_date,
            eventTime: event.event_time,
            event_time: event.event_time,
            location: event.location,
            category: event.category,
            author: event.author,
            readTime: event.read_time,
            read_time: event.read_time,
            isFeatured: event.is_featured,
            is_featured: event.is_featured,
            isPublished: event.is_published,
            is_published: event.is_published,
            createdAt: event.created_at,
        });
    } catch (error) {
        console.error("Error creating event:", error);
        res.status(500).json({
            error: "Failed to create event",
            details: error.message,
        });
    }
});

// Update news article
router.put("/news/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            excerpt,
            content,
            image_url,
            image,
            category,
            author,
            date,
            read_time,
            readTime,
            is_featured,
            isFeatured,
            is_published,
            isPublished,
            status,
        } = req.body;

        const imageUrl = image_url || image;
        const readTimeValue = read_time || readTime;
        const featured = is_featured !== undefined ? is_featured : isFeatured;
        const published =
            is_published !== undefined ? is_published : isPublished;

        // Ensure the article exists
        const exists = await query(
            "SELECT * FROM news_articles WHERE id = $1",
            [id]
        );
        if (exists.rows.length === 0) {
            return res.status(404).json({ error: "News article not found" });
        }

        const result = await query(
            `
            UPDATE news_articles SET
                title = COALESCE($1, title),
                excerpt = COALESCE($2, excerpt),
                content = COALESCE($3, content),
                image_url = COALESCE($4, image_url),
                category = COALESCE($5, category),
                author = COALESCE($6, author),
                date = COALESCE($7, date),
                read_time = COALESCE($8, read_time),
                is_featured = COALESCE($9, is_featured),
                is_published = COALESCE($10, is_published),
                status = COALESCE($11, status),
                updated_at = NOW()
            WHERE id = $12
            RETURNING *
        `,
            [
                title,
                excerpt,
                content,
                imageUrl,
                category,
                author,
                date,
                readTimeValue,
                featured,
                published,
                status,
                id,
            ]
        );

        const article = result.rows[0];
        res.json({
            id: article.id,
            title: article.title,
            excerpt: article.excerpt,
            content: article.content,
            image: getFullImageUrl(article.image_url),
            image_url: getFullImageUrl(article.image_url),
            imageUrl: getFullImageUrl(article.image_url),
            category: article.category,
            author: article.author,
            date: article.date,
            readTime: article.read_time,
            read_time: article.read_time,
            isFeatured: article.is_featured,
            is_featured: article.is_featured,
            isPublished: article.is_published,
            is_published: article.is_published,
            createdAt: article.created_at,
            updatedAt: article.updated_at,
        });
    } catch (error) {
        console.error("Error updating news article:", error);
        res.status(500).json({
            error: "Failed to update news article",
            details: error.message,
        });
    }
});

// Update event
router.put("/events/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            excerpt,
            image_url,
            image,
            event_date,
            eventDate,
            event_time,
            eventTime,
            location,
            category,
            author,
            read_time,
            readTime,
            is_featured,
            isFeatured,
            is_published,
            isPublished,
            status,
        } = req.body;

        const imageUrl = image_url || image;
        const eventDateValue = event_date || eventDate;
        const eventTimeValue = event_time || eventTime;
        const readTimeValue = read_time || readTime;
        const featured = is_featured !== undefined ? is_featured : isFeatured;
        const published =
            is_published !== undefined ? is_published : isPublished;

        // Ensure the event exists
        const exists = await query("SELECT * FROM events WHERE id = $1", [id]);
        if (exists.rows.length === 0) {
            return res.status(404).json({ error: "Event not found" });
        }

        const result = await query(
            `
            UPDATE events SET
                title = COALESCE($1, title),
                description = COALESCE($2, description),
                excerpt = COALESCE($3, excerpt),
                image_url = COALESCE($4, image_url),
                event_date = COALESCE($5, event_date),
                event_time = COALESCE($6, event_time),
                location = COALESCE($7, location),
                category = COALESCE($8, category),
                author = COALESCE($9, author),
                read_time = COALESCE($10, read_time),
                is_featured = COALESCE($11, is_featured),
                is_published = COALESCE($12, is_published),
                status = COALESCE($13, status),
                updated_at = NOW()
            WHERE id = $14
            RETURNING *
        `,
            [
                title,
                description,
                excerpt,
                imageUrl,
                eventDateValue,
                eventTimeValue,
                location,
                category,
                author,
                readTimeValue,
                featured,
                published,
                status,
                id,
            ]
        );

        const event = result.rows[0];
        res.json({
            id: event.id,
            title: event.title,
            description: event.description,
            excerpt: event.excerpt,
            image: getFullImageUrl(event.image_url),
            image_url: getFullImageUrl(event.image_url),
            imageUrl: getFullImageUrl(event.image_url),
            eventDate: event.event_date,
            event_date: event.event_date,
            eventTime: event.event_time,
            event_time: event.event_time,
            location: event.location,
            category: event.category,
            author: event.author,
            readTime: event.read_time,
            read_time: event.read_time,
            isFeatured: event.is_featured,
            is_featured: event.is_featured,
            isPublished: event.is_published,
            is_published: event.is_published,
            createdAt: event.created_at,
            updatedAt: event.updated_at,
        });
    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({
            error: "Failed to update event",
            details: error.message,
        });
    }
});

// Toggle publish/feature for news/events
router.put("/:type/:id/publish", async (req, res) => {
    try {
        const { type, id } = req.params;
        const { is_published, isPublished } = req.body;
        const published =
            is_published !== undefined ? is_published : isPublished;

        const table =
            type === "news"
                ? "news_articles"
                : type === "events"
                ? "events"
                : null;
        if (!table) return res.status(400).json({ error: "Invalid type" });

        const exists = await query(`SELECT * FROM ${table} WHERE id = $1`, [
            id,
        ]);
        if (exists.rows.length === 0)
            return res.status(404).json({ error: `${type} not found` });

        const result = await query(
            `UPDATE ${table} SET is_published = COALESCE($1, is_published), updated_at = NOW() WHERE id = $2 RETURNING *`,
            [published, id]
        );

        const row = result.rows[0];
        res.json({ success: true, id: row.id, is_published: row.is_published });
    } catch (error) {
        console.error("Error toggling publish:", error);
        res.status(500).json({
            error: "Failed to toggle publish",
            details: error.message,
        });
    }
});

router.put("/:type/:id/feature", async (req, res) => {
    try {
        const { type, id } = req.params;
        const { is_featured, isFeatured } = req.body;
        const featured = is_featured !== undefined ? is_featured : isFeatured;

        const table =
            type === "news"
                ? "news_articles"
                : type === "events"
                ? "events"
                : null;
        if (!table) return res.status(400).json({ error: "Invalid type" });

        const exists = await query(`SELECT * FROM ${table} WHERE id = $1`, [
            id,
        ]);
        if (exists.rows.length === 0)
            return res.status(404).json({ error: `${type} not found` });

        const result = await query(
            `UPDATE ${table} SET is_featured = COALESCE($1, is_featured), updated_at = NOW() WHERE id = $2 RETURNING *`,
            [featured, id]
        );

        const row = result.rows[0];
        res.json({ success: true, id: row.id, is_featured: row.is_featured });
    } catch (error) {
        console.error("Error toggling feature:", error);
        res.status(500).json({
            error: "Failed to toggle feature",
            details: error.message,
        });
    }
});

// Delete news article
router.delete("/news/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            "DELETE FROM news_articles WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "News article not found" });
        }

        res.json({
            success: true,
            message: "News article deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting news article:", error);
        res.status(500).json({ error: "Failed to delete news article" });
    }
});

// Delete event
router.delete("/events/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            "DELETE FROM events WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Event not found" });
        }

        res.json({ success: true, message: "Event deleted successfully" });
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ error: "Failed to delete event" });
    }
});

// Health check endpoint
router.get("/health", async (req, res) => {
    try {
        const newsCount = await query(
            "SELECT COUNT(*) FROM news_articles WHERE is_published = true AND status = $1",
            ["published"]
        );
        const eventsCount = await query(
            "SELECT COUNT(*) FROM events WHERE is_published = true AND status = $1",
            ["published"]
        );

        res.json({
            status: "OK",
            module: "News & Events",
            timestamp: new Date().toISOString(),
            counts: {
                news: parseInt(newsCount.rows[0].count),
                events: parseInt(eventsCount.rows[0].count),
            },
            endpoints: {
                all: "GET /api/newsevents/all",
                news: "GET /api/newsevents/news",
                events: "GET /api/newsevents/events",
                featured: "GET /api/newsevents/featured",
                health: "GET /api/newsevents/health",
            },
        });
    } catch (error) {
        res.status(500).json({
            status: "Error",
            module: "News & Events",
            error: error.message,
        });
    }
});

module.exports = router;
