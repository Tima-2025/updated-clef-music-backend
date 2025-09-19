const express = require('express');
const { celebrate, Joi, Segments } = require('celebrate');
const { registerUser, loginUser } = require('../controllers/authController');
const router = express.Router();

router.post(
    '/register',
    celebrate({
        [Segments.BODY]: Joi.object({
            name: Joi.string().min(2).max(100).required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(8).max(100).required(),
        }),
    }),
    registerUser
);

router.post(
    '/login',
    celebrate({
        [Segments.BODY]: Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().min(8).max(100).required(),
        }),
    }),
    loginUser
);

module.exports = router;