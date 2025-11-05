const { query } = require("./db");

async function clearAllTables() {
    console.log("🗑️  Starting to clear all database tables...\n");

    const tables = [
        // Main tables
        "items",
        "contact_submissions",
        "contact_info",
        "email_settings",

        // Get Involved tables
        "membership_applications",
        "donations",
        "feedback_submissions",
        "idea_submissions",
        "community_stories",
        "partnership_inquiries",

        // Media tables
        "media_photos",
        "media_videos",
        "media_designs",
        "media_testimonials",

        // Education tables
        "education_workshops",
        "education_tutorials",
        "education_exhibitions",

        // Architecture Colleagues tables
        "architecture_colleagues_contact",
        "architecture_colleagues_team",
        "architecture_colleagues_initiatives",
        "architecture_colleagues_values",
        "architecture_colleagues_mission",

        // Research tables
        "research_articles",
        "sustainable_practices",
        "climate_strategies",
        "social_studies",
        "research_stats",

        // Design & News tables
        "design_projects",
        "news_articles",
        "events",
    ];

    try {
        for (const table of tables) {
            try {
                await query(`DELETE FROM ${table}`);
                console.log(`✅ Cleared: ${table}`);
            } catch (error) {
                console.log(`⚠️  Warning for ${table}: ${error.message}`);
            }
        }

        console.log("\n✨ Database clearing completed!");
        console.log("Note: Admin accounts were NOT deleted for security.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error clearing database:", error);
        process.exit(1);
    }
}

clearAllTables();
