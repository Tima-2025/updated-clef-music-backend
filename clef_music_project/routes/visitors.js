const express = require('express');
const { celebrate, Joi } = require('celebrate');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');
const {
    trackVisitor,
    getVisitorStats,
    getUserNotifications,
    markNotificationAsRead
} = require('../controllers/visitorController');

const router = express.Router();

// --- Track visitor (public endpoint) ---
router.post('/track', 
    celebrate({
        body: Joi.object({
            email: Joi.string().email().optional(),
            userId: Joi.number().integer().positive().optional(),
            userAgent: Joi.string().optional(),
            ipAddress: Joi.string().optional(),
            pageUrl: Joi.string().uri().optional(),
            referrer: Joi.string().uri().allow('').optional(),
            timestamp: Joi.string().isoDate().optional()
        }).min(1) // At least one field is required
    }),
    trackVisitor
);

// --- Get visitor statistics (admin only) ---
router.get('/stats', 
    protect,
    admin,
    getVisitorStats
);

// --- Get user notifications (authenticated users) ---
router.get('/notifications/:userId',
    protect,
    celebrate({
        params: Joi.object({
            userId: Joi.number().integer().positive().required()
        })
    }),
    getUserNotifications
);

// --- Mark notification as read (authenticated users) ---
router.patch('/notifications/:notificationId/read',
    protect,
    celebrate({
        params: Joi.object({
            notificationId: Joi.number().integer().positive().required()
        })
    }),
    markNotificationAsRead
);

module.exports = router;
