const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const lessonRoutes = require('./routes/lessons');
const quizRoutes = require('./routes/quizzes');
const quizResultRoutes = require('./routes/quizResults');
const feedbackRoutes = require('./routes/feedback');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/quiz-results', quizResultRoutes);
app.use('/api/feedback', feedbackRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: true,
        message: 'Route not found',
        code: 'ROUTE_NOT_FOUND'
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Error:', error);

    if (error.name === 'ValidationError') {
        return res.status(400).json({
            error: true,
            message: error.details[0].message,
            code: 'VALIDATION_ERROR'
        });
    }

    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: true,
            message: 'Invalid token',
            code: 'INVALID_TOKEN'
        });
    }

    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: true,
            message: 'Token expired',
            code: 'TOKEN_EXPIRED'
        });
    }

    res.status(500).json({
        error: true,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
    });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;