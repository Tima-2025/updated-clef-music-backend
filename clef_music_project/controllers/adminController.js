const db = require('../config/db');
const bcrypt = require('bcryptjs');

// --- Get all users (admin only) ---
const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', role = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT id, name, email, role, created_at FROM users';
        let countQuery = 'SELECT COUNT(*) FROM users';
        const queryParams = [];
        const conditions = [];

        // Add search condition
        if (search) {
            conditions.push('(name ILIKE $' + (queryParams.length + 1) + ' OR email ILIKE $' + (queryParams.length + 2) + ')');
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        // Add role filter
        if (role) {
            conditions.push('role = $' + (queryParams.length + 1));
            queryParams.push(role);
        }

        // Build WHERE clause
        if (conditions.length > 0) {
            const whereClause = ' WHERE ' + conditions.join(' AND ');
            query += whereClause;
            countQuery += whereClause;
        }

        // Add pagination
        query += ' ORDER BY created_at DESC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
        queryParams.push(limit, offset);

        // Execute queries
        const [usersResult, countResult] = await Promise.all([
            db.query(query, queryParams),
            db.query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset params for count
        ]);

        const totalUsers = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalUsers / limit);

        res.json({
            users: usersResult.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalUsers,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error while fetching users' });
    }
};

// --- Update user role (admin only) ---
const updateUserRole = async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'user'].includes(role)) {
        return res.status(400).json({ message: 'Valid role is required (admin or user)' });
    }

    try {
        // Check if user exists
        const userResult = await db.query('SELECT id, role FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent admin from changing their own role
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({ message: 'Cannot change your own role' });
        }

        // Update user role
        await db.query('UPDATE users SET role = $1 WHERE id = $2', [role, userId]);

        res.json({ 
            message: 'User role updated successfully',
            userId: parseInt(userId),
            newRole: role
        });

    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ message: 'Server error while updating user role' });
    }
};

// --- Delete user (admin only) ---
const deleteUser = async (req, res) => {
    const { userId } = req.params;

    try {
        // Check if user exists
        const userResult = await db.query('SELECT id, role FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent admin from deleting themselves
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        // Delete user (cascade will handle related records)
        await db.query('DELETE FROM users WHERE id = $1', [userId]);

        res.json({ 
            message: 'User deleted successfully',
            deletedUserId: parseInt(userId)
        });

    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error while deleting user' });
    }
};

// --- Get visitor statistics (admin only) ---
const getVisitorStatistics = async (req, res) => {
    try {
        const { days = 30 } = req.query;

        const statsQuery = `
            SELECT 
                COUNT(*) as total_visitors,
                COUNT(DISTINCT email) as unique_visitors,
                COUNT(DISTINCT user_id) as registered_visitors,
                DATE(visited_at) as visit_date
            FROM visitors 
            WHERE visited_at >= NOW() - INTERVAL '${days} days'
            GROUP BY DATE(visited_at)
            ORDER BY visit_date DESC
        `;

        const recentVisitorsQuery = `
            SELECT 
                v.id,
                v.email,
                v.page_url,
                v.visited_at,
                u.name as user_name,
                u.role as user_role
            FROM visitors v
            LEFT JOIN users u ON v.user_id = u.id
            ORDER BY v.visited_at DESC
            LIMIT 20
        `;

        const notificationStatsQuery = `
            SELECT 
                COUNT(*) as total_notifications,
                COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_notifications,
                COUNT(CASE WHEN status = 'read' THEN 1 END) as read_notifications,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_notifications
            FROM notifications
            WHERE created_at >= NOW() - INTERVAL '${days} days'
        `;

        const [statsResult, recentVisitorsResult, notificationStatsResult] = await Promise.all([
            db.query(statsQuery),
            db.query(recentVisitorsQuery),
            db.query(notificationStatsQuery)
        ]);

        res.json({
            visitorStats: statsResult.rows,
            recentVisitors: recentVisitorsResult.rows,
            notificationStats: notificationStatsResult.rows[0],
            period: `${days} days`
        });

    } catch (error) {
        console.error('Error fetching visitor statistics:', error);
        res.status(500).json({ message: 'Server error while fetching visitor statistics' });
    }
};

// --- Create admin user ---
const createAdminUser = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
        // Check if user already exists
        const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Insert new admin user
        const newUserQuery = 'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role';
        const { rows } = await db.query(newUserQuery, [name, email, password_hash, 'admin']);
        const newUser = rows[0];

        res.status(201).json({
            message: 'Admin user created successfully',
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        console.error('Error creating admin user:', error);
        res.status(500).json({ message: 'Server error while creating admin user' });
    }
};

module.exports = {
    getAllUsers,
    updateUserRole,
    deleteUser,
    getVisitorStatistics,
    createAdminUser
};

