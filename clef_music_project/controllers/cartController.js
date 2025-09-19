const db = require('../config/db');

// --- Get all items in the user's cart ---
const getCartItems = async (req, res) => {
    try {
        const query = `
            SELECT ci.product_id, ci.quantity, p.name, p.price, p.image_url
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.user_id = $1
        `;
        const { rows } = await db.query(query, [req.user.id]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- Add an item to the cart ---
const addCartItem = async (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    try {
        // Using an "upsert" query to either insert a new item or update the quantity if it already exists
        const upsertQuery = `
            INSERT INTO cart_items (user_id, product_id, quantity)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, product_id)
            DO UPDATE SET quantity = cart_items.quantity + $3, updated_at = CURRENT_TIMESTAMP
            RETURNING *;
        `;
        const { rows } = await db.query(upsertQuery, [userId, productId, quantity]);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding item to cart' });
    }
};

// --- Update quantity of a cart item ---
const updateCartItem = async (req, res) => {
    const { quantity } = req.body;
    const { productId } = req.params;
    const userId = req.user.id;

    try {
        const { rows } = await db.query(
            'UPDATE cart_items SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND product_id = $3 RETURNING *',
            [quantity, userId, productId]
        );
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ message: 'Cart item not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating cart item' });
    }
};

// --- Delete an item from the cart ---
const deleteCartItem = async (req, res) => {
    const { productId } = req.params;
    const userId = req.user.id;

    try {
        const result = await db.query(
            'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2',
            [userId, productId]
        );
        if (result.rowCount > 0) {
            res.json({ message: 'Item removed from cart' });
        } else {
            res.status(404).json({ message: 'Cart item not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting cart item' });
    }
};

module.exports = {
    getCartItems,
    addCartItem,
    updateCartItem,
    deleteCartItem,
};
