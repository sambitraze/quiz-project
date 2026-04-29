const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const aiService = require('../services/aiService');
const { generateAISummary, assessLevelProgression } = require('../services/mlService');

const router = express.Router();

// ─── helpers ──────────────────────────────────────────────────────────────────

function intParam(val) {
    const n = parseInt(val);
    return isNaN(n) ? null : n;
}

// ─── GET /api/ai/status ───────────────────────────────────────────────────────
/**
 * Returns whether the Gemini API key is configured.
 * Public — used by the frontend to show/hide AI badges.
 */
router.get('/status', (req, res) => {
    res.json({
        success: true,
        aiConfigured: aiService.isConfigured(),
        provider: aiService.isConfigured() ? 'Google Gemini (gemini-1.5-flash)' : null,
        freeApi: true,
    });
});

// ─── GET /api/ai/summary/:resultId ────────────────────────────────────────────
/**
 * Return an AI-enhanced (or locally-generated) performance summary for a quiz result.
 * The student who owns the result, or any admin, may call this.
 */
router.get('/summary/:resultId', authenticateToken, async (req, res) => {
    try {
        const resultId = intParam(req.params.resultId);
        if (!resultId) return res.status(400).json({ error: true, message: 'Invalid result ID', code: 'INVALID_ID' });

        const resultRow = await db.query(
            `SELECT qr.*, q.title AS quiz_title
             FROM quiz_results qr
             JOIN quizzes q ON qr.quiz_id = q.id
             WHERE qr.id = $1`,
            [resultId]
        );
        if (!resultRow.rows.length) return res.status(404).json({ error: true, message: 'Result not found', code: 'NOT_FOUND' });

        const result = resultRow.rows[0];
        if (req.user.role !== 'admin' && req.user.id !== result.user_id) {
            return res.status(403).json({ error: true, message: 'Access denied', code: 'FORBIDDEN' });
        }

        const percentage = result.total_points > 0
            ? Math.round((result.score / result.total_points) * 100)
            : 0;

        // Per-question performance
        const perfRows = await db.query(
            `SELECT qp.is_correct, qp.time_taken, qu.question_text
             FROM question_performance qp
             JOIN questions qu ON qp.question_id = qu.id
             WHERE qp.quiz_result_id = $1`,
            [resultId]
        );
        const perfs = perfRows.rows;
        const wrongQuestions = perfs.filter(p => !p.is_correct).map(p => p.question_text).slice(0, 5);
        const avgTimePerQuestion = perfs.length > 0
            ? Math.round(perfs.reduce((s, p) => s + (p.time_taken || 0), 0) / perfs.length)
            : 30;

        const guessingCount = perfs.filter(p => !p.is_correct && (p.time_taken || 0) < 4).length;
        const guessingFlag = guessingCount >= 2 || guessingCount / Math.max(perfs.length, 1) >= 0.3;

        let consistency = 1;
        if (perfs.length > 0) {
            const qScores = perfs.map(p =>
                p.is_correct
                    ? 0.5 + 0.5 * Math.max(0, Math.min(1, 1 - (p.time_taken || 0) / 45))
                    : (p.time_taken || 0) < 4 ? 0 : 0.1
            );
            const mean = qScores.reduce((s, v) => s + v, 0) / qScores.length;
            const variance = qScores.reduce((s, v) => s + (v - mean) ** 2, 0) / qScores.length;
            consistency = Math.max(0, Math.min(1, 1 - variance * 2.5));
        }

        const [profileRes, recentRes] = await Promise.all([
            db.query('SELECT * FROM user_level_profiles WHERE user_id = $1', [result.user_id]),
            db.query(`SELECT ml_score FROM quiz_results WHERE user_id = $1 AND ml_score IS NOT NULL ORDER BY completed_at DESC LIMIT 5`, [result.user_id]),
        ]);
        const progression = assessLevelProgression(profileRes.rows[0] || null, recentRes.rows);

        // Build local summary as fallback
        const localSummary = generateAISummary({
            quizTitle: result.quiz_title,
            percentage,
            predictedLevel: result.ml_predicted_level || 'medium',
            mlScore: parseFloat(result.ml_score) || 0,
            avgTimePerQuestion,
            wrongTopics: wrongQuestions,
            guessingFlag,
            consistency,
            progression,
        });

        const { summary, aiPowered } = await aiService.enhanceSummary({
            quizTitle: result.quiz_title,
            percentage,
            predictedLevel: result.ml_predicted_level || 'medium',
            mlScore: parseFloat(result.ml_score) || 0,
            avgTimePerQuestion,
            wrongQuestions,
            guessingFlag,
            consistency,
            progression,
            localFallback: localSummary,
        });

        res.json({
            success: true,
            data: {
                resultId,
                summary,
                aiPowered,
                percentage,
                predictedLevel: result.ml_predicted_level || 'medium',
                mlScore: parseFloat(result.ml_score) || 0,
                wrongCount: wrongQuestions.length,
                progression,
            },
        });
    } catch (err) {
        console.error('AI summary error:', err);
        res.status(500).json({ error: true, message: 'Failed to generate summary', code: 'AI_SUMMARY_ERROR' });
    }
});

// ─── POST /api/ai/hint ────────────────────────────────────────────────────────
/**
 * Generate a hint for a question the student got wrong.
 * Body: { question_id, quiz_result_id }
 * Only the owner of the quiz result may request hints.
 */
router.post('/hint', authenticateToken, async (req, res) => {
    try {
        const { question_id, quiz_result_id } = req.body;
        if (!question_id || !quiz_result_id) {
            return res.status(400).json({ error: true, message: 'question_id and quiz_result_id required', code: 'MISSING_PARAMS' });
        }

        // Verify the quiz result belongs to this user
        const resultRow = await db.query('SELECT user_id FROM quiz_results WHERE id = $1', [quiz_result_id]);
        if (!resultRow.rows.length) return res.status(404).json({ error: true, message: 'Quiz result not found', code: 'NOT_FOUND' });
        if (req.user.role !== 'admin' && req.user.id !== resultRow.rows[0].user_id) {
            return res.status(403).json({ error: true, message: 'Access denied', code: 'FORBIDDEN' });
        }

        // Get question details
        const qRow = await db.query('SELECT question_text, options, correct_answer FROM questions WHERE id = $1', [question_id]);
        if (!qRow.rows.length) return res.status(404).json({ error: true, message: 'Question not found', code: 'NOT_FOUND' });

        const q = qRow.rows[0];
        const options = Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]');

        const { hint, aiPowered } = await aiService.generateHint({
            questionText: q.question_text,
            options,
            correctAnswerIndex: q.correct_answer,
        });

        res.json({ success: true, data: { hint, aiPowered } });
    } catch (err) {
        console.error('AI hint error:', err);
        res.status(500).json({ error: true, message: 'Failed to generate hint', code: 'AI_HINT_ERROR' });
    }
});

// ─── POST /api/ai/rate-quiz/:quizId ──────────────────────────────────────────
/**
 * Rate the educational quality of a quiz (admin only).
 */
router.post('/rate-quiz/:quizId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const quizId = intParam(req.params.quizId);
        if (!quizId) return res.status(400).json({ error: true, message: 'Invalid quiz ID', code: 'INVALID_ID' });

        const quizRow = await db.query(
            `SELECT q.*, l.level FROM quizzes q LEFT JOIN lessons l ON q.lesson_id = l.id WHERE q.id = $1`,
            [quizId]
        );
        if (!quizRow.rows.length) return res.status(404).json({ error: true, message: 'Quiz not found', code: 'NOT_FOUND' });

        const quiz = quizRow.rows[0];
        const qRows = await db.query('SELECT question_text, options, correct_answer FROM questions WHERE quiz_id = $1', [quizId]);
        const questions = qRows.rows.map(q => ({
            question_text: q.question_text,
            options: Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]'),
            correct_answer: q.correct_answer,
        }));

        const result = await aiService.rateQuiz({
            quizTitle: quiz.title,
            quizDescription: quiz.description || '',
            level: quiz.level || 'medium',
            questions,
        });

        res.json({ success: true, data: { quizId, quizTitle: quiz.title, ...result } });
    } catch (err) {
        console.error('AI rate-quiz error:', err);
        res.status(500).json({ error: true, message: 'Failed to rate quiz', code: 'AI_RATE_ERROR' });
    }
});

// ─── POST /api/ai/generate-questions ─────────────────────────────────────────
/**
 * Generate AI quiz questions for a topic (admin only).
 * Body: { topic, difficulty, count, lesson_id? }
 * If lesson_id is provided, the lesson's content is used as grounding context.
 */
router.post('/generate-questions', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { topic, difficulty = 'medium', count = 3, lesson_id } = req.body;
        if (!topic || typeof topic !== 'string' || topic.trim().length < 2) {
            return res.status(400).json({ error: true, message: 'topic is required (min 2 chars)', code: 'MISSING_TOPIC' });
        }

        let context = '';
        if (lesson_id) {
            const lessonRow = await db.query('SELECT content FROM lessons WHERE id = $1', [intParam(lesson_id)]);
            if (lessonRow.rows.length) context = lessonRow.rows[0].content || '';
        }

        const result = await aiService.generateQuestions({
            topic: topic.trim(),
            difficulty,
            count,
            context,
        });

        res.json({ success: true, data: result });
    } catch (err) {
        console.error('AI generate-questions error:', err);
        res.status(500).json({ error: true, message: 'Failed to generate questions', code: 'AI_GEN_ERROR' });
    }
});

// ─── GET /api/ai/lesson-summary/:lessonId ────────────────────────────────────
/**
 * Generate a 3-bullet AI summary of a lesson for quick review.
 * Authenticated users only.
 */
router.get('/lesson-summary/:lessonId', authenticateToken, async (req, res) => {
    try {
        const lessonId = intParam(req.params.lessonId);
        if (!lessonId) return res.status(400).json({ error: true, message: 'Invalid lesson ID', code: 'INVALID_ID' });

        const lessonRow = await db.query('SELECT title, content FROM lessons WHERE id = $1', [lessonId]);
        if (!lessonRow.rows.length) return res.status(404).json({ error: true, message: 'Lesson not found', code: 'NOT_FOUND' });

        const { title, content } = lessonRow.rows[0];
        const result = await aiService.summariseLesson({ title, content });

        res.json({ success: true, data: { lessonId, title, ...result } });
    } catch (err) {
        console.error('AI lesson-summary error:', err);
        res.status(500).json({ error: true, message: 'Failed to summarise lesson', code: 'AI_LESSON_SUMMARY_ERROR' });
    }
});

module.exports = router;
