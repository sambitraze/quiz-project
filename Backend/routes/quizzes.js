const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validate, quizSchema } = require('../middleware/validation');

const router = express.Router();

// Get all quizzes
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get total count
        const countResult = await db.query('SELECT COUNT(*) FROM quizzes');
        const totalQuizzes = parseInt(countResult.rows[0].count);

        // Get quizzes with creator and lesson info
        const result = await db.query(
            `SELECT q.id, q.title, q.description, q.lesson_id, q.created_at, q.updated_at,
              u.username as created_by_username,
              l.title as lesson_title,
              COUNT(questions.id) as question_count
       FROM quizzes q
       LEFT JOIN users u ON q.created_by = u.id
       LEFT JOIN lessons l ON q.lesson_id = l.id
       LEFT JOIN questions ON q.id = questions.quiz_id
       GROUP BY q.id, u.username, l.title
       ORDER BY q.created_at DESC
       LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        res.json({
            success: true,
            data: {
                quizzes: result.rows,
                pagination: {
                    page,
                    limit,
                    total: totalQuizzes,
                    pages: Math.ceil(totalQuizzes / limit)
                }
            }
        });

    } catch (error) {
        console.error('Quizzes fetch error:', error);
        res.status(500).json({
            error: true,
            message: 'Failed to fetch quizzes',
            code: 'QUIZZES_FETCH_ERROR'
        });
    }
});

// Get quiz by ID with questions
router.get('/:id', async (req, res) => {
    try {
        const quizId = parseInt(req.params.id);

        if (isNaN(quizId)) {
            return res.status(400).json({
                error: true,
                message: 'Invalid quiz ID',
                code: 'INVALID_QUIZ_ID'
            });
        }

        // Get quiz info
        const quizResult = await db.query(
            `SELECT q.id, q.title, q.description, q.lesson_id, q.created_at, q.updated_at,
              u.username as created_by_username,
              l.title as lesson_title
       FROM quizzes q
       LEFT JOIN users u ON q.created_by = u.id
       LEFT JOIN lessons l ON q.lesson_id = l.id
       WHERE q.id = $1`,
            [quizId]
        );

        if (quizResult.rows.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Quiz not found',
                code: 'QUIZ_NOT_FOUND'
            });
        }

        // Get questions for the quiz
        const questionsResult = await db.query(
            `SELECT id, question_text, options, correct_answer, points
       FROM questions
       WHERE quiz_id = $1
       ORDER BY id`,
            [quizId]
        );

        const quiz = {
            ...quizResult.rows[0],
            questions: questionsResult.rows
        };

        res.json({
            success: true,
            data: {
                quiz
            }
        });

    } catch (error) {
        console.error('Quiz fetch error:', error);
        res.status(500).json({
            error: true,
            message: 'Failed to fetch quiz',
            code: 'QUIZ_FETCH_ERROR'
        });
    }
});

// Create new quiz with questions (Admin only)
router.post('/', authenticateToken, requireAdmin, validate(quizSchema), async (req, res) => {
    const client = await db.getClient();

    try {
        const { title, description, lesson_id, questions } = req.body;

        // Start transaction
        await client.query('BEGIN');

        // Validate lesson exists if lesson_id is provided
        if (lesson_id) {
            const lessonExists = await client.query('SELECT id FROM lessons WHERE id = $1', [lesson_id]);
            if (lessonExists.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({
                    error: true,
                    message: 'Lesson not found',
                    code: 'LESSON_NOT_FOUND'
                });
            }
        }

        // Create quiz
        const quizResult = await client.query(
            `INSERT INTO quizzes (title, description, lesson_id, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, title, description, lesson_id, created_by, created_at, updated_at`,
            [title, description, lesson_id, req.user.id]
        );

        const quiz = quizResult.rows[0];

        // Create questions
        const createdQuestions = [];
        for (const question of questions) {
            const questionResult = await client.query(
                `INSERT INTO questions (quiz_id, question_text, options, correct_answer, points)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, question_text, options, correct_answer, points`,
                [quiz.id, question.question_text, JSON.stringify(question.options), question.correct_answer, question.points]
            );
            createdQuestions.push(questionResult.rows[0]);
        }

        // Commit transaction
        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Quiz created successfully',
            data: {
                quiz: {
                    ...quiz,
                    created_by_username: req.user.username,
                    questions: createdQuestions
                }
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Quiz creation error:', error);
        res.status(500).json({
            error: true,
            message: 'Failed to create quiz',
            code: 'QUIZ_CREATE_ERROR'
        });
    } finally {
        client.release();
    }
});

// Update quiz (Admin only)
router.put('/:id', authenticateToken, requireAdmin, validate(quizSchema), async (req, res) => {
    const client = await db.getClient();

    try {
        const quizId = parseInt(req.params.id);
        const { title, description, lesson_id, questions } = req.body;

        if (isNaN(quizId)) {
            return res.status(400).json({
                error: true,
                message: 'Invalid quiz ID',
                code: 'INVALID_QUIZ_ID'
            });
        }

        await client.query('BEGIN');

        // Check if quiz exists
        const quizExists = await client.query('SELECT id FROM quizzes WHERE id = $1', [quizId]);
        if (quizExists.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                error: true,
                message: 'Quiz not found',
                code: 'QUIZ_NOT_FOUND'
            });
        }

        // Validate lesson exists if lesson_id is provided
        if (lesson_id) {
            const lessonExists = await client.query('SELECT id FROM lessons WHERE id = $1', [lesson_id]);
            if (lessonExists.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({
                    error: true,
                    message: 'Lesson not found',
                    code: 'LESSON_NOT_FOUND'
                });
            }
        }

        // Update quiz
        const quizResult = await client.query(
            `UPDATE quizzes 
       SET title = $1, description = $2, lesson_id = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING id, title, description, lesson_id, created_by, created_at, updated_at`,
            [title, description, lesson_id, quizId]
        );

        // Delete existing questions
        await client.query('DELETE FROM questions WHERE quiz_id = $1', [quizId]);

        // Create new questions
        const createdQuestions = [];
        for (const question of questions) {
            const questionResult = await client.query(
                `INSERT INTO questions (quiz_id, question_text, options, correct_answer, points)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, question_text, options, correct_answer, points`,
                [quizId, question.question_text, JSON.stringify(question.options), question.correct_answer, question.points]
            );
            createdQuestions.push(questionResult.rows[0]);
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Quiz updated successfully',
            data: {
                quiz: {
                    ...quizResult.rows[0],
                    questions: createdQuestions
                }
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Quiz update error:', error);
        res.status(500).json({
            error: true,
            message: 'Failed to update quiz',
            code: 'QUIZ_UPDATE_ERROR'
        });
    } finally {
        client.release();
    }
});

// Delete quiz (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    const client = await db.getClient();

    try {
        const quizId = parseInt(req.params.id);

        if (isNaN(quizId)) {
            return res.status(400).json({
                error: true,
                message: 'Invalid quiz ID',
                code: 'INVALID_QUIZ_ID'
            });
        }

        await client.query('BEGIN');

        // Check if quiz exists
        const quizExists = await client.query('SELECT id FROM quizzes WHERE id = $1', [quizId]);
        if (quizExists.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                error: true,
                message: 'Quiz not found',
                code: 'QUIZ_NOT_FOUND'
            });
        }

        // Delete quiz results first
        await client.query('DELETE FROM quiz_results WHERE quiz_id = $1', [quizId]);

        // Delete questions
        await client.query('DELETE FROM questions WHERE quiz_id = $1', [quizId]);

        // Delete quiz
        await client.query('DELETE FROM quizzes WHERE id = $1', [quizId]);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Quiz deleted successfully'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Quiz deletion error:', error);
        res.status(500).json({
            error: true,
            message: 'Failed to delete quiz',
            code: 'QUIZ_DELETE_ERROR'
        });
    } finally {
        client.release();
    }
});

// Get quizzes by lesson ID
router.get('/lesson/:lessonId', async (req, res) => {
    try {
        const lessonId = parseInt(req.params.lessonId);

        if (isNaN(lessonId)) {
            return res.status(400).json({
                error: true,
                message: 'Invalid lesson ID',
                code: 'INVALID_LESSON_ID'
            });
        }

        const result = await db.query(
            `SELECT q.id, q.title, q.description, q.lesson_id, q.created_at, q.updated_at,
              u.username as created_by_username,
              COUNT(questions.id) as question_count
       FROM quizzes q
       LEFT JOIN users u ON q.created_by = u.id
       LEFT JOIN questions ON q.id = questions.quiz_id
       WHERE q.lesson_id = $1
       GROUP BY q.id, u.username
       ORDER BY q.created_at DESC`,
            [lessonId]
        );

        res.json({
            success: true,
            data: {
                quizzes: result.rows
            }
        });

    } catch (error) {
        console.error('Lesson quizzes fetch error:', error);
        res.status(500).json({
            error: true,
            message: 'Failed to fetch lesson quizzes',
            code: 'LESSON_QUIZZES_ERROR'
        });
    }
});

module.exports = router;