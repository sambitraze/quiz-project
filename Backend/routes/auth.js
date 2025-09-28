const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validate, registerSchema, loginSchema } = require('../middleware/validation');

const router = express.Router();

// Register new user
router.post('/register', validate(registerSchema), async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Check if user already exists
        const existingUser = await db.query(
            'SELECT id FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                error: true,
                message: 'Username or email already exists',
                code: 'USER_EXISTS'
            });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const result = await db.query(
            `INSERT INTO users (username, email, password, role, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, NOW(), NOW()) 
       RETURNING id, username, email, role, created_at`,
            [username, email, hashedPassword, role]
        );

        const user = result.rows[0];

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    created_at: user.created_at
                },
                token
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: true,
            message: 'Failed to register user',
            code: 'REGISTRATION_ERROR'
        });
    }
});

// Login user
router.post('/login', validate(loginSchema), async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user by username
        const result = await db.query(
            'SELECT id, username, email, password, role FROM users WHERE username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: true,
                message: 'Invalid credentials',
                code: 'INVALID_CREDENTIALS'
            });
        }

        const user = result.rows[0];

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                error: true,
                message: 'Invalid credentials',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                },
                token
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: true,
            message: 'Failed to login',
            code: 'LOGIN_ERROR'
        });
    }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = $1',
            [req.user.id]
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
        console.error('Profile fetch error:', error);
        res.status(500).json({
            error: true,
            message: 'Failed to fetch profile',
            code: 'PROFILE_ERROR'
        });
    }
});

module.exports = router;