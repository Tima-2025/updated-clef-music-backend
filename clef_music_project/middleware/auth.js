const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Middleware to protect routes that require authentication
const protect = async (req, res, next) => {
    let token;

    // Check for token in the Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the database and attach to the request object
            const { rows } = await db.query('SELECT id, name, email, role FROM users WHERE id = $1', [decoded.id]);
            
            if (rows.length === 0) {
                 return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            req.user = rows[0];
            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };