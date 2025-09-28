const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validate, lessonSchema } = require('../middleware/validation');

const router = express.Router();

// Get all lessons
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get total count
        const countResult = await db.query('SELECT COUNT(*) FROM lessons');
        const totalLessons = parseInt(countResult.rows[0].count);

        // Get lessons with creator info
        const result = await db.query(
            `SELECT l.id, l.title, l.description, l.content, l.video_url, l.level, l.created_at, l.updated_at,
              u.username as created_by_username
       FROM lessons l
       LEFT JOIN users u ON l.created_by = u.id
       ORDER BY l.created_at DESC
       LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        res.json({
            success: true,
            data: {
                lessons: result.rows,
                pagination: {
                    page,
                    limit,
                    total: totalLessons,
                    pages: Math.ceil(totalLessons / limit)
                }
            }
        });

    } catch (error) {
        console.error('Lessons fetch error:', error);
        res.status(500).json({
            error: true,
            message: 'Failed to fetch lessons',
            code: 'LESSONS_FETCH_ERROR'
        });
    }
});

// Get lesson by ID
router.get('/:id', async (req, res) => {
    try {
        const lessonId = parseInt(req.params.id);

        if (isNaN(lessonId)) {
            return res.status(400).json({
                error: true,
                message: 'Invalid lesson ID',
                code: 'INVALID_LESSON_ID'
            });
        }

        const result = await db.query(
            `SELECT l.id, l.title, l.description, l.content, l.video_url, l.level, l.created_at, l.updated_at,
              u.username as created_by_username
       FROM lessons l
       LEFT JOIN users u ON l.created_by = u.id
       WHERE l.id = $1`,
            [lessonId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Lesson not found',
                code: 'LESSON_NOT_FOUND'
            });
        }

        res.json({
            success: true,
            data: {
                lesson: result.rows[0]
            }
        });

    } catch (error) {
        console.error('Lesson fetch error:', error);
        res.status(500).json({
            error: true,
            message: 'Failed to fetch lesson',
            code: 'LESSON_FETCH_ERROR'
        });
    }
});

// Create new lesson (Admin only)
router.post('/', authenticateToken, requireAdmin, validate(lessonSchema), async (req, res) => {
    try {
        const { title, description, content, video_url, level } = req.body;

        const result = await db.query(
            `INSERT INTO lessons (title, description, content, video_url, level, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, title, description, content, video_url, level, created_by, created_at, updated_at`,
            [title, description || null, content, video_url || null, level || 'beginner', req.user.id]
        );

        const lesson = result.rows[0];

        res.status(201).json({
            success: true,
            message: 'Lesson created successfully',
            data: {
                lesson: {
                    ...lesson,
                    created_by_username: req.user.username
                }
            }
        });

    } catch (error) {
        console.error('Lesson creation error:', error);
        res.status(500).json({
            error: true,
            message: 'Failed to create lesson',
            code: 'LESSON_CREATE_ERROR'
        });
    }
});

// Update lesson (Admin only)
router.put('/:id', authenticateToken, requireAdmin, validate(lessonSchema), async (req, res) => {
    try {
        const lessonId = parseInt(req.params.id);
        const { title, description, content, video_url, level } = req.body;

        if (isNaN(lessonId)) {
            return res.status(400).json({
                error: true,
                message: 'Invalid lesson ID',
                code: 'INVALID_LESSON_ID'
            });
        }

        // Check if lesson exists
        const lessonExists = await db.query('SELECT id FROM lessons WHERE id = $1', [lessonId]);
        if (lessonExists.rows.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Lesson not found',
                code: 'LESSON_NOT_FOUND'
            });
        }

        const result = await db.query(
            `UPDATE lessons 
       SET title = $1, description = $2, content = $3, video_url = $4, level = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING id, title, description, content, video_url, level, created_by, created_at, updated_at`,
            [title, description || null, content, video_url || null, level || 'beginner', lessonId]
        );

        // Get creator username
        const creatorResult = await db.query(
            'SELECT username FROM users WHERE id = $1',
            [result.rows[0].created_by]
        );

        res.json({
            success: true,
            message: 'Lesson updated successfully',
            data: {
                lesson: {
                    ...result.rows[0],
                    created_by_username: creatorResult.rows[0]?.username
                }
            }
        });

    } catch (error) {
        console.error('Lesson update error:', error);
        res.status(500).json({
            error: true,
            message: 'Failed to update lesson',
            code: 'LESSON_UPDATE_ERROR'
        });
    }
});

// Delete lesson (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const lessonId = parseInt(req.params.id);

        if (isNaN(lessonId)) {
            return res.status(400).json({
                error: true,
                message: 'Invalid lesson ID',
                code: 'INVALID_LESSON_ID'
            });
        }

        // Check if lesson exists
        const lessonExists = await db.query('SELECT id FROM lessons WHERE id = $1', [lessonId]);
        if (lessonExists.rows.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Lesson not found',
                code: 'LESSON_NOT_FOUND'
            });
        }

        // Check if lesson is referenced by quizzes
        const quizExists = await db.query('SELECT id FROM quizzes WHERE lesson_id = $1', [lessonId]);
        if (quizExists.rows.length > 0) {
            return res.status(409).json({
                error: true,
                message: 'Cannot delete lesson. It is referenced by existing quizzes.',
                code: 'LESSON_REFERENCED'
            });
        }

        // Delete feedback first (cascade)
        await db.query('DELETE FROM feedback WHERE lesson_id = $1', [lessonId]);

        // Delete lesson
        await db.query('DELETE FROM lessons WHERE id = $1', [lessonId]);

        res.json({
            success: true,
            message: 'Lesson deleted successfully'
        });

    } catch (error) {
        console.error('Lesson deletion error:', error);
        res.status(500).json({
            error: true,
            message: 'Failed to delete lesson',
            code: 'LESSON_DELETE_ERROR'
        });
    }
});

// Search lessons
router.get('/search/:query', async (req, res) => {
    try {
        const searchQuery = req.params.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        if (!searchQuery || searchQuery.trim().length === 0) {
            return res.status(400).json({
                error: true,
                message: 'Search query is required',
                code: 'SEARCH_QUERY_REQUIRED'
            });
        }

        const result = await db.query(
            `SELECT l.id, l.title, l.description, l.content, l.video_url, l.level, l.created_at, l.updated_at,
              u.username as created_by_username
       FROM lessons l
       LEFT JOIN users u ON l.created_by = u.id
       WHERE l.title ILIKE $1 OR l.content ILIKE $1 OR l.description ILIKE $1
       ORDER BY l.created_at DESC
       LIMIT $2 OFFSET $3`,
            [`%${searchQuery}%`, limit, offset]
        );

        res.json({
            success: true,
            data: {
                lessons: result.rows,
                search_query: searchQuery
            }
        });

    } catch (error) {
        console.error('Lesson search error:', error);
        res.status(500).json({
            error: true,
            message: 'Failed to search lessons',
            code: 'LESSON_SEARCH_ERROR'
        });
    }
});

module.exports = router;