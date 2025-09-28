const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin, requireAdminOrOwner } = require('../middleware/auth');

const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get total count
        const countResult = await db.query('SELECT COUNT(*) FROM users');
        const totalUsers = parseInt(countResult.rows[0].count);

        // Get users with pagination
        const result = await db.query(
            `SELECT id, username, email, role, created_at, updated_at 
       FROM users 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        res.json({
            success: true,
            data: {
                users: result.rows,
                pagination: {
                    page,
                    limit,
                    total: totalUsers,
                    pages: Math.ceil(totalUsers / limit)
                }
            }
        });

    } catch (error) {
        console.error('Users fetch error:', error);
        res.status(500).json({
            error: true,
            message: 'Failed to fetch users',
            code: 'USERS_FETCH_ERROR'
        });
    }
});

// Get user by ID
router.get('/:id', authenticateToken, requireAdminOrOwner, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        if (isNaN(userId)) {
            return res.status(400).json({
                error: true,
                message: 'Invalid user ID',
                code: 'INVALID_USER_ID'
            });
        }

        const result = await db.query(
            'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        res.json({
            success: true,
            data: {
                user: result.rows[0]
            }
        });

    } catch (error) {
        console.error('User fetch error:', error);
        res.status(500).json({
            error: true,
            message: 'Failed to fetch user',
            code: 'USER_FETCH_ERROR'
        });
    }
});

// Update user role (Admin only)
router.put('/:id/role', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { role } = req.body;

        if (isNaN(userId)) {
            return res.status(400).json({
                error: true,
                message: 'Invalid user ID',
                code: 'INVALID_USER_ID'
            });
        }

        if (!role || !['student', 'admin'].includes(role)) {
            return res.status(400).json({
                error: true,
                message: 'Role must be either "student" or "admin"',
                code: 'INVALID_ROLE'
            });
        }

        // Check if user exists
        const userExists = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
        if (userExists.rows.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        // Update user role
        const result = await db.query(
            `UPDATE users 
       SET role = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING id, username, email, role, updated_at`,
            [role, userId]
        );

        res.json({
            success: true,
            message: 'User role updated successfully',
            data: {
                user: result.rows[0]
            }
        });

    } catch (error) {
        console.error('Role update error:', error);
        res.status(500).json({
            error: true,
            message: 'Failed to update user role',
            code: 'ROLE_UPDATE_ERROR'
        });
    }
});

// Get user statistics (Admin only)
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const stats = await Promise.all([
            db.query('SELECT COUNT(*) as total FROM users'),
            db.query('SELECT COUNT(*) as students FROM users WHERE role = $1', ['student']),
            db.query('SELECT COUNT(*) as admins FROM users WHERE role = $1', ['admin']),
            db.query('SELECT COUNT(*) as today FROM users WHERE DATE(created_at) = CURRENT_DATE')
        ]);

        res.json({
            success: true,
            data: {
                total_users: parseInt(stats[0].rows[0].total),
                students: parseInt(stats[1].rows[0].students),
                admins: parseInt(stats[2].rows[0].admins),
                registered_today: parseInt(stats[3].rows[0].today)
            }
        });

    } catch (error) {
        console.error('Stats fetch error:', error);
        res.status(500).json({
            error: true,
            message: 'Failed to fetch user statistics',
            code: 'STATS_ERROR'
        });
    }
});

module.exports = router;