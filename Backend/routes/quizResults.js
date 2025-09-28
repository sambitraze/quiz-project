const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin, requireAdminOrOwner } = require('../middleware/auth');
const { validate, quizResultSchema } = require('../middleware/validation');

const router = express.Router();

// Submit quiz answers (Students)
router.post('/', authenticateToken, validate(quizResultSchema), async (req, res) => {
    const client = await db.getClient();

    try {
        const { quiz_id, answers } = req.body;
        const user_id = req.user.id;

        await client.query('BEGIN');

        // Check if quiz exists and get questions
        const quizResult = await client.query(
            `SELECT q.id, q.title, 
              json_agg(
                json_build_object(
                  'id', questions.id,
                  'correct_answer', questions.correct_answer,
                  'points', questions.points
                )
              ) as questions
       FROM quizzes q
       LEFT JOIN questions ON q.id = questions.quiz_id
       WHERE q.id = $1
       GROUP BY q.id, q.title`,
            [quiz_id]
        );

        if (quizResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                error: true,
                message: 'Quiz not found',
                code: 'QUIZ_NOT_FOUND'
            });
        }

        const quiz = quizResult.rows[0];
        const questions = quiz.questions;

        // Check if user has already taken this quiz
        const existingResult = await client.query(
            'SELECT id FROM quiz_results WHERE user_id = $1 AND quiz_id = $2',
            [user_id, quiz_id]
        );

        if (existingResult.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({
                error: true,
                message: 'Quiz already completed by user',
                code: 'QUIZ_ALREADY_COMPLETED'
            });
        }

        // Calculate score
        let score = 0;
        let totalPoints = 0;
        const answerMap = {};

        // Create answer map for easy lookup
        answers.forEach(answer => {
            answerMap[answer.question_id] = answer.selected_answer;
        });

        // Calculate score based on correct answers
        questions.forEach(question => {
            if (question.id) {
                totalPoints += question.points;
                const userAnswer = answerMap[question.id];

                if (userAnswer !== undefined && userAnswer === question.correct_answer) {
                    score += question.points;
                }
            }
        });

        // Save quiz result
        const resultInsert = await client.query(
            `INSERT INTO quiz_results (user_id, quiz_id, score, total_points, answers, completed_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, user_id, quiz_id, score, total_points, answers, completed_at`,
            [user_id, quiz_id, score, totalPoints, JSON.stringify(answers)]
        );

        await client.query('COMMIT');

        const result = resultInsert.rows[0];

        res.status(201).json({
            success: true,
            message: 'Quiz completed successfully',
            data: {
                quiz_result: {
                    ...result,
                    quiz_title: quiz.title,
                    percentage: totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0
                }
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Quiz submission error:', error);
        res.status(500).json({
            error: true,
            message: 'Failed to submit quiz',
            code: 'QUIZ_SUBMISSION_ERROR'
        });
    } finally {
        client.release();
    }
});

// Get user's quiz results
router.get('/user/:userId', authenticateToken, requireAdminOrOwner, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        if (isNaN(userId)) {
            return res.status(400).json({
                error: true,
                message: 'Invalid user ID',
                code: 'INVALID_USER_ID'
            });
        }

        // Get total count
        const countResult = await db.query(
            'SELECT COUNT(*) FROM quiz_results WHERE user_id = $1',
            [userId]
        );
        const totalResults = parseInt(countResult.rows[0].count);

        // Get quiz results with quiz and lesson info
        const result = await db.query(
            `SELECT qr.id, qr.score, qr.total_points, qr.completed_at,
              q.title as quiz_title, q.description as quiz_description,
              l.title as lesson_title,
              u.username
       FROM quiz_results qr
       JOIN quizzes q ON qr.quiz_id = q.id
       LEFT JOIN lessons l ON q.lesson_id = l.id
       JOIN users u ON qr.user_id = u.id
       WHERE qr.user_id = $1
       ORDER BY qr.completed_at DESC
       LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );

        // Add percentage calculation
        const resultsWithPercentage = result.rows.map(row => ({
            ...row,
            percentage: row.total_points > 0 ? Math.round((row.score / row.total_points) * 100) : 0
        }));

        res.json({
            success: true,
            data: {
                quiz_results: resultsWithPercentage,
                pagination: {
                    page,
                    limit,
                    total: totalResults,
                    pages: Math.ceil(totalResults / limit)
                }
            }
        });

    } catch (error) {
        console.error('User quiz results fetch error:', error);
        res.status(500).json({
            error: true,
            message: 'Failed to fetch user quiz results',
            code: 'USER_RESULTS_ERROR'
        });
    }
});

// Get all results for a specific quiz (Admin only)
router.get('/quiz/:quizId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const quizId = parseInt(req.params.quizId);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        if (isNaN(quizId)) {
            return res.status(400).json({
                error: true,
                message: 'Invalid quiz ID',
                code: 'INVALID_QUIZ_ID'
            });
        }

        // Get total count
        const countResult = await db.query(
            'SELECT COUNT(*) FROM quiz_results WHERE quiz_id = $1',
            [quizId]
        );
        const totalResults = parseInt(countResult.rows[0].count);

        // Get quiz results with user info
        const result = await db.query(
            `SELECT qr.id, qr.user_id, qr.score, qr.total_points, qr.completed_at,
              u.username, u.email,
              q.title as quiz_title
       FROM quiz_results qr
       JOIN users u ON qr.user_id = u.id
       JOIN quizzes q ON qr.quiz_id = q.id
       WHERE qr.quiz_id = $1
       ORDER BY qr.score DESC, qr.completed_at ASC
       LIMIT $2 OFFSET $3`,
            [quizId, limit, offset]
        );

        // Add percentage and ranking
        const resultsWithStats = result.rows.map((row, index) => ({
            ...row,
            percentage: row.total_points > 0 ? Math.round((row.score / row.total_points) * 100) : 0,
            rank: offset + index + 1
        }));

        // Get quiz statistics
        const statsResult = await db.query(
            `SELECT 
         AVG(score::float / total_points * 100) as average_percentage,
         MAX(score::float / total_points * 100) as highest_percentage,
         MIN(score::float / total_points * 100) as lowest_percentage,
         COUNT(*) as total_attempts
       FROM quiz_results 
       WHERE quiz_id = $1`,
            [quizId]
        );

        const stats = statsResult.rows[0];

        res.json({
            success: true,
            data: {
                quiz_results: resultsWithStats,
                statistics: {
                    average_percentage: stats.average_percentage ? parseFloat(stats.average_percentage).toFixed(2) : 0,
                    highest_percentage: stats.highest_percentage ? parseFloat(stats.highest_percentage).toFixed(2) : 0,
                    lowest_percentage: stats.lowest_percentage ? parseFloat(stats.lowest_percentage).toFixed(2) : 0,
                    total_attempts: parseInt(stats.total_attempts)
                },
                pagination: {
                    page,
                    limit,
                    total: totalResults,
                    pages: Math.ceil(totalResults / limit)
                }
            }
        });

    } catch (error) {
        console.error('Quiz results fetch error:', error);
        res.status(500).json({
            error: true,
            message: 'Failed to fetch quiz results',
            code: 'QUIZ_RESULTS_ERROR'
        });
    }
});

// Get detailed result by ID (Admin or owner)
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const resultId = parseInt(req.params.id);

        if (isNaN(resultId)) {
            return res.status(400).json({
                error: true,
                message: 'Invalid result ID',
                code: 'INVALID_RESULT_ID'
            });
        }

        const result = await db.query(
            `SELECT qr.id, qr.user_id, qr.quiz_id, qr.score, qr.total_points, 
              qr.answers, qr.completed_at,
              u.username, u.email,
              q.title as quiz_title, q.description as quiz_description,
              l.title as lesson_title
       FROM quiz_results qr
       JOIN users u ON qr.user_id = u.id
       JOIN quizzes q ON qr.quiz_id = q.id
       LEFT JOIN lessons l ON q.lesson_id = l.id
       WHERE qr.id = $1`,
            [resultId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Quiz result not found',
                code: 'RESULT_NOT_FOUND'
            });
        }

        const quizResult = result.rows[0];

        // Check if user can access this result (admin or owner)
        if (req.user.role !== 'admin' && req.user.id !== quizResult.user_id) {
            return res.status(403).json({
                error: true,
                message: 'Access denied',
                code: 'ACCESS_DENIED'
            });
        }

        // Get questions with user answers for detailed view
        const questionsResult = await db.query(
            `SELECT id, question_text, options, correct_answer, points
       FROM questions
       WHERE quiz_id = $1
       ORDER BY id`,
            [quizResult.quiz_id]
        );

        const questions = questionsResult.rows;

        // Handle both string and object cases for answers
        let userAnswers;
        try {
            userAnswers = typeof quizResult.answers === 'string'
                ? JSON.parse(quizResult.answers)
                : quizResult.answers;
        } catch (error) {
            console.error('Error parsing user answers:', error);
            userAnswers = [];
        }

        const answerMap = {};

        userAnswers.forEach(answer => {
            answerMap[answer.question_id] = answer.selected_answer;
        });

        // Combine questions with user answers
        const detailedAnswers = questions.map(question => ({
            question_id: question.id,
            question_text: question.question_text,
            options: question.options,
            correct_answer: question.correct_answer,
            user_answer: answerMap[question.id],
            points: question.points,
            is_correct: answerMap[question.id] === question.correct_answer
        }));

        res.json({
            success: true,
            data: {
                quiz_result: {
                    ...quizResult,
                    percentage: quizResult.total_points > 0 ? Math.round((quizResult.score / quizResult.total_points) * 100) : 0,
                    detailed_answers: detailedAnswers
                }
            }
        });

    } catch (error) {
        console.error('Detailed result fetch error:', error);
        res.status(500).json({
            error: true,
            message: 'Failed to fetch quiz result details',
            code: 'RESULT_DETAILS_ERROR'
        });
    }
});

// Delete quiz result (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const resultId = parseInt(req.params.id);

        if (isNaN(resultId)) {
            return res.status(400).json({
                error: true,
                message: 'Invalid result ID',
                code: 'INVALID_RESULT_ID'
            });
        }

        // Check if result exists
        const resultExists = await db.query('SELECT id FROM quiz_results WHERE id = $1', [resultId]);
        if (resultExists.rows.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Quiz result not found',
                code: 'RESULT_NOT_FOUND'
            });
        }

        await db.query('DELETE FROM quiz_results WHERE id = $1', [resultId]);

        res.json({
            success: true,
            message: 'Quiz result deleted successfully'
        });

    } catch (error) {
        console.error('Result deletion error:', error);
        res.status(500).json({
            error: true,
            message: 'Failed to delete quiz result',
            code: 'RESULT_DELETE_ERROR'
        });
    }
});

module.exports = router;