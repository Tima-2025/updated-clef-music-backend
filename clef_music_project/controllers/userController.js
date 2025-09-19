const db = require('../config/db');

// --- Get user profile ---
const getUserProfile = async (req, res) => {
    // req.user is attached by the 'protect' middleware
    res.json(req.user);
};

// --- Update user profile ---
const updateUserProfile = async (req, res) => {
    const { name, email } = req.body;
    const userId = req.user.id;

    try {
        const { rows } = await db.query(
            'UPDATE users SET name = $1, email = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, name, email, role',
            [name, email, userId]
        );
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating user profile' });
    }
};

// --- Get user addresses ---
const getUserAddresses = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM addresses WHERE user_id = $1', [req.user.id]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching addresses' });
    }
};

// --- Add a new address for a user ---
const addUserAddress = async (req, res) => {
    const { street, city, state, zip_code, country } = req.body;
    const userId = req.user.id;

    try {
        const { rows } = await db.query(
            'INSERT INTO addresses (user_id, street, city, state, zip_code, country) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [userId, street, city, state, zip_code, country]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding address' });
    }
};

module.exports = {
    getUserProfile,
    updateUserProfile,
    getUserAddresses,
    addUserAddress,
};