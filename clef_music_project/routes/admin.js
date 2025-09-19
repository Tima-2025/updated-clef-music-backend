const express = require('express');
const { celebrate, Joi } = require('celebrate');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');
const db = require('../config/db');
const {
    getAllUsers,
    updateUserRole,
    deleteUser,
    getVisitorStatistics,
    createAdminUser
} = require('../controllers/adminController');

const {
    sendNotificationToAllUsers,
    sendNotificationToUser,
    sendNotificationToVisitors
} = require('../controllers/adminNotificationController');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(admin);

// --- Create admin user ---
router.post('/create-admin',
    celebrate({
        body: Joi.object({
            name: Joi.string().required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(6).required()
        })
    }),
    createAdminUser
);

// --- Get all users with pagination and search ---
router.get('/users',
    celebrate({
        query: Joi.object({
            page: Joi.number().integer().min(1).optional(),
            limit: Joi.number().integer().min(1).max(100).optional(),
            search: Joi.string().optional(),
            role: Joi.string().valid('admin', 'user').optional()
        })
    }),
    getAllUsers
);

// --- Update user role ---
router.patch('/users/:userId/role',
    celebrate({
        params: Joi.object({
            userId: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            role: Joi.string().valid('admin', 'user').required()
        })
    }),
    updateUserRole
);

// --- Delete user ---
router.delete('/users/:userId',
    celebrate({
        params: Joi.object({
            userId: Joi.number().integer().positive().required()
        })
    }),
    deleteUser
);

// --- Get visitor statistics ---
router.get('/statistics',
    celebrate({
        query: Joi.object({
            days: Joi.number().integer().min(1).max(365).optional()
        })
    }),
    getVisitorStatistics
);

// --- Get admin dashboard data ---
router.get('/dashboard', async (req, res) => {
    try {
        // Get quick stats for dashboard
        const [
            totalUsersResult,
            totalVisitorsResult,
            recentNotificationsResult,
            systemStatsResult
        ] = await Promise.all([
            db.query('SELECT COUNT(*) as count FROM users'),
            db.query('SELECT COUNT(*) as count FROM visitors WHERE visited_at >= NOW() - INTERVAL \'7 days\''),
            db.query('SELECT COUNT(*) as count FROM notifications WHERE created_at >= NOW() - INTERVAL \'24 hours\''),
            db.query('SELECT COUNT(*) as count FROM users WHERE role = \'admin\'')
        ]);

        res.json({
            dashboard: {
                totalUsers: parseInt(totalUsersResult.rows[0].count),
                totalVisitors: parseInt(totalVisitorsResult.rows[0].count),
                recentNotifications: parseInt(recentNotificationsResult.rows[0].count),
                totalAdmins: parseInt(systemStatsResult.rows[0].count)
            },
            lastUpdated: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ message: 'Server error while fetching dashboard data' });
    }
});

// --- Send notification to all users ---
router.post('/notifications/send-to-all',
    celebrate({
        body: Joi.object({
            title: Joi.string().required(),
            message: Joi.string().required(),
            type: Joi.string().valid('general', 'promotion', 'update', 'alert').optional()
        })
    }),
    sendNotificationToAllUsers
);

// --- Send notification to specific user ---
router.post('/notifications/send-to-user/:userId',
    celebrate({
        params: Joi.object({
            userId: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            title: Joi.string().required(),
            message: Joi.string().required(),
            type: Joi.string().valid('general', 'promotion', 'update', 'alert').optional()
        })
    }),
    sendNotificationToUser
);

// --- Send notification to specific visitors by email ---
router.post('/notifications/send-to-visitors',
    celebrate({
        body: Joi.object({
            emails: Joi.array().items(Joi.string().email()).min(1).required(),
            title: Joi.string().required(),
            message: Joi.string().required(),
            type: Joi.string().valid('general', 'promotion', 'update', 'alert').optional()
        })
    }),
    sendNotificationToVisitors
);

module.exports = router;
