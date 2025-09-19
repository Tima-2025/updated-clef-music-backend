const db = require('../config/db');
const { sendInquiryEmail, sendVisitorNotificationEmail } = require('../utils/email');
const sendWhatsAppMessage = require('../utils/whatsapp');

// --- Track website visitor ---
const trackVisitor = async (req, res) => {
    const { email, userId, userAgent, ipAddress, pageUrl, referrer } = req.body;
    
    try {
        // If email is provided, check if user exists
        let visitorId = null;
        let visitorEmail = email;
        
        if (userId) {
            // Check if user exists
            const userResult = await db.query('SELECT id, email, name FROM users WHERE id = $1', [userId]);
            if (userResult.rows.length > 0) {
                visitorId = userId;
                visitorEmail = userResult.rows[0].email;
            }
        } else if (email) {
            // Check if email exists in users table
            const userResult = await db.query('SELECT id, email, name FROM users WHERE email = $1', [email]);
            if (userResult.rows.length > 0) {
                visitorId = userResult.rows[0].id;
            }
        }

        // Insert visitor record
        const insertVisitorQuery = `
            INSERT INTO visitors (user_id, email, user_agent, ip_address, page_url, referrer, visited_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING id
        `;
        
        const visitorResult = await db.query(insertVisitorQuery, [
            visitorId,
            visitorEmail,
            userAgent,
            ipAddress,
            pageUrl,
            referrer
        ]);

        const visitorRecordId = visitorResult.rows[0].id;

        // Create notification for the visitor
        await createNotification(visitorRecordId, visitorEmail, visitorId);

        res.status(201).json({
            message: 'Visitor tracked successfully',
            visitorId: visitorRecordId,
            notificationSent: true
        });

    } catch (error) {
        console.error('Error tracking visitor:', error);
        res.status(500).json({ message: 'Server error while tracking visitor' });
    }
};

// --- Create notification for visitor ---
const createNotification = async (visitorRecordId, email, userId) => {
    try {
        // Insert notification record
        const notificationQuery = `
            INSERT INTO notifications (visitor_id, user_id, email, type, title, message, created_at, status)
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), 'pending')
            RETURNING id
        `;

        const notificationData = [
            visitorRecordId,
            userId,
            email,
            'welcome_visit',
            'Welcome to our website!',
            'Thank you for visiting our website. We have special offers just for you!'
        ];

        const notificationResult = await db.query(notificationQuery, notificationData);
        const notificationId = notificationResult.rows[0].id;

        // Send notification via email
        if (email) {
            await sendVisitorNotificationEmail(email, notificationData[4], notificationData[5]);
        }

        // Send notification via WhatsApp (if phone number available)
        if (userId) {
            const userResult = await db.query('SELECT phone FROM users WHERE id = $1', [userId]);
            if (userResult.rows.length > 0 && userResult.rows[0].phone) {
                try {
                    await sendWhatsAppMessage(
                        userResult.rows[0].phone,
                        `Hello! Welcome to our website! ${notificationData[5]}`
                    );
                } catch (whatsappError) {
                    console.error('WhatsApp notification failed:', whatsappError);
                }
            }
        }

        // Update notification status
        await db.query(
            'UPDATE notifications SET status = $1, sent_at = NOW() WHERE id = $2',
            ['sent', notificationId]
        );

    } catch (error) {
        console.error('Error creating notification:', error);
        // Update notification status to failed
        await db.query(
            'UPDATE notifications SET status = $1 WHERE visitor_id = $2',
            ['failed', visitorRecordId]
        );
    }
};


// --- Get visitor statistics ---
const getVisitorStats = async (req, res) => {
    try {
        const statsQuery = `
            SELECT 
                COUNT(*) as total_visitors,
                COUNT(DISTINCT email) as unique_visitors,
                COUNT(DISTINCT user_id) as registered_visitors,
                DATE(visited_at) as visit_date
            FROM visitors 
            WHERE visited_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(visited_at)
            ORDER BY visit_date DESC
        `;

        const { rows } = await db.query(statsQuery);
        res.json({ visitorStats: rows });

    } catch (error) {
        console.error('Error fetching visitor stats:', error);
        res.status(500).json({ message: 'Server error while fetching visitor statistics' });
    }
};

// --- Get notifications for a user ---
const getUserNotifications = async (req, res) => {
    const { userId } = req.params;

    try {
        const notificationsQuery = `
            SELECT n.*, v.page_url, v.visited_at
            FROM notifications n
            LEFT JOIN visitors v ON n.visitor_id = v.id
            WHERE n.user_id = $1 OR n.email = (SELECT email FROM users WHERE id = $1)
            ORDER BY n.created_at DESC
            LIMIT 50
        `;

        const { rows } = await db.query(notificationsQuery, [userId]);
        res.json({ notifications: rows });

    } catch (error) {
        console.error('Error fetching user notifications:', error);
        res.status(500).json({ message: 'Server error while fetching notifications' });
    }
};

// --- Mark notification as read ---
const markNotificationAsRead = async (req, res) => {
    const { notificationId } = req.params;

    try {
        await db.query(
            'UPDATE notifications SET status = $1, read_at = NOW() WHERE id = $2',
            ['read', notificationId]
        );

        res.json({ message: 'Notification marked as read' });

    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Server error while updating notification' });
    }
};

module.exports = {
    trackVisitor,
    getVisitorStats,
    getUserNotifications,
    markNotificationAsRead
};
