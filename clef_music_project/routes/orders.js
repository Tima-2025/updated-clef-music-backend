const express = require('express');
const { celebrate, Joi, Segments } = require('celebrate');
const {
    createOrder,
    getUserOrders,
    getOrderById
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post(
    '/',
    protect,
    celebrate({
        [Segments.BODY]: Joi.object({
            shipping_address_id: Joi.number().integer().required(),
        }),
    }),
    createOrder
);

router.get('/', protect, getUserOrders);

router.get(
    '/:id',
    protect,
    celebrate({ [Segments.PARAMS]: Joi.object({ id: Joi.number().integer().required() }) }),
    getOrderById
);

module.exports = router;