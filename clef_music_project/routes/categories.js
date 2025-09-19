const express = require('express');
const { celebrate, Joi, Segments } = require('celebrate');
const {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');
const { protect } = require('../middleware/auth'); // --- MODIFIED ---
const { admin } = require('../middleware/admin'); // --- NEW ---

const router = express.Router();

router.get('/', getCategories);

router.post(
    '/',
    protect,
    admin,
    celebrate({
        [Segments.BODY]: Joi.object({
            name: Joi.string().min(2).max(200).required(),
            description: Joi.string().allow('').max(1000).required(),
        }),
    }),
    createCategory
);

router.put(
    '/:id',
    protect,
    admin,
    celebrate({
        [Segments.PARAMS]: Joi.object({ id: Joi.number().integer().required() }),
        [Segments.BODY]: Joi.object({
            name: Joi.string().min(2).max(200).required(),
            description: Joi.string().allow('').max(1000).required(),
        }),
    }),
    updateCategory
);

router.delete(
    '/:id',
    protect,
    admin,
    celebrate({ [Segments.PARAMS]: Joi.object({ id: Joi.number().integer().required() }) }),
    deleteCategory
);

module.exports = router;
