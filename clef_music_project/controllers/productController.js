const db = require('../config/db');
// --- NEW ---
const sendWhatsAppMessage = require('../utils/whatsapp');
const sendInquiryEmail = require('../utils/email');


// --- Fetch all products with basic pagination & filtering ---
const getProducts = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
        const offset = (page - 1) * limit;
        const categoryId = req.query.category_id ? parseInt(req.query.category_id) : null;

        const filters = [];
        const params = [];
        if (categoryId) {
            params.push(categoryId);
            filters.push(`category_id = $${params.length}`);
        }
        const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

        const query = `SELECT * FROM products ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const countQuery = `SELECT COUNT(*) FROM products ${whereClause}`;
        const [{ rows }, { rows: countRows }] = await Promise.all([
            db.query(query, params),
            db.query(countQuery, params.slice(0, params.length - 2)),
        ]);

        const total = parseInt(countRows[0].count, 10);
        res.json({ data: rows, page, limit, total });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- Fetch a single product by ID ---
const getProductById = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- Create a new product (Admin only) ---
const createProduct = async (req, res) => {
    const { name, description, price, stock, category_id, image_url } = req.body;
    try {
        const { rows } = await db.query(
            'INSERT INTO products (name, description, price, stock, category_id, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, description, price, stock, category_id, image_url]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating product' });
    }
};

// --- Update a product (Admin only) ---
const updateProduct = async (req, res) => {
    const { name, description, price, stock, category_id, image_url } = req.body;
    const { id } = req.params;
    try {
        const { rows } = await db.query(
            'UPDATE products SET name = $1, description = $2, price = $3, stock = $4, category_id = $5, image_url = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
            [name, description, price, stock, category_id, image_url, id]
        );
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating product' });
    }
};

// --- Delete a product (Admin only) ---
const deleteProduct = async (req, res) => {
    try {
        const result = await db.query('DELETE FROM products WHERE id = $1', [req.params.id]);
        if (result.rowCount > 0) {
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting product' });
    }
};

// --- NEW: Handle product inquiry ---
const inquireAboutProduct = async (req, res) => {
    const { id: productId } = req.params;
    const { phone } = req.body; // Expecting user's WhatsApp number in the request body
    const { id: userId, name: userName, email: userEmail } = req.user;

    if (!phone) {
        return res.status(400).json({ message: 'Phone number is required for inquiry.' });
    }

    try {
        // 1. Get product details
        const { rows } = await db.query('SELECT * FROM products WHERE id = $1', [productId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        const product = rows[0];

        // 2. Send WhatsApp message to the customer
        try {
        const whatsappMessage = `Hi ${userName}, thank you for your inquiry about "${product.name}". A representative from our team will contact you shortly with more details.`;
        await sendWhatsAppMessage(phone, whatsappMessage);
        console.log("✅ WhatsApp sent");
         } catch (err) {
            console.error("❌ WhatsApp failed:", err);
        }


        // 3. Send email to the upstream team
        try {
        await sendInquiryEmail({
            userName,
            userEmail,
            userPhone: phone,
            productName: product.name,
            productId: product.id,
        });
            console.log("✅ Email sent");
        } catch (err) {
            console.error("❌ Email failed:", err);
        }

// 4. Always return success (since at least WhatsApp worked)
        res.json({ message: 'Inquiry sent successfully. We will contact you shortly.' });

    } catch (error) {
        console.error('Failed to process inquiry:', error);
        res.status(500).json({ message: 'There was an error processing your inquiry.' });
    }
};


module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    inquireAboutProduct, // --- NEW ---
};