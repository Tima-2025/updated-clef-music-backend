const db = require('../config/db');

// --- Create a new order (with stock checks and parameterized inserts) ---
const createOrder = async (req, res) => {
    const { shipping_address_id } = req.body;
    const userId = req.user.id;

    try {
        await db.query('BEGIN');

        // Lock product rows to prevent overselling and read cart
        const cartItemsQuery = `
            SELECT ci.product_id, ci.quantity, p.price, p.stock
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.user_id = $1
            FOR UPDATE OF p
        `;
        const { rows: cartItems } = await db.query(cartItemsQuery, [userId]);

        if (cartItems.length === 0) {
            await db.query('ROLLBACK');
            return res.status(400).json({ message: 'Your cart is empty' });
        }

        // Check stock availability
        const outOfStock = cartItems.find(item => item.quantity > item.stock);
        if (outOfStock) {
            await db.query('ROLLBACK');
            return res.status(400).json({ message: 'Insufficient stock for one or more items' });
        }

        // Calculate total amount
        const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        // Create the order
        const orderQuery = 'INSERT INTO orders (user_id, total_amount, shipping_address_id) VALUES ($1, $2, $3) RETURNING id';
        const { rows: orderRows } = await db.query(orderQuery, [userId, totalAmount, shipping_address_id]);
        const orderId = orderRows[0].id;

        // Parameterized bulk insert for order_items using UNNEST
        const productIds = cartItems.map(i => i.product_id);
        const quantities = cartItems.map(i => i.quantity);
        const prices = cartItems.map(i => i.price);

        const insertItemsQuery = `
            INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
            SELECT $1, UNNEST($2::int[]), UNNEST($3::int[]), UNNEST($4::numeric[])
        `;
        await db.query(insertItemsQuery, [orderId, productIds, quantities, prices]);

        // Decrement stock
        for (const item of cartItems) {
            await db.query(
                'UPDATE products SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [item.quantity, item.product_id]
            );
        }

        // Clear cart
        await db.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

        await db.query('COMMIT');
        res.status(201).json({ message: 'Order created successfully', orderId });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: 'Error creating order' });
    }
};

// --- Get orders for the logged-in user (paginated) ---
const getUserOrders = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
        const offset = (page - 1) * limit;

        const dataQuery = 'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
        const countQuery = 'SELECT COUNT(*) FROM orders WHERE user_id = $1';

        const [{ rows }, { rows: countRows }] = await Promise.all([
            db.query(dataQuery, [req.user.id, limit, offset]),
            db.query(countQuery, [req.user.id]),
        ]);

        const total = parseInt(countRows[0].count, 10);
        res.json({ data: rows, page, limit, total });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching orders' });
    }
};

// --- Get a single order by ID with its items ---
const getOrderById = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        // Get order details
        const orderQuery = 'SELECT * FROM orders WHERE id = $1 AND user_id = $2';
        const { rows: orderRows } = await db.query(orderQuery, [id, userId]);

        if (orderRows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }
        const order = orderRows[0];

        // Get order items
        const itemsQuery = `
            SELECT oi.quantity, oi.price_at_purchase, p.name, p.image_url
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = $1
        `;
        const { rows: itemsRows } = await db.query(itemsQuery, [id]);

        // Combine and send response
        res.json({ ...order, items: itemsRows });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching order details' });
    }
};

module.exports = {
    createOrder,
    getUserOrders,
    getOrderById,
};
