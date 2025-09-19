const express = require('express');
const { celebrate, Joi, Segments } = require('celebrate');
const {
    getUserProfile,
    updateUserProfile,
    getUserAddresses,
    addUserAddress
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/me', protect, getUserProfile);

router.put(
    '/me',
    protect,
    celebrate({
        [Segments.BODY]: Joi.object({
            name: Joi.string().min(2).max(100).required(),
            email: Joi.string().email().required(),
        }),
    }),
    updateUserProfile
);

router.get('/me/addresses', protect, getUserAddresses);

router.post(
    '/me/addresses',
    protect,
    celebrate({
        [Segments.BODY]: Joi.object({
            street: Joi.string().min(2).max(200).required(),
            city: Joi.string().min(2).max(100).required(),
            state: Joi.string().min(2).max(100).required(),
            zip_code: Joi.string().min(2).max(20).required(),
            country: Joi.string().min(2).max(100).required(),
        }),
    }),
    addUserAddress
);

module.exports = router;