const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin, requireAdminOrOwner } = require('../middleware/auth');
const { predictLevel, updateUserProfile, generateAISummary, buildRecommendationCriteria, assessLevelProgression } = require('../services/mlService');

const router = express.Router();

/**
 * GET /api/ml/profile/:userId
 * Returns the user's current adaptive level profile.
 */
router.get('/profile/:userId', authenticateToken, requireAdminOrOwner, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
            return res.status(400).json({ error: true, message: 'Invalid user ID', code: 'INVALID_USER_ID' });
        }

        const profileResult = await db.query(
            'SELECT * FROM user_level_profiles WHERE user_id = $1',
            [userId]
        );

        const profile = profileResult.rows[0] || {
            user_id: userId,
            current_level: 'medium',
            total_quizzes: 0,
            avg_accuracy: 0,
            avg_speed_score: 0,
            ml_score: 0,
        };

        res.json({ success: true, data: { profile } });
    } catch (error) {
        console.error('ML profile fetch error:', error);
        res.status(500).json({ error: true, message: 'Failed to fetch ML profile', code: 'ML_PROFILE_ERROR' });
    }
});

/**
 * GET /api/ml/recommendations/:userId
 * Returns recommended quizzes based on user's weak topics, current level, and progression assessment.
 */
router.get('/recommendations/:userId', authenticateToken, requireAdminOrOwner, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
            return res.status(400).json({ error: true, message: 'Invalid user ID', code: 'INVALID_USER_ID' });
        }

        // Get user's adaptive level profile
        const profileResult = await db.query(
            'SELECT * FROM user_level_profiles WHERE user_id = $1',
            [userId]
        );
        const profile = profileResult.rows[0];
        const currentLevel = profile ? profile.current_level : 'medium';

        // Recent results for trend analysis (newest first)
        const recentResultsData = await db.query(
            `SELECT ml_score, ml_predicted_level, completed_at
             FROM quiz_results
             WHERE user_id = $1 AND ml_score IS NOT NULL
             ORDER BY completed_at DESC
             LIMIT 5`,
            [userId]
        );

        // Level progression assessment
        const progression = assessLevelProgression(profile || null, recentResultsData.rows);

        // Find lessons where the user has low accuracy (< 60%)
        const weakLessonsResult = await db.query(
            `SELECT q.lesson_id, AVG(
                CASE WHEN qp.is_correct THEN 1.0 ELSE 0.0 END
             ) as lesson_accuracy
             FROM question_performance qp
             JOIN questions qu ON qp.question_id = qu.id
             JOIN quizzes q ON qu.quiz_id = q.id
             WHERE qp.user_id = $1 AND q.lesson_id IS NOT NULL
             GROUP BY q.lesson_id
             HAVING AVG(CASE WHEN qp.is_correct THEN 1.0 ELSE 0.0 END) < 0.6`,
            [userId]
        );
        const weakLessonIds = weakLessonsResult.rows.map(r => r.lesson_id);

        // Quiz IDs the user has already completed
        const doneResult = await db.query(
            'SELECT quiz_id FROM quiz_results WHERE user_id = $1',
            [userId]
        );
        const doneQuizIds = doneResult.rows.map(r => r.quiz_id);

        const excluded = doneQuizIds.length > 0 ? doneQuizIds : [0];

        // 1. Review recommendations — quizzes in weak lessons not yet done
        let reviewRecs = [];
        if (weakLessonIds.length > 0) {
            const reviewResult = await db.query(
                `SELECT q.id, q.title, q.description, l.title as lesson_title, l.level
                 FROM quizzes q
                 JOIN lessons l ON q.lesson_id = l.id
                 WHERE q.lesson_id = ANY($1::int[])
                   AND q.id != ALL($2::int[])
                 ORDER BY q.created_at DESC
                 LIMIT 5`,
                [weakLessonIds, excluded]
            );
            reviewRecs = reviewResult.rows.map(q => ({
                ...q,
                recommendation_type: 'review',
                reason: 'You scored below 60% on this topic — reviewing it will help.',
            }));
        }

        // 2. Current-level recommendations — not yet done
        const currentResult = await db.query(
            `SELECT q.id, q.title, q.description, l.title as lesson_title, l.level
             FROM quizzes q
             JOIN lessons l ON q.lesson_id = l.id
             WHERE l.level = $1
               AND q.id != ALL($2::int[])
             ORDER BY q.created_at DESC
             LIMIT 5`,
            [currentLevel, excluded]
        );
        const nextRecs = currentResult.rows.map(q => ({
            ...q,
            recommendation_type: 'next',
            reason: `Matched to your current level: ${currentLevel}`,
        }));

        // 3. Level-change recommendations (only when progression says upgrade/downgrade)
        let levelChangeRecs = [];
        if (progression.recommendation !== 'maintain' && progression.targetLevel !== currentLevel) {
            const lcResult = await db.query(
                `SELECT q.id, q.title, q.description, l.title as lesson_title, l.level
                 FROM quizzes q
                 JOIN lessons l ON q.lesson_id = l.id
                 WHERE l.level = $1
                   AND q.id != ALL($2::int[])
                 ORDER BY q.created_at DESC
                 LIMIT 3`,
                [progression.targetLevel, excluded]
            );
            levelChangeRecs = lcResult.rows.map(q => ({
                ...q,
                recommendation_type: progression.recommendation, // 'upgrade' | 'downgrade'
                reason: progression.reason,
            }));
        }

        res.json({
            success: true,
            data: {
                current_level: currentLevel,
                ml_score:      profile ? profile.ml_score : 0,
                advancement:   progression,
                recommendations: {
                    review:       reviewRecs,
                    next:         nextRecs,
                    level_change: levelChangeRecs,
                },
            },
        });
    } catch (error) {
        console.error('ML recommendations error:', error);
        res.status(500).json({ error: true, message: 'Failed to fetch recommendations', code: 'ML_RECS_ERROR' });
    }
});

/**
 * GET /api/ml/summary/:resultId
 * Returns an AI-generated performance summary for a specific quiz result.
 */
router.get('/summary/:resultId', authenticateToken, async (req, res) => {
    try {
        const resultId = parseInt(req.params.resultId);
        if (isNaN(resultId)) {
            return res.status(400).json({ error: true, message: 'Invalid result ID', code: 'INVALID_RESULT_ID' });
        }

        // Fetch the quiz result
        const resultRow = await db.query(
            `SELECT qr.*, q.title as quiz_title, q.lesson_id
             FROM quiz_results qr
             JOIN quizzes q ON qr.quiz_id = q.id
             WHERE qr.id = $1`,
            [resultId]
        );

        if (resultRow.rows.length === 0) {
            return res.status(404).json({ error: true, message: 'Result not found', code: 'RESULT_NOT_FOUND' });
        }

        // Only the owner or an admin can see the summary
        const result = resultRow.rows[0];
        if (req.user.role !== 'admin' && req.user.id !== result.user_id) {
            return res.status(403).json({ error: true, message: 'Access denied', code: 'FORBIDDEN' });
        }

        const percentage = result.total_points > 0
            ? Math.round((result.score / result.total_points) * 100)
            : 0;

        // Get per-question performance for this result
        const perfRows = await db.query(
            `SELECT qp.is_correct, qp.time_taken, qu.question_text
             FROM question_performance qp
             JOIN questions qu ON qp.question_id = qu.id
             WHERE qp.quiz_result_id = $1`,
            [resultId]
        );

        const perfs = perfRows.rows;
        const wrongTopics = perfs.filter(p => !p.is_correct).map(p => p.question_text).slice(0, 5);
        const avgTimePerQuestion = perfs.length > 0
            ? Math.round(perfs.reduce((s, p) => s + p.time_taken, 0) / perfs.length)
            : (result.time_taken_seconds && result.answers
                ? Math.round(result.time_taken_seconds / JSON.parse(result.answers).length)
                : 30);

        const predictedLevel = result.ml_predicted_level || 'medium';
        const mlScore        = result.ml_score || 0;

        // Guessing: wrong answers under 4s
        const guessingCount = perfs.filter(p => !p.is_correct && p.time_taken < 4).length;
        const guessingFlag  = guessingCount >= 2 || guessingCount / Math.max(perfs.length, 1) >= 0.3;

        // Consistency: variance of per-question scores
        let consistency = 1;
        if (perfs.length > 0) {
            const qScores = perfs.map(p => {
                if (p.is_correct) return 0.5 + 0.5 * Math.max(0, Math.min(1, 1 - p.time_taken / 45));
                return p.time_taken < 4 ? 0 : 0.1;
            });
            const mean = qScores.reduce((s, v) => s + v, 0) / qScores.length;
            const variance = qScores.reduce((s, v) => s + (v - mean) ** 2, 0) / qScores.length;
            consistency = Math.max(0, Math.min(1, 1 - variance * 2.5));
        }

        // Level progression assessment for this user
        const profileResult2 = await db.query('SELECT * FROM user_level_profiles WHERE user_id = $1', [result.user_id]);
        const recentResults2  = await db.query(
            `SELECT ml_score FROM quiz_results WHERE user_id = $1 AND ml_score IS NOT NULL ORDER BY completed_at DESC LIMIT 5`,
            [result.user_id]
        );
        const progression = assessLevelProgression(profileResult2.rows[0] || null, recentResults2.rows);

        const summary = generateAISummary({
            quizTitle: result.quiz_title,
            percentage,
            predictedLevel,
            mlScore,
            avgTimePerQuestion,
            wrongTopics,
            guessingFlag,
            consistency: Math.round(consistency * 100) / 100,
            progression,
        });

        res.json({
            success: true,
            data: {
                summary,
                predicted_level:       predictedLevel,
                ml_score:              mlScore,
                percentage,
                avg_time_per_question: avgTimePerQuestion,
                wrong_topics:          wrongTopics,
                guessing_flag:         guessingFlag,
                consistency:           Math.round(consistency * 100) / 100,
                advancement:           progression,
            }
        });
    } catch (error) {
        console.error('ML summary error:', error);
        res.status(500).json({ error: true, message: 'Failed to generate summary', code: 'ML_SUMMARY_ERROR' });
    }
});

/**
 * GET /api/ml/admin/overview
 * Admin view: level distribution across all users.
 */
router.get('/admin/overview', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const levelDist = await db.query(
            `SELECT current_level, COUNT(*) as count,
                    AVG(avg_accuracy) as avg_accuracy,
                    AVG(ml_score) as avg_ml_score
             FROM user_level_profiles
             GROUP BY current_level`
        );

        const topPerformers = await db.query(
            `SELECT u.username, ulp.current_level, ulp.ml_score, ulp.avg_accuracy, ulp.total_quizzes
             FROM user_level_profiles ulp
             JOIN users u ON ulp.user_id = u.id
             ORDER BY ulp.ml_score DESC
             LIMIT 10`
        );

        res.json({
            success: true,
            data: {
                level_distribution: levelDist.rows,
                top_performers: topPerformers.rows,
            }
        });
    } catch (error) {
        console.error('ML admin overview error:', error);
        res.status(500).json({ error: true, message: 'Failed to fetch ML overview', code: 'ML_OVERVIEW_ERROR' });
    }
});

module.exports = router;
