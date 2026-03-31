/**
 * ML Service — Adaptive Learning Engine (Pure JavaScript)
 *
 * Formula:  ml_score = (accuracy * 0.7) + (speed_score * 0.3)
 *
 * Level thresholds:
 *   ml_score < 0.40  → easy
 *   ml_score 0.40–0.70 → medium
 *   ml_score > 0.70  → hard
 *
 * Speed scoring:
 *   Normalised against a per-question budget of MAX_SECONDS_PER_Q (45 s).
 *   speed_score = clamp(1 - avg_time / MAX_SECONDS_PER_Q, 0, 1)
 */

const MAX_SECONDS_PER_Q = 45; // questions answered faster than this score well on speed

/**
 * Predict the next difficulty level for a user based on their quiz attempt.
 *
 * @param {object} opts
 * @param {number} opts.correctAnswers   – number of correct answers
 * @param {number} opts.totalQuestions   – total questions in the quiz
 * @param {number} opts.totalTimeTaken   – total seconds taken for the whole attempt
 * @param {Array}  opts.questionTimings  – per-question timings in seconds (optional)
 * @returns {{ level: string, mlScore: number, accuracy: number, speedScore: number, breakdown: object }}
 */
function predictLevel({ correctAnswers, totalQuestions, totalTimeTaken = 0, questionTimings = [] }) {
    if (totalQuestions === 0) {
        return { level: 'medium', mlScore: 0.5, accuracy: 0, speedScore: 0.5, breakdown: {} };
    }

    // 1. Accuracy component (0–1)
    const accuracy = correctAnswers / totalQuestions;

    // 2. Speed component (0–1)
    let avgTimePerQuestion;
    if (questionTimings.length > 0) {
        avgTimePerQuestion = questionTimings.reduce((a, b) => a + b, 0) / questionTimings.length;
    } else if (totalTimeTaken > 0 && totalQuestions > 0) {
        avgTimePerQuestion = totalTimeTaken / totalQuestions;
    } else {
        avgTimePerQuestion = MAX_SECONDS_PER_Q; // assume worst case when no timing data
    }

    const speedScore = Math.max(0, Math.min(1, 1 - (avgTimePerQuestion / MAX_SECONDS_PER_Q)));

    // 3. Composite ML score
    const mlScore = Math.round((accuracy * 0.7 + speedScore * 0.3) * 1000) / 1000;

    // 4. Level decision
    let level;
    if (mlScore < 0.4) {
        level = 'easy';
    } else if (mlScore <= 0.7) {
        level = 'medium';
    } else {
        level = 'hard';
    }

    return {
        level,
        mlScore,
        accuracy,
        speedScore,
        breakdown: {
            accuracyContribution: Math.round(accuracy * 0.7 * 1000) / 1000,
            speedContribution: Math.round(speedScore * 0.3 * 1000) / 1000,
            avgTimePerQuestion: Math.round(avgTimePerQuestion),
        }
    };
}

/**
 * Update a user's rolling level profile using exponential moving average.
 * This prevents a single bad quiz from drastically changing the level.
 *
 * @param {object} existing  – existing profile row (can be null)
 * @param {object} newResult – { mlScore, accuracy, speedScore }
 * @returns {{ currentLevel, avgAccuracy, avgSpeedScore, mlScore }}
 */
function updateUserProfile(existing, newResult) {
    const alpha = 0.3; // weight for most recent result (0 = ignore new, 1 = replace entirely)

    let avgAccuracy, avgSpeedScore, avgMlScore;

    if (!existing || existing.total_quizzes === 0) {
        avgAccuracy = newResult.accuracy;
        avgSpeedScore = newResult.speedScore;
        avgMlScore = newResult.mlScore;
    } else {
        avgAccuracy = existing.avg_accuracy * (1 - alpha) + newResult.accuracy * alpha;
        avgSpeedScore = existing.avg_speed_score * (1 - alpha) + newResult.speedScore * alpha;
        avgMlScore = existing.ml_score * (1 - alpha) + newResult.mlScore * alpha;
    }

    // Round to 4 decimal places for storage
    avgAccuracy = Math.round(avgAccuracy * 10000) / 10000;
    avgSpeedScore = Math.round(avgSpeedScore * 10000) / 10000;
    avgMlScore = Math.round(avgMlScore * 10000) / 10000;

    // Derive level from rolling average
    let currentLevel;
    if (avgMlScore < 0.4) {
        currentLevel = 'easy';
    } else if (avgMlScore <= 0.7) {
        currentLevel = 'medium';
    } else {
        currentLevel = 'hard';
    }

    return { currentLevel, avgAccuracy, avgSpeedScore, avgMlScore };
}

/**
 * Generate a human-readable AI summary of a quiz performance.
 * Fully rule-based — no external API needed.
 *
 * @param {object} opts
 * @param {string} opts.quizTitle
 * @param {number} opts.percentage       – 0-100
 * @param {string} opts.predictedLevel   – easy | medium | hard
 * @param {number} opts.mlScore          – 0-1
 * @param {number} opts.avgTimePerQuestion – seconds
 * @param {string[]} opts.wrongTopics    – list of question texts that were wrong
 * @returns {string}
 */
function generateAISummary({ quizTitle, percentage, predictedLevel, mlScore, avgTimePerQuestion, wrongTopics = [] }) {
    const lines = [];

    // Opening line based on score
    if (percentage >= 90) {
        lines.push(`Outstanding performance on "${quizTitle}"! You answered ${percentage}% of questions correctly.`);
    } else if (percentage >= 75) {
        lines.push(`Good job on "${quizTitle}"! You scored ${percentage}%, showing a solid understanding of the material.`);
    } else if (percentage >= 50) {
        lines.push(`You completed "${quizTitle}" with a score of ${percentage}%. There is room to improve.`);
    } else {
        lines.push(`You scored ${percentage}% on "${quizTitle}". Don't be discouraged — review the material and try again.`);
    }

    // Speed insight
    if (avgTimePerQuestion <= 10) {
        lines.push(`You answered very quickly (avg ${avgTimePerQuestion}s per question), which shows confidence.`);
    } else if (avgTimePerQuestion <= 25) {
        lines.push(`Your response time was good (avg ${avgTimePerQuestion}s per question).`);
    } else {
        lines.push(`Your average response time was ${avgTimePerQuestion}s per question — try to build familiarity with the content to answer faster.`);
    }

    // Level recommendation
    const levelMessages = {
        easy:   'Based on this result, we recommend starting with easier quizzes to strengthen your foundation.',
        medium: 'Based on this result, medium-difficulty quizzes are a great fit for your current level.',
        hard:   'You are ready for harder challenges! Try advanced quizzes to keep pushing yourself.',
    };
    lines.push(levelMessages[predictedLevel] || levelMessages.medium);

    // Weak topics
    if (wrongTopics.length > 0) {
        const preview = wrongTopics.slice(0, 3);
        lines.push(`Focus areas: ${preview.map(t => `"${t}"`).join(', ')}.`);
    }

    // ML score insight
    lines.push(`Your adaptive learning score: ${(mlScore * 100).toFixed(1)} / 100.`);

    return lines.join(' ');
}

/**
 * Build a list of quiz recommendations for a user based on their weak topics
 * and current level profile.
 *
 * @param {object} opts
 * @param {string} opts.currentLevel   – easy | medium | hard
 * @param {number[]} opts.weakLessonIds – lesson IDs the user struggled in
 * @param {number[]} opts.doneQuizIds   – quiz IDs already completed
 * @returns {{ priority: 'review' | 'next', lessonId: number | null, reason: string }[]}
 */
function buildRecommendationCriteria({ currentLevel, weakLessonIds = [], doneQuizIds = [] }) {
    const levelOrder = { easy: 0, medium: 1, hard: 2 };
    const nextLevel = currentLevel === 'easy' ? 'easy' : currentLevel === 'medium' ? 'medium' : 'hard';

    return {
        preferredLevel: nextLevel,
        weakLessonIds,
        excludeQuizIds: doneQuizIds,
        levelOrder,
    };
}

module.exports = { predictLevel, updateUserProfile, generateAISummary, buildRecommendationCriteria };
