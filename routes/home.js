const express = require('express');
const router = express.Router();
const { getPool } = require('../db');

// GET all home page data at once - fetches from existing endpoints
router.get('/', async (req, res) => {
    try {
        console.log('🔄 Home route: Fetching data from existing endpoints...');
        
        let featuredDesigns = [];
        let researchHighlights = [];
        let upcomingEvents = [];

        // Try to get featured designs from items endpoint
        try {
            console.log('📦 Fetching featured designs from /api/items...');
            const response = await fetch(`http://localhost:${process.env.PORT || 4000}/api/items`);
            if (response.ok) {
                const result = await response.json();
                featuredDesigns = result.items || result.data || [];
                console.log(`✅ Got ${featuredDesigns.length} items for featured designs`);
                
                // Limit to 3 featured designs and add type if missing
                featuredDesigns = featuredDesigns.slice(0, 3).map(item => ({
                    id: item.id,
                    title: item.title || item.name || 'Untitled Project',
                    type: item.type || item.category || 'Architecture',
                    image: item.image || item.image_url || '/images/placeholder.jpg',
                    description: item.description || 'No description available'
                }));
            }
        } catch (error) {
            console.log('❌ Failed to fetch items, using fallback data');
            featuredDesigns = getMockFeaturedDesigns();
        }

        // Try to get research highlights from research endpoint
        try {
            console.log('📚 Fetching research from /api/research/articles...');
            const response = await fetch(`http://localhost:${process.env.PORT || 4000}/api/research/articles`);
            if (response.ok) {
                const result = await response.json();
                researchHighlights = result.articles || result.data || [];
                console.log(`✅ Got ${researchHighlights.length} research articles`);
                
                // Limit to 3 research highlights
                researchHighlights = researchHighlights.slice(0, 3).map(article => ({
                    id: article.id,
                    title: article.title || 'Research Article',
                    author: article.author || 'ASPIRE Team',
                    date: article.date || article.created_at || new Date().toISOString().split('T')[0],
                    excerpt: article.excerpt || article.description || 'Research content coming soon...'
                }));
            }
        } catch (error) {
            console.log('❌ Failed to fetch research, using fallback data');
            researchHighlights = getMockResearchHighlights();
        }

        // Try to get upcoming events from education endpoint
        try {
            console.log('📅 Fetching events from /api/education/exhibitions...');
            const response = await fetch(`http://localhost:${process.env.PORT || 4000}/api/education/exhibitions`);
            if (response.ok) {
                const result = await response.json();
                upcomingEvents = result.exhibitions || result.data || [];
                console.log(`✅ Got ${upcomingEvents.length} events`);
                
                // Limit to 3 upcoming events and format them
                upcomingEvents = upcomingEvents.slice(0, 3).map(event => ({
                    id: event.id,
                    title: event.title || event.name || 'Upcoming Event',
                    date: event.date || event.event_date || new Date().toISOString().split('T')[0],
                    time: event.time || event.event_time || 'TBA',
                    location: event.location || event.venue || 'Location TBA',
                    image: event.image || event.image_url || '/images/event-placeholder.jpg'
                }));
            }
        } catch (error) {
            console.log('❌ Failed to fetch events, using fallback data');
            upcomingEvents = getMockUpcomingEvents();
        }

        console.log('🎉 Home data compiled successfully:', {
            designs: featuredDesigns.length,
            research: researchHighlights.length,
            events: upcomingEvents.length
        });

        res.json({
            success: true,
            data: {
                featuredDesigns,
                researchHighlights, 
                upcomingEvents
            },

        });
    } catch (error) {
        console.error('💥 Error in home route:', error);
        // Fallback to mock data if everything fails
        res.json({
            success: true,
            data: {
                featuredDesigns: getMockFeaturedDesigns(),
                researchHighlights: getMockResearchHighlights(),
                upcomingEvents: getMockUpcomingEvents()
            },
            message: 'Home page data fetched successfully (using fallback data)'
        });
    }
});

// Mock data fallback (only used if endpoints fail)
const getMockFeaturedDesigns = () => [
    {
        id: 1,
        title: "Urban Green Park",
        type: "Public Space",
        image: "/images/park.jpg",
        description: "Sustainable urban park design integrating native vegetation and community spaces",
    },
    {
        id: 2,
        title: "Modern Campus Library", 
        type: "Educational",
        image: "/images/library.jpg",
        description: "Innovative learning environment with sustainable features and flexible spaces",
    },
    {
        id: 3,
        title: "Luxury Residential Villa",
        type: "Residential", 
        image: "/images/villa.jpg",
        description: "Contemporary villa blending modern architecture with natural landscapes",
    },
];

const getMockResearchHighlights = () => [
    {
        id: 1,
        title: "Biophilic Design in Urban Environments",
        author: "Dr. Elena Rodriguez",
        date: "May 2023",
        excerpt: "Exploring how natural elements in urban design improve wellbeing and environmental performance through integrated green spaces and natural materials.",
    },
    {
        id: 2,
        title: "Sustainable Materials in Modern Architecture",
        author: "Michael Chen", 
        date: "April 2023",
        excerpt: "Analysis of innovative sustainable materials and their application in contemporary building design, focusing on lifecycle assessment and environmental impact.",
    },
    {
        id: 3,
        title: "Adaptive Reuse of Industrial Spaces",
        author: "Sarah Johnson",
        date: "March 2023",
        excerpt: "Transforming former industrial buildings into vibrant community spaces while preserving architectural heritage and reducing construction waste.",
    },
];

const getMockUpcomingEvents = () => [
    {
        id: 1,
        title: "Architecture Exhibition Opening",
        date: "2023-06-15",
        time: "6:00 PM",
        location: "City Art Gallery",
        image: "/images/exhibition.jpg",
    },
    {
        id: 2,
        title: "Sustainable Design Workshop", 
        date: "2023-06-22",
        time: "2:00 PM", 
        location: "Community Center",
        image: "/images/workshop.jpg",
    },
    {
        id: 3,
        title: "Urban Planning Conference",
        date: "2023-07-05",
        time: "9:00 AM",
        location: "Convention Center", 
        image: "/images/conference.jpg",
    },
];

// Health check for home routes
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        module: 'Home Routes',
        timestamp: new Date().toISOString(),
        description: 'Fetches data from existing endpoints: items, research/articles, education/exhibitions',
        endpoints: {
            all_data: 'GET /api/home',
            health: 'GET /api/home/health'
        },
        sourceEndpoints: {
            featured_designs: 'GET /api/items',
            research_highlights: 'GET /api/research/articles', 
            upcoming_events: 'GET /api/education/exhibitions'
        }
    });
});

module.exports = router;