const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validate, feedbackSchema } = require('../middleware/validation');

const router = express.Router();

// Get all feedback (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get total count
        const countResult = await db.query('SELECT COUNT(*) FROM feedback');
        const totalFeedback = parseInt(countResult.rows[0].count);

        // Get feedback with user and lesson info
        const result = await db.query(
            `SELECT f.id, f.rating, f.comment, f.created_at,
              u.username, u.email,
              l.title as lesson_title
       FROM feedback f
       JOIN users u ON f.user_id = u.id
       JOIN lessons l ON f.lesson_id = l.id
       ORDER BY f.created_at DESC
       LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        res.json({
            success: true,
            data: {
                feedback: result.rows,
                pagination: {
                    page,
                    limit,
                    total: totalFeedback,
                    pages: Math.ceil(totalFeedback / limit)
                }
            }
        });

    } catch (error) {
        console.error('Feedback fetch error:', error);
        res.status(500).json({
            error: true,
            message: 'Failed to fetch feedback',
            code: 'FEEDBACK_FETCH_ERROR'
        });
    }
});

// Get feedback for specific lesson
router.get('/lesson/:lessonId', async (req, res) => {
    try {
        const lessonId = parseInt(req.params.lessonId);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        if (isNaN(lessonId)) {
            return res.status(400).json({
                error: true,
                message: 'Invalid lesson ID',
                code: 'INVALID_LESSON_ID'
            });
        }

        // Get total count for this lesson
        const countResult = await db.query(
            'SELECT COUNT(*) FROM feedback WHERE lesson_id = $1',
            [lessonId]
        );
        const totalFeedback = parseInt(countResult.rows[0].count);

        // Get feedback for the lesson
        const result = await db.query(
            `SELECT f.id, f.rating, f.comment, f.created_at,
              u.username
       FROM feedback f
       JOIN users u ON f.user_id = u.id
       WHERE f.lesson_id = $1
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
            [lessonId, limit, offset]
        );

        // Get lesson statistics
        const statsResult = await db.query(
            `SELECT 
         AVG(rating) as average_rating,
         COUNT(*) as total_feedback,
         COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
         COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
         COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
         COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
         COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
       FROM feedback 
       WHERE lesson_id = $1`,
            [lessonId]
        );

        const stats = statsResult.rows[0];

        res.json({
            success: true,
            data: {
                feedback: result.rows,
                statistics: {
                    average_rating: stats.average_rating ? parseFloat(stats.average_rating).toFixed(1) : 0,
                    total_feedback: parseInt(stats.total_feedback),
                    rating_breakdown: {
                        5: parseInt(stats.five_star),
                        4: parseInt(stats.four_star),
                        3: parseInt(stats.three_star),
                        2: parseInt(stats.two_star),
                        1: parseInt(stats.one_star)
                    }
                },
                pagination: {
                    page,
                    limit,
                    total: totalFeedback,
                    pages: Math.ceil(totalFeedback / limit)
                }
            }
        });

    } catch (error) {
        console.error('Lesson feedback fetch error:', error);
        res.status(500).json({
            error: true,
            message: 'Failed to fetch lesson feedback',
            code: 'LESSON_FEEDBACK_ERROR'
        });
    }
});

// Create new feedback (Students)
router.post('/', authenticateToken, validate(feedbackSchema), async (req, res) => {
    try {
        const { lesson_id, rating, comment } = req.body;
        const user_id = req.user.id;

        // Check if lesson exists
        const lessonExists = await db.query('SELECT id FROM lessons WHERE id = $1', [lesson_id]);
        if (lessonExists.rows.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Lesson not found',
                code: 'LESSON_NOT_FOUND'
            });
        }

        // Check if user has already provided feedback for this lesson
        const existingFeedback = await db.query(
            'SELECT id FROM feedback WHERE user_id = $1 AND lesson_id = $2',
            [user_id, lesson_id]
        );

        if (existingFeedback.rows.length > 0) {
            return res.status(409).json({
                error: true,
                message: 'You have already provided feedback for this lesson',
                code: 'FEEDBACK_EXISTS'
            });
        }

        // Create feedback
        const result = await db.query(
            `INSERT INTO feedback (user_id, lesson_id, rating, comment, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, user_id, lesson_id, rating, comment, created_at`,
            [user_id, lesson_id, rating, comment]
        );

        const feedback = result.rows[0];

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            data: {
                feedback: {
                    ...feedback,
                    username: req.user.username
                }
            }
        });

    } catch (error) {
        console.error('Feedback creation error:', error);
        res.status(500).json({
            error: true,
            message: 'Failed to submit feedback',
            code: 'FEEDBACK_CREATE_ERROR'
        });
    }
});

// Update feedback (Users can update their own feedback)
router.put('/:id', authenticateToken, validate(feedbackSchema), async (req, res) => {
    try {
        const feedbackId = parseInt(req.params.id);
        const { lesson_id, rating, comment } = req.body;

        if (isNaN(feedbackId)) {
            return res.status(400).json({
                error: true,
                message: 'Invalid feedback ID',
                code: 'INVALID_FEEDBACK_ID'
            });
        }

        // Check if feedback exists and user owns it
        const feedbackResult = await db.query(
            'SELECT user_id, lesson_id FROM feedback WHERE id = $1',
            [feedbackId]
        );

        if (feedbackResult.rows.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Feedback not found',
                code: 'FEEDBACK_NOT_FOUND'
            });
        }

        const existingFeedback = feedbackResult.rows[0];

        // Check if user owns this feedback or is admin
        if (req.user.role !== 'admin' && req.user.id !== existingFeedback.user_id) {
            return res.status(403).json({
                error: true,
                message: 'Access denied',
                code: 'ACCESS_DENIED'
            });
        }

        // Check if lesson exists (if lesson_id is being changed)
        if (lesson_id !== existingFeedback.lesson_id) {
            const lessonExists = await db.query('SELECT id FROM lessons WHERE id = $1', [lesson_id]);
            if (lessonExists.rows.length === 0) {
                return res.status(404).json({
                    error: true,
                    message: 'Lesson not found',
                    code: 'LESSON_NOT_FOUND'
                });
            }
        }

        // Update feedback
        const result = await db.query(
            `UPDATE feedback 
       SET lesson_id = $1, rating = $2, comment = $3, created_at = NOW()
       WHERE id = $4
       RETURNING id, user_id, lesson_id, rating, comment, created_at`,
            [lesson_id, rating, comment, feedbackId]
        );

        res.json({
            success: true,
            message: 'Feedback updated successfully',
            data: {
                feedback: result.rows[0]
            }
        });

    } catch (error) {
        console.error('Feedback update error:', error);
        res.status(500).json({
            error: true,
            message: 'Failed to update feedback',
            code: 'FEEDBACK_UPDATE_ERROR'
        });
    }
});

// Delete feedback (Admin only or user's own feedback)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const feedbackId = parseInt(req.params.id);

        if (isNaN(feedbackId)) {
            return res.status(400).json({
                error: true,
                message: 'Invalid feedback ID',
                code: 'INVALID_FEEDBACK_ID'
            });
        }

        // Check if feedback exists and get owner info
        const feedbackResult = await db.query(
            'SELECT user_id FROM feedback WHERE id = $1',
            [feedbackId]
        );

        if (feedbackResult.rows.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Feedback not found',
                code: 'FEEDBACK_NOT_FOUND'
            });
        }

        const feedback = feedbackResult.rows[0];

        // Check if user can delete this feedback (admin or owner)
        if (req.user.role !== 'admin' && req.user.id !== feedback.user_id) {
            return res.status(403).json({
                error: true,
                message: 'Access denied',
                code: 'ACCESS_DENIED'
            });
        }

        // Delete feedback
        await db.query('DELETE FROM feedback WHERE id = $1', [feedbackId]);

        res.json({
            success: true,
            message: 'Feedback deleted successfully'
        });

    } catch (error) {
        console.error('Feedback deletion error:', error);
        res.status(500).json({
            error: true,
            message: 'Failed to delete feedback',
            code: 'FEEDBACK_DELETE_ERROR'
        });
    }
});

// Get user's own feedback
router.get('/my-feedback', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get total count
        const countResult = await db.query(
            'SELECT COUNT(*) FROM feedback WHERE user_id = $1',
            [req.user.id]
        );
        const totalFeedback = parseInt(countResult.rows[0].count);

        // Get user's feedback
        const result = await db.query(
            `SELECT f.id, f.rating, f.comment, f.created_at,
              l.title as lesson_title, l.id as lesson_id
       FROM feedback f
       JOIN lessons l ON f.lesson_id = l.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
            [req.user.id, limit, offset]
        );

        res.json({
            success: true,
            data: {
                feedback: result.rows,
                pagination: {
                    page,
                    limit,
                    total: totalFeedback,
                    pages: Math.ceil(totalFeedback / limit)
                }
            }
        });

    } catch (error) {
        console.error('User feedback fetch error:', error);
        res.status(500).json({
            error: true,
            message: 'Failed to fetch your feedback',
            code: 'USER_FEEDBACK_ERROR'
        });
    }
});

module.exports = router;