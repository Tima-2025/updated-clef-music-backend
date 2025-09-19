const db = require('../config/db');

// --- Fetch all categories ---
const getCategories = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM categories ORDER BY name');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- Create a new category (Admin only) ---
const createCategory = async (req, res) => {
    const { name, description } = req.body;
    try {
        const { rows } = await db.query(
            'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
            [name, description]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating category' });
    }
};

// --- Update a category (Admin only) ---
const updateCategory = async (req, res) => {
    const { name, description } = req.body;
    const { id } = req.params;
    try {
        const { rows } = await db.query(
            'UPDATE categories SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
            [name, description, id]
        );
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating category' });
    }
};

// --- Delete a category (Admin only) ---
const deleteCategory = async (req, res) => {
    try {
        const result = await db.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
        if (result.rowCount > 0) {
            res.json({ message: 'Category removed' });
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting category' });
    }
};

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
};
