const express = require('express');
const router = express.Router();
const { query } = require('../db');

// Helper function to construct proper image URLs
const getFullImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    
    if (imagePath.startsWith('data:')) {
        return imagePath;
    }
    
    const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
    return `${baseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

// Get all news articles
router.get('/news', async (req, res) => {
    try {
        const result = await query(`
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
            WHERE is_published = true AND status = $1
            ORDER BY date DESC, created_at DESC
        `, ['published']);

        const news = result.rows.map(article => ({
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
            createdAt: article.createdAt
        }));

        console.log('News API Response:', news.length, 'articles found');
        res.json(news);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Failed to fetch news articles' });
    }
});

// Get all events
router.get('/events', async (req, res) => {
    try {
        const result = await query(`
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
            WHERE is_published = true AND status = $1
            ORDER BY event_date ASC, created_at DESC
        `, ['published']);

        const events = result.rows.map(event => ({
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
            createdAt: event.createdAt
        }));

        console.log('Events API Response:', events.length, 'events found');
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Get combined news and events for the main page
router.get('/all', async (req, res) => {
    try {
        const newsResult = await query(`
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
                created_at as "createdAt"
            FROM news_articles 
            WHERE is_published = true AND status = $1
            ORDER BY date DESC
            LIMIT 6
        `, ['published']);

        const eventsResult = await query(`
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
                created_at as "createdAt"
            FROM events 
            WHERE is_published = true AND status = $1
            ORDER BY event_date ASC
            LIMIT 6
        `, ['published']);

        const news = newsResult.rows.map(article => ({
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
            createdAt: article.createdAt
        }));

        const events = eventsResult.rows.map(event => ({
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
            createdAt: event.createdAt
        }));

        // Combine and sort by date
        const allItems = [...news, ...events].sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json(allItems);
    } catch (error) {
        console.error('Error fetching news and events:', error);
        res.status(500).json({ error: 'Failed to fetch news and events' });
    }
});

// Get featured news and events
router.get('/featured', async (req, res) => {
    try {
        const featuredNews = await query(`
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
        `, ['published']);

        const featuredEvents = await query(`
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
        `, ['published']);

        const featuredItems = [
            ...featuredNews.rows.map(article => ({
                ...article,
                image: getFullImageUrl(article.image)
            })),
            ...featuredEvents.rows.map(event => ({
                ...event,
                image: getFullImageUrl(event.image)
            }))
        ];

        res.json(featuredItems);
    } catch (error) {
        console.error('Error fetching featured items:', error);
        res.status(500).json({ error: 'Failed to fetch featured news and events' });
    }
});

// Get single news article by ID
router.get('/news/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(`
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
        `, [id, 'published']);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'News article not found' });
        }

        const article = result.rows[0];
        res.json({
            ...article,
            image: getFullImageUrl(article.image)
        });
    } catch (error) {
        console.error('Error fetching news article:', error);
        res.status(500).json({ error: 'Failed to fetch news article' });
    }
});

// Get single event by ID
router.get('/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(`
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
        `, [id, 'published']);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const event = result.rows[0];
        res.json({
            ...event,
            image: getFullImageUrl(event.image)
        });
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ error: 'Failed to fetch event' });
    }
});

// Create new news article
router.post('/news', async (req, res) => {
    try {
        const { 
            title, 
            excerpt, 
            content, 
            image_url, 
            category, 
            author, 
            date, 
            read_time, 
            is_featured, 
            is_published, 
            status 
        } = req.body;

        const result = await query(`
            INSERT INTO news_articles 
                (title, excerpt, content, image_url, category, author, date, read_time, is_featured, is_published, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `, [
            title, excerpt, content, image_url, category, author, date, 
            read_time, is_featured || false, is_published || true, status || 'published'
        ]);

        const article = result.rows[0];
        res.status(201).json({
            id: article.id,
            title: article.title,
            excerpt: article.excerpt,
            content: article.content,
            image: getFullImageUrl(article.image_url),
            category: article.category,
            author: article.author,
            date: article.date,
            readTime: article.read_time,
            isFeatured: article.is_featured,
            createdAt: article.created_at
        });
    } catch (error) {
        console.error('Error creating news article:', error);
        res.status(500).json({ error: 'Failed to create news article' });
    }
});

// Create new event
router.post('/events', async (req, res) => {
    try {
        const { 
            title, 
            description, 
            excerpt, 
            image_url, 
            event_date, 
            event_time, 
            location, 
            category, 
            author, 
            read_time, 
            is_featured, 
            is_published, 
            status 
        } = req.body;

        const result = await query(`
            INSERT INTO events 
                (title, description, excerpt, image_url, event_date, event_time, location, category, author, read_time, is_featured, is_published, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `, [
            title, description, excerpt, image_url, event_date, event_time, location,
            category, author, read_time, is_featured || false, is_published || true, status || 'published'
        ]);

        const event = result.rows[0];
        res.status(201).json({
            id: event.id,
            title: event.title,
            description: event.description,
            excerpt: event.excerpt,
            image: getFullImageUrl(event.image_url),
            eventDate: event.event_date,
            eventTime: event.event_time,
            location: event.location,
            category: event.category,
            author: event.author,
            readTime: event.read_time,
            isFeatured: event.is_featured,
            createdAt: event.created_at
        });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Failed to create event' });
    }
});

// Health check endpoint
router.get('/health', async (req, res) => {
    try {
        const newsCount = await query('SELECT COUNT(*) FROM news_articles WHERE is_published = true AND status = $1', ['published']);
        const eventsCount = await query('SELECT COUNT(*) FROM events WHERE is_published = true AND status = $1', ['published']);
        
        res.json({
            status: 'OK',
            module: 'News & Events',
            timestamp: new Date().toISOString(),
            counts: {
                news: parseInt(newsCount.rows[0].count),
                events: parseInt(eventsCount.rows[0].count)
            },
            endpoints: {
                all: 'GET /api/newsevents/all',
                news: 'GET /api/newsevents/news',
                events: 'GET /api/newsevents/events',
                featured: 'GET /api/newsevents/featured',
                health: 'GET /api/newsevents/health'
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'Error',
            module: 'News & Events',
            error: error.message
        });
    }
});

module.exports = router;