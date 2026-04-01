/**
 * ML Service — Adaptive Learning Engine (Pure JavaScript)
 *
 * Formula:  ml_score = (accuracy * 0.60) + (speed_score * 0.25) + (consistency * 0.15) − guessing_penalty
 *
 * Speed is only rewarded on CORRECT answers — fast wrong answers trigger
 * guessing detection and a score penalty.
 *
 * Level thresholds:
 *   ml_score < 0.40        → easy
 *   ml_score 0.40 – 0.70  → medium
 *   ml_score > 0.70        → hard
 */

const MAX_SECONDS_PER_Q = 45;  // time budget per question (seconds)
const GUESS_THRESHOLD_S = 4;   // answers under 4 s on a wrong answer = possible guess

// ─── helpers ─────────────────────────────────────────────────────────────────
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function round4(v)         { return Math.round(v * 10000) / 10000; }

// ─── predictLevel ─────────────────────────────────────────────────────────────
/**
 * Predict difficulty level from a single quiz attempt.
 *
 * @param {object}   opts
 * @param {number}   opts.correctAnswers
 * @param {number}   opts.totalQuestions
 * @param {number}   opts.totalTimeTaken     – seconds (fallback when questionData absent)
 * @param {Array}    opts.questionTimings    – legacy [{question_id, time_taken}] or [seconds]
 * @param {Array}    opts.questionData       – preferred: [{question_id, time_taken, is_correct}]
 * @returns {{ level, mlScore, accuracy, speedScore, consistency, guessingFlag, guessingCount, breakdown }}
 */
function predictLevel({
    correctAnswers,
    totalQuestions,
    totalTimeTaken  = 0,
    questionTimings = [],
    questionData    = [],
}) {
    if (totalQuestions === 0) {
        return {
            level: 'medium', mlScore: 0.5,
            accuracy: 0, speedScore: 0.5, consistency: 1,
            guessingFlag: false, guessingCount: 0,
            breakdown: {},
        };
    }

    // ── 1. Accuracy ────────────────────────────────────────────────────────
    const accuracy = correctAnswers / totalQuestions;

    // ── 2. Speed  +  Guessing  +  Consistency ──────────────────────────────
    let speedScore    = 0.5;
    let consistency   = 1.0;
    let guessingFlag  = false;
    let guessingCount = 0;
    let guessingPenalty = 0;
    let avgTimePerQuestion = totalTimeTaken > 0
        ? Math.round(totalTimeTaken / totalQuestions)
        : MAX_SECONDS_PER_Q;

    if (questionData.length > 0) {
        // Rich path — we know both timing AND correctness per question
        const correctEntries = questionData.filter(d => d.is_correct);
        const wrongEntries   = questionData.filter(d => !d.is_correct);

        // Speed: average time on CORRECT answers only
        if (correctEntries.length > 0) {
            const avgCorrectTime = correctEntries.reduce((s, d) => s + (d.time_taken || 0), 0) / correctEntries.length;
            speedScore = clamp(1 - avgCorrectTime / MAX_SECONDS_PER_Q, 0, 1);
        } else {
            speedScore = 0; // none correct → no speed reward
        }

        // Guessing: wrong answers answered suspiciously fast
        const fastWrong = wrongEntries.filter(d => (d.time_taken || 0) < GUESS_THRESHOLD_S && (d.time_taken || 0) > 0);
        guessingCount = fastWrong.length;
        if (guessingCount >= 2 || guessingCount / totalQuestions >= 0.3) {
            guessingFlag    = true;
            guessingPenalty = clamp(guessingCount * 0.05, 0, 0.15);
        }

        // Consistency: variance across per-question scores
        // Correct + fast → 1.0 ; Correct + slow → 0.5 ; Wrong + fast → 0 ; Wrong + slow → 0.1
        const qScores = questionData.map(d => {
            const t = d.time_taken || MAX_SECONDS_PER_Q;
            if (d.is_correct) return 0.5 + 0.5 * clamp(1 - t / MAX_SECONDS_PER_Q, 0, 1);
            return t < GUESS_THRESHOLD_S ? 0 : 0.1;
        });
        const meanQ    = qScores.reduce((s, v) => s + v, 0) / qScores.length;
        const variance = qScores.reduce((s, v) => s + (v - meanQ) ** 2, 0) / qScores.length;
        consistency    = clamp(1 - variance * 2.5, 0, 1);

        // Average time across all questions for display
        const allTimes = questionData.map(d => d.time_taken || 0).filter(t => t > 0);
        if (allTimes.length > 0) {
            avgTimePerQuestion = Math.round(allTimes.reduce((s, t) => s + t, 0) / allTimes.length);
        }

    } else if (questionTimings.length > 0) {
        // Legacy path: timings only
        const times = questionTimings.map(t => (typeof t === 'object' ? t.time_taken : t) || 0);
        const avg   = times.reduce((s, t) => s + t, 0) / times.length;
        speedScore         = clamp(1 - avg / MAX_SECONDS_PER_Q, 0, 1);
        avgTimePerQuestion = Math.round(avg);
    }

    // ── 3. Composite score ─────────────────────────────────────────────────
    const raw     = accuracy * 0.60 + speedScore * 0.25 + consistency * 0.15 - guessingPenalty;
    const mlScore = round4(clamp(raw, 0, 1));

    // ── 4. Level ───────────────────────────────────────────────────────────
    const level = mlScore < 0.4 ? 'easy' : mlScore <= 0.7 ? 'medium' : 'hard';

    return {
        level, mlScore, accuracy, speedScore,
        consistency: round4(consistency),
        guessingFlag, guessingCount,
        breakdown: {
            accuracyContribution:    round4(accuracy   * 0.60),
            speedContribution:       round4(speedScore  * 0.25),
            consistencyContribution: round4(consistency * 0.15),
            guessingPenalty:         round4(guessingPenalty),
            avgTimePerQuestion,
        },
    };
}

// ─── updateUserProfile ────────────────────────────────────────────────────────
function updateUserProfile(existing, newResult) {
    const alpha = 0.3;

    let avgAccuracy, avgSpeedScore, avgMlScore;

    if (!existing || existing.total_quizzes === 0) {
        avgAccuracy   = newResult.accuracy;
        avgSpeedScore = newResult.speedScore;
        avgMlScore    = newResult.mlScore;
    } else {
        avgAccuracy   = existing.avg_accuracy    * (1 - alpha) + newResult.accuracy    * alpha;
        avgSpeedScore = existing.avg_speed_score * (1 - alpha) + newResult.speedScore  * alpha;
        avgMlScore    = existing.ml_score        * (1 - alpha) + newResult.mlScore     * alpha;
    }

    avgAccuracy   = round4(avgAccuracy);
    avgSpeedScore = round4(avgSpeedScore);
    avgMlScore    = round4(avgMlScore);

    const currentLevel = avgMlScore < 0.4 ? 'easy' : avgMlScore <= 0.7 ? 'medium' : 'hard';

    return { currentLevel, avgAccuracy, avgSpeedScore, avgMlScore };
}

// ─── assessLevelProgression ───────────────────────────────────────────────────
/**
 * Decide whether a user should move up, stay, or step down a difficulty level.
 *
 * @param {object}   profile        – user_level_profiles row (or null)
 * @param {object[]} recentResults  – last quiz_results rows, newest first
 *                                    each must have { ml_score }
 * @returns {{ recommendation: 'upgrade'|'maintain'|'downgrade', targetLevel, reason, confidence, trend }}
 */
function assessLevelProgression(profile, recentResults = []) {
    const defaultLevel = (profile && profile.current_level) || 'medium';

    if (!profile || profile.total_quizzes < 2) {
        return {
            recommendation: 'maintain',
            targetLevel: defaultLevel,
            reason: 'Complete more quizzes to get a personalised level recommendation.',
            confidence: 0,
            trend: 0,
        };
    }

    const currentLevel = profile.current_level;
    const avgScore     = parseFloat(profile.ml_score)     || 0;
    const avgAccuracy  = parseFloat(profile.avg_accuracy) || 0;

    // Trend: compare average of 2 newest results to the older ones
    let trend = 0;
    if (recentResults.length >= 2) {
        const scores   = recentResults.map(r => parseFloat(r.ml_score) || 0);
        const recentAv = scores.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
        const olderAv  = scores.slice(2).length
            ? scores.slice(2).reduce((a, b) => a + b, 0) / scores.slice(2).length
            : avgScore;
        trend = round4(recentAv - olderAv);
    }

    const pct = v => `${Math.round(v * 100)}%`;

    let recommendation, reason, confidence;

    if (currentLevel === 'easy') {
        if (avgScore > 0.65 && avgAccuracy > 0.70) {
            recommendation = 'upgrade';
            reason         = `Your accuracy is ${pct(avgAccuracy)} and ML score is ${pct(avgScore)} — you're ready for medium-level quizzes.`;
            confidence     = clamp((avgScore - 0.65) * 6, 0.5, 1);
        } else if (trend > 0.1) {
            recommendation = 'upgrade';
            reason         = 'Your recent scores are improving steadily — try medium-level content.';
            confidence     = 0.5;
        } else {
            recommendation = 'maintain';
            reason         = `Keep practising easy quizzes to build confidence (current accuracy: ${pct(avgAccuracy)}).`;
            confidence     = 0.7;
        }
    } else if (currentLevel === 'medium') {
        if (avgScore > 0.75 && avgAccuracy > 0.80) {
            recommendation = 'upgrade';
            reason         = `Excellent! Your ${pct(avgAccuracy)} accuracy shows you're ready for hard-level quizzes.`;
            confidence     = clamp((avgScore - 0.75) * 6, 0.5, 1);
        } else if (avgScore < 0.35 || avgAccuracy < 0.40) {
            recommendation = 'downgrade';
            reason         = `Your accuracy (${pct(avgAccuracy)}) suggests revisiting easy quizzes to reinforce the basics.`;
            confidence     = clamp((0.40 - avgAccuracy) * 5, 0.4, 1);
        } else if (trend < -0.1 && profile.total_quizzes >= 3) {
            recommendation = 'downgrade';
            reason         = 'Your scores have been declining — easier quizzes may help consolidate your knowledge.';
            confidence     = 0.4;
        } else {
            recommendation = 'maintain';
            reason         = `Good progress at medium level (score: ${pct(avgScore)}). Keep going to unlock hard-level content.`;
            confidence     = 0.7;
        }
    } else { // hard
        if (avgScore < 0.45 || avgAccuracy < 0.50) {
            recommendation = 'downgrade';
            reason         = `Hard quizzes are very challenging right now (accuracy: ${pct(avgAccuracy)}). Medium-level practice will help.`;
            confidence     = clamp((0.50 - avgAccuracy) * 4, 0.4, 1);
        } else if (trend < -0.15 && profile.total_quizzes >= 3) {
            recommendation = 'downgrade';
            reason         = 'Recent results are declining — stepping back to medium level may help.';
            confidence     = 0.5;
        } else {
            recommendation = 'maintain';
            reason         = `You're performing well at the hard level (score: ${pct(avgScore)}). Keep challenging yourself!`;
            confidence     = 0.8;
        }
    }

    const levels    = ['easy', 'medium', 'hard'];
    const idx       = levels.indexOf(currentLevel);
    const targetIdx = idx + (recommendation === 'upgrade' ? 1 : recommendation === 'downgrade' ? -1 : 0);
    const targetLevel = levels[clamp(targetIdx, 0, 2)];

    return { recommendation, targetLevel, reason, confidence: round4(confidence), trend };
}

// ─── generateAISummary ────────────────────────────────────────────────────────
function generateAISummary({
    quizTitle, percentage, predictedLevel, mlScore,
    avgTimePerQuestion, wrongTopics = [],
    guessingFlag = false, consistency = 1,
    progression = null,
}) {
    const lines = [];

    // Opening
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
        lines.push(`Your average response time was ${avgTimePerQuestion}s — try to build familiarity with the content to answer faster.`);
    }

    // Guessing warning
    if (guessingFlag) {
        lines.push('Some incorrect answers were submitted very quickly — make sure you read each question carefully before answering.');
    }

    // Consistency insight
    if (consistency >= 0.80) {
        lines.push('Your performance was consistent throughout the quiz.');
    } else if (consistency >= 0.55) {
        lines.push('Your performance varied across questions — try to maintain steady focus from start to finish.');
    } else {
        lines.push('Your results were inconsistent. Consider revisiting the topic to build more even understanding.');
    }

    // Level progression recommendation
    if (progression) {
        const arrow = { upgrade: '↑', maintain: '→', downgrade: '↓' };
        lines.push(`${arrow[progression.recommendation] || '→'} ${progression.reason}`);
    } else {
        const levelMessages = {
            easy:   'Based on this result, we recommend starting with easier quizzes to strengthen your foundation.',
            medium: 'Medium-difficulty quizzes are a great match for your current level — keep it up.',
            hard:   'You are ready for harder challenges! Try advanced quizzes to keep pushing yourself.',
        };
        lines.push(levelMessages[predictedLevel] || levelMessages.medium);
    }

    // Weak topics
    if (wrongTopics.length > 0) {
        const preview = wrongTopics.slice(0, 3);
        lines.push(`Focus areas: ${preview.map(t => `"${t}"`).join(', ')}.`);
    }

    lines.push(`Your adaptive learning score: ${(mlScore * 100).toFixed(1)} / 100.`);

    return lines.join(' ');
}

// ─── buildRecommendationCriteria ─────────────────────────────────────────────
function buildRecommendationCriteria({ currentLevel, weakLessonIds = [], doneQuizIds = [], progression = null }) {
    const levels    = ['easy', 'medium', 'hard'];
    const idx       = levels.indexOf(currentLevel);
    const targetIdx = idx + (progression?.recommendation === 'upgrade' ? 1 : progression?.recommendation === 'downgrade' ? -1 : 0);
    const targetLevel = levels[clamp(targetIdx, 0, 2)];

    return {
        preferredLevel:  targetLevel,
        adjacentLevel:   progression?.targetLevel !== currentLevel ? progression?.targetLevel : null,
        weakLessonIds,
        excludeQuizIds:  doneQuizIds,
        progression,
    };
}

module.exports = {
    predictLevel,
    updateUserProfile,
    assessLevelProgression,
    generateAISummary,
    buildRecommendationCriteria,
};
