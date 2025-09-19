const express = require('express');
const { celebrate, Joi, Segments } = require('celebrate');
const {
    getCartItems,
    addCartItem,
    updateCartItem,
    deleteCartItem
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, getCartItems);

router.post(
    '/',
    protect,
    celebrate({
        [Segments.BODY]: Joi.object({
            productId: Joi.number().integer().required(),
            quantity: Joi.number().integer().min(1).max(9999).required(),
        }),
    }),
    addCartItem
);

router.put(
    '/items/:productId',
    protect,
    celebrate({
        [Segments.PARAMS]: Joi.object({ productId: Joi.number().integer().required() }),
        [Segments.BODY]: Joi.object({ quantity: Joi.number().integer().min(1).max(9999).required() }),
    }),
    updateCartItem
);

router.delete(
    '/items/:productId',
    protect,
    celebrate({ [Segments.PARAMS]: Joi.object({ productId: Joi.number().integer().required() }) }),
    deleteCartItem
);

module.exports = router;