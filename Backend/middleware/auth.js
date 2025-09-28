const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            error: true,
            message: 'Access token required',
            code: 'TOKEN_REQUIRED'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database to ensure user still exists and get current role
        const result = await db.query(
            'SELECT id, username, email, role FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: true,
                message: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        req.user = result.rows[0];
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: true,
                message: 'Token expired',
                code: 'TOKEN_EXPIRED'
            });
        }

        return res.status(403).json({
            error: true,
            message: 'Invalid token',
            code: 'INVALID_TOKEN'
        });
    }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({
            error: true,
            message: 'Admin access required',
            code: 'ADMIN_REQUIRED'
        });
    }
};

// Middleware to check if user is student
const requireStudent = (req, res, next) => {
    if (req.user && req.user.role === 'student') {
        next();
    } else {
        res.status(403).json({
            error: true,
            message: 'Student access required',
            code: 'STUDENT_REQUIRED'
        });
    }
};

// Middleware to check if user is admin or accessing their own data
const requireAdminOrOwner = (req, res, next) => {
    const userId = parseInt(req.params.id || req.params.userId);

    if (req.user && (req.user.role === 'admin' || req.user.id === userId)) {
        next();
    } else {
        res.status(403).json({
            error: true,
            message: 'Access denied',
            code: 'ACCESS_DENIED'
        });
    }
};

module.exports = {
    authenticateToken,
    requireAdmin,
    requireStudent,
    requireAdminOrOwner
};