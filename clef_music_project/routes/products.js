const express = require('express');
const { celebrate, Joi, Segments } = require('celebrate');
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    inquireAboutProduct // --- NEW ---
} = require('../controllers/productController');
const { protect } = require('../middleware/auth'); // --- MODIFIED ---: Removed admin as it's not used in all routes
const { admin } = require('../middleware/admin'); // --- NEW ---

const router = express.Router();

router.get(
    '/',
    celebrate({
        [Segments.QUERY]: Joi.object({
            page: Joi.number().integer().min(1).optional(),
            limit: Joi.number().integer().min(1).max(100).optional(),
            category_id: Joi.number().integer().optional(),
        }),
    }),
    getProducts
);

router.post(
    '/',
    protect,
    admin,
    celebrate({
        [Segments.BODY]: Joi.object({
            name: Joi.string().min(2).max(200).required(),
            description: Joi.string().allow('').max(2000).required(),
            price: Joi.number().precision(2).min(0).required(),
            stock: Joi.number().integer().min(0).required(),
            category_id: Joi.number().integer().required(),
            image_url: Joi.string().uri().allow('').required(),
        }),
    }),
    createProduct
);

router.get(
    '/:id',
    celebrate({ [Segments.PARAMS]: Joi.object({ id: Joi.number().integer().required() }) }),
    getProductById
);

router.put(
    '/:id',
    protect,
    admin,
    celebrate({
        [Segments.PARAMS]: Joi.object({ id: Joi.number().integer().required() }),
        [Segments.BODY]: Joi.object({
            name: Joi.string().min(2).max(200).required(),
            description: Joi.string().allow('').max(2000).required(),
            price: Joi.number().precision(2).min(0).required(),
            stock: Joi.number().integer().min(0).required(),
            category_id: Joi.number().integer().required(),
            image_url: Joi.string().uri().allow('').required(),
        }),
    }),
    updateProduct
);

router.delete(
    '/:id',
    protect,
    admin,
    celebrate({ [Segments.PARAMS]: Joi.object({ id: Joi.number().integer().required() }) }),
    deleteProduct
);

// --- NEW: Route for product inquiry ---
router.post(
    '/:id/inquire',
    protect,
    celebrate({
        [Segments.PARAMS]: Joi.object({ id: Joi.number().integer().required() }),
        [Segments.BODY]: Joi.object({ phone: Joi.string().min(7).max(20).required() })
    }),
    inquireAboutProduct
);

module.exports = router;