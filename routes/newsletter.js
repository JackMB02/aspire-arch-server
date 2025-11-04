const express = require("express");
const router = express.Router();
const { query } = require("../db");

// @desc    Subscribe to newsletter
// @route   POST /api/newsletter/subscribe
// @access  Public
router.post("/subscribe", async (req, res) => {
    try {
        const { email } = req.body;

        // Validate email
        if (!email || !email.includes("@")) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address",
            });
        }

        // Check if email already exists
        const existingSubscriber = await query(
            "SELECT * FROM newsletter_subscribers WHERE email = $1",
            [email.toLowerCase()]
        );

        if (existingSubscriber.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "This email is already subscribed to our newsletter",
            });
        }

        // Insert new subscriber
        await query(
            "INSERT INTO newsletter_subscribers (email, subscribed_at) VALUES ($1, CURRENT_TIMESTAMP)",
            [email.toLowerCase()]
        );

        res.status(201).json({
            success: true,
            message: "Successfully subscribed to newsletter!",
        });
    } catch (error) {
        console.error("Newsletter subscription error:", error);
        res.status(500).json({
            success: false,
            message: "Error subscribing to newsletter",
        });
    }
});

// @desc    Get all newsletter subscribers (admin)
// @route   GET /api/newsletter/subscribers
// @access  Private
router.get("/subscribers", async (req, res) => {
    try {
        const result = await query(
            "SELECT id, email, subscribed_at FROM newsletter_subscribers ORDER BY subscribed_at DESC"
        );

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows,
        });
    } catch (error) {
        console.error("Get newsletter subscribers error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching newsletter subscribers",
        });
    }
});

// @desc    Unsubscribe from newsletter
// @route   DELETE /api/newsletter/unsubscribe/:email
// @access  Public
router.delete("/unsubscribe/:email", async (req, res) => {
    try {
        const { email } = req.params;

        const result = await query(
            "DELETE FROM newsletter_subscribers WHERE email = $1 RETURNING *",
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Email not found in newsletter subscribers",
            });
        }

        res.status(200).json({
            success: true,
            message: "Successfully unsubscribed from newsletter",
        });
    } catch (error) {
        console.error("Newsletter unsubscribe error:", error);
        res.status(500).json({
            success: false,
            message: "Error unsubscribing from newsletter",
        });
    }
});

module.exports = router;
