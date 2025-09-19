const db = require('../config/db');
const { sendVisitorNotificationEmail } = require('../utils/email');
const sendWhatsAppMessage = require('../utils/whatsapp');

// --- Send notification to all users ---
const sendNotificationToAllUsers = async (req, res) => {
    const { title, message, type = 'general' } = req.body;

    if (!title || !message) {
        return res.status(400).json({ message: 'Title and message are required' });
    }

    try {
        // Get all users with email addresses
        const usersResult = await db.query('SELECT id, name, email, phone FROM users WHERE email IS NOT NULL');
        const users = usersResult.rows;

        let successCount = 0;
        let failCount = 0;

        // Send notification to each user
        for (const user of users) {
            try {
                // Create notification record
                await db.query(
                    'INSERT INTO notifications (user_id, email, type, title, message, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
                    [user.id, user.email, type, title, message, 'pending']
                );

                // Send email notification
                await sendVisitorNotificationEmail(user.email, title, message);

                // Send WhatsApp notification if phone available
                if (user.phone) {
                    try {
                        await sendWhatsAppMessage(user.phone, `${title}: ${message}`);
                    } catch (whatsappError) {
                        console.error(`WhatsApp notification failed for ${user.email}:`, whatsappError);
                    }
                }

                // Update notification status
                await db.query(
                    'UPDATE notifications SET status = $1, sent_at = NOW() WHERE user_id = $2 AND title = $3',
                    ['sent', user.id, title]
                );

                successCount++;

            } catch (error) {
                console.error(`Error sending notification to ${user.email}:`, error);
                failCount++;
                
                // Update notification status to failed
                await db.query(
                    'UPDATE notifications SET status = $1 WHERE user_id = $2 AND title = $3',
                    ['failed', user.id, title]
                );
            }
        }

        res.json({
            message: 'Notifications sent successfully',
            stats: {
                totalUsers: users.length,
                successful: successCount,
                failed: failCount
            }
        });

    } catch (error) {
        console.error('Error sending notifications to all users:', error);
        res.status(500).json({ message: 'Server error while sending notifications' });
    }
};

// --- Send notification to specific user ---
const sendNotificationToUser = async (req, res) => {
    const { userId } = req.params;
    const { title, message, type = 'general' } = req.body;

    if (!title || !message) {
        return res.status(400).json({ message: 'Title and message are required' });
    }

    try {
        // Get user details
        const userResult = await db.query('SELECT id, name, email, phone FROM users WHERE id = $1', [userId]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = userResult.rows[0];

        // Create notification record
        const notificationResult = await db.query(
            'INSERT INTO notifications (user_id, email, type, title, message, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id',
            [user.id, user.email, type, title, message, 'pending']
        );

        const notificationId = notificationResult.rows[0].id;

        try {
            // Send email notification
            await sendVisitorNotificationEmail(user.email, title, message);

            // Send WhatsApp notification if phone available
            if (user.phone) {
                try {
                    await sendWhatsAppMessage(user.phone, `${title}: ${message}`);
                } catch (whatsappError) {
                    console.error(`WhatsApp notification failed for ${user.email}:`, whatsappError);
                }
            }

            // Update notification status
            await db.query(
                'UPDATE notifications SET status = $1, sent_at = NOW() WHERE id = $2',
                ['sent', notificationId]
            );

            res.json({
                message: 'Notification sent successfully',
                notificationId,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            });

        } catch (error) {
            console.error(`Error sending notification to ${user.email}:`, error);
            
            // Update notification status to failed
            await db.query(
                'UPDATE notifications SET status = $1 WHERE id = $2',
                ['failed', notificationId]
            );

            throw error;
        }

    } catch (error) {
        console.error('Error sending notification to user:', error);
        res.status(500).json({ message: 'Server error while sending notification' });
    }
};

// --- Send notification to visitors by email ---
const sendNotificationToVisitors = async (req, res) => {
    const { emails, title, message, type = 'general' } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({ message: 'Email list is required' });
    }

    if (!title || !message) {
        return res.status(400).json({ message: 'Title and message are required' });
    }

    try {
        let successCount = 0;
        let failCount = 0;

        // Send notification to each email
        for (const email of emails) {
            try {
                // Create notification record (without user_id for anonymous visitors)
                await db.query(
                    'INSERT INTO notifications (email, type, title, message, status, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
                    [email, type, title, message, 'pending']
                );

                // Send email notification
                await sendVisitorNotificationEmail(email, title, message);

                // Update notification status
                await db.query(
                    'UPDATE notifications SET status = $1, sent_at = NOW() WHERE email = $2 AND title = $3',
                    ['sent', email, title]
                );

                successCount++;

            } catch (error) {
                console.error(`Error sending notification to ${email}:`, error);
                failCount++;
                
                // Update notification status to failed
                await db.query(
                    'UPDATE notifications SET status = $1 WHERE email = $2 AND title = $3',
                    ['failed', email, title]
                );
            }
        }

        res.json({
            message: 'Notifications sent successfully',
            stats: {
                totalEmails: emails.length,
                successful: successCount,
                failed: failCount
            }
        });

    } catch (error) {
        console.error('Error sending notifications to visitors:', error);
        res.status(500).json({ message: 'Server error while sending notifications' });
    }
};

module.exports = {
    sendNotificationToAllUsers,
    sendNotificationToUser,
    sendNotificationToVisitors
};
