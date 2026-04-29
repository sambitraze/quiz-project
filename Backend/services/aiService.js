/**
 * AI Service — Google Gemini API integration with local fallback
 *
 * Uses the free Gemini REST API (gemini-1.5-flash model — generous free tier).
 * If GEMINI_API_KEY is not set, every function gracefully falls back to a
 * deterministic local implementation so the app still works without a key.
 *
 * Set in .env:
 *   GEMINI_API_KEY=your_key_here
 *
 * Free tier limits (as of 2024):
 *   - 15 requests / minute
 *   - 1 million tokens / day
 *   - No charge for basic usage
 */

const https = require('https');

const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_BASE = 'generativelanguage.googleapis.com';
const GEMINI_PATH = `/v1beta/models/${GEMINI_MODEL}:generateContent`;
const REQUEST_TIMEOUT_MS = 15000;

// ─── low-level HTTP helper ────────────────────────────────────────────────────

function geminiRequest(apiKey, prompt) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
        });

        const options = {
            hostname: GEMINI_BASE,
            path: `${GEMINI_PATH}?key=${apiKey}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.candidates && parsed.candidates[0]?.content?.parts[0]?.text) {
                        resolve(parsed.candidates[0].content.parts[0].text.trim());
                    } else if (parsed.error) {
                        reject(new Error(`Gemini API error: ${parsed.error.message}`));
                    } else {
                        reject(new Error('Unexpected Gemini response structure'));
                    }
                } catch (e) {
                    reject(new Error(`Failed to parse Gemini response: ${e.message}`));
                }
            });
        });

        req.setTimeout(REQUEST_TIMEOUT_MS, () => {
            req.destroy();
            reject(new Error('Gemini request timed out'));
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

function getApiKey() {
    return process.env.GEMINI_API_KEY || null;
}

// ─── 1. Enhanced Quiz Performance Summary ────────────────────────────────────

/**
 * Generate an AI-enhanced performance summary for a quiz attempt.
 *
 * @param {object} opts
 * @param {string}   opts.quizTitle
 * @param {number}   opts.percentage         0–100
 * @param {string}   opts.predictedLevel     easy | medium | hard
 * @param {number}   opts.mlScore            0–1
 * @param {number}   opts.avgTimePerQuestion seconds
 * @param {string[]} opts.wrongQuestions     question texts the student got wrong
 * @param {boolean}  opts.guessingFlag
 * @param {number}   opts.consistency        0–1
 * @param {object}   [opts.progression]      { recommendation, reason }
 * @param {string}   [opts.localFallback]    pre-computed local summary
 * @returns {Promise<{ summary: string, aiPowered: boolean }>}
 */
async function enhanceSummary(opts) {
    const {
        quizTitle, percentage, predictedLevel, mlScore,
        avgTimePerQuestion = 30, wrongQuestions = [],
        guessingFlag = false, consistency = 1,
        progression = null, localFallback = '',
    } = opts;

    const apiKey = getApiKey();
    if (!apiKey) {
        return { summary: localFallback, aiPowered: false };
    }

    const wrongList = wrongQuestions.length > 0
        ? wrongQuestions.slice(0, 5).map((q, i) => `${i + 1}. ${q}`).join('\n')
        : 'None — all questions answered correctly!';

    const progressionNote = progression
        ? `Progression recommendation: ${progression.recommendation} — ${progression.reason}`
        : '';

    const prompt = `You are an encouraging educational AI tutor. Write a concise, personalised quiz performance summary in 3–4 sentences.

Quiz: "${quizTitle}"
Score: ${percentage}%
Difficulty level assessed: ${predictedLevel}
ML performance score: ${(mlScore * 100).toFixed(1)}/100
Average time per question: ${avgTimePerQuestion}s
Performance consistency: ${Math.round(consistency * 100)}%
Suspected guessing detected: ${guessingFlag ? 'Yes' : 'No'}
${progressionNote}

Questions answered incorrectly:
${wrongList}

Instructions:
- Be encouraging but honest
- Mention specific areas to review if there are wrong questions
- Give one concrete study tip
- Keep it under 80 words
- Do NOT use bullet points`;

    try {
        const aiText = await geminiRequest(apiKey, prompt);
        return { summary: aiText, aiPowered: true };
    } catch (err) {
        console.warn('[aiService] Gemini enhanceSummary failed, using fallback:', err.message);
        return { summary: localFallback, aiPowered: false };
    }
}

// ─── 2. Question Hint ─────────────────────────────────────────────────────────

/**
 * Generate a helpful hint for a question the student got wrong.
 *
 * @param {object} opts
 * @param {string} opts.questionText
 * @param {string[]} opts.options
 * @param {number} opts.correctAnswerIndex
 * @returns {Promise<{ hint: string, aiPowered: boolean }>}
 */
async function generateHint(opts) {
    const { questionText, options = [], correctAnswerIndex } = opts;

    const apiKey = getApiKey();
    const correctOption = options[correctAnswerIndex] || '';

    if (!apiKey) {
        return {
            hint: `Think carefully about "${questionText.slice(0, 60)}...". Review the core concepts related to this topic.`,
            aiPowered: false,
        };
    }

    const optionList = options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join('\n');

    const prompt = `A student got the following quiz question wrong. Give a helpful hint that guides them toward the correct answer WITHOUT directly revealing it.

Question: ${questionText}
Options:
${optionList}

Instructions:
- Give a single short hint (1–2 sentences max)
- Do NOT state the correct answer directly
- Focus on the key concept or reasoning needed
- Be encouraging`;

    try {
        const aiText = await geminiRequest(apiKey, prompt);
        return { hint: aiText, aiPowered: true };
    } catch (err) {
        console.warn('[aiService] Gemini generateHint failed, using fallback:', err.message);
        return {
            hint: `Hint: Think about what "${questionText.slice(0, 50)}..." is asking at its core. Review the relevant concept.`,
            aiPowered: false,
        };
    }
}

// ─── 3. Quiz Quality Rating ───────────────────────────────────────────────────

/**
 * Rate a quiz's educational quality and suggest improvements.
 *
 * @param {object} opts
 * @param {string}   opts.quizTitle
 * @param {string}   opts.quizDescription
 * @param {string}   opts.level
 * @param {object[]} opts.questions   [{ question_text, options, correct_answer }]
 * @returns {Promise<{ rating: number, feedback: string, suggestions: string[], aiPowered: boolean }>}
 */
async function rateQuiz(opts) {
    const { quizTitle, quizDescription = '', level = 'medium', questions = [] } = opts;

    const apiKey = getApiKey();

    // Local fallback: simple heuristic rating
    const localRating = Math.min(5, Math.max(1, Math.round(2 + questions.length * 0.4)));
    if (!apiKey) {
        return {
            rating: localRating,
            feedback: `Quiz "${quizTitle}" has ${questions.length} question(s) at ${level} level.`,
            suggestions: ['Add more questions for better coverage', 'Ensure distractors are plausible'],
            aiPowered: false,
        };
    }

    const qList = questions.slice(0, 8).map((q, i) =>
        `Q${i + 1}: ${q.question_text}\n  Options: ${q.options?.join(' | ') || 'N/A'}`
    ).join('\n');

    const prompt = `You are an educational content quality reviewer. Evaluate this quiz and respond in JSON only.

Quiz title: "${quizTitle}"
Description: "${quizDescription}"
Difficulty level: ${level}
Number of questions: ${questions.length}

Questions:
${qList}

Respond with ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "rating": <integer 1-5>,
  "feedback": "<1-2 sentence overall assessment>",
  "suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"]
}`;

    try {
        const aiText = await geminiRequest(apiKey, prompt);
        // Strip any markdown code fences if present
        const cleaned = aiText.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return {
            rating: Math.min(5, Math.max(1, parseInt(parsed.rating) || localRating)),
            feedback: parsed.feedback || '',
            suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 5) : [],
            aiPowered: true,
        };
    } catch (err) {
        console.warn('[aiService] Gemini rateQuiz failed, using fallback:', err.message);
        return {
            rating: localRating,
            feedback: `Quiz "${quizTitle}" has ${questions.length} question(s) at ${level} level.`,
            suggestions: ['Add more questions for better coverage', 'Ensure distractors are plausible'],
            aiPowered: false,
        };
    }
}

// ─── 4. Generate Quiz Questions ───────────────────────────────────────────────

/**
 * Generate multiple-choice questions for a given topic and difficulty.
 *
 * @param {object} opts
 * @param {string} opts.topic
 * @param {string} opts.difficulty   easy | medium | hard
 * @param {number} opts.count        1–10
 * @param {string} [opts.context]    optional lesson content for grounding
 * @returns {Promise<{ questions: object[], aiPowered: boolean }>}
 */
async function generateQuestions(opts) {
    const { topic, difficulty = 'medium', count = 3, context = '' } = opts;
    const safeCount = Math.min(10, Math.max(1, parseInt(count) || 3));

    const apiKey = getApiKey();
    if (!apiKey) {
        return {
            questions: [],
            aiPowered: false,
            message: 'Set GEMINI_API_KEY in .env to enable AI question generation.',
        };
    }

    const contextSection = context
        ? `\nLesson context (use this to ground the questions):\n${context.slice(0, 1000)}\n`
        : '';

    const prompt = `Generate ${safeCount} multiple-choice quiz question(s) about "${topic}" at ${difficulty} difficulty.${contextSection}

Respond with ONLY valid JSON array (no markdown, no extra text):
[
  {
    "question_text": "<question>",
    "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
    "correct_answer": <0-based index of correct option>,
    "points": <1 for easy, 2 for medium, 3 for hard>,
    "explanation": "<brief explanation of the correct answer>"
  }
]`;

    try {
        const aiText = await geminiRequest(apiKey, prompt);
        const cleaned = aiText.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (!Array.isArray(parsed)) throw new Error('Expected JSON array');
        const questions = parsed.slice(0, safeCount).map(q => ({
            question_text: String(q.question_text || ''),
            options: Array.isArray(q.options) ? q.options.slice(0, 4).map(String) : [],
            correct_answer: Math.min(3, Math.max(0, parseInt(q.correct_answer) || 0)),
            points: Math.min(5, Math.max(1, parseInt(q.points) || 1)),
            explanation: String(q.explanation || ''),
        })).filter(q => q.question_text && q.options.length >= 2);
        return { questions, aiPowered: true };
    } catch (err) {
        console.warn('[aiService] Gemini generateQuestions failed:', err.message);
        return { questions: [], aiPowered: false, message: err.message };
    }
}

// ─── 5. Lesson Content Summary ────────────────────────────────────────────────

/**
 * Summarise a lesson's content in 2–3 bullet points for quick review.
 *
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} opts.content
 * @returns {Promise<{ summary: string[], aiPowered: boolean }>}
 */
async function summariseLesson(opts) {
    const { title, content = '' } = opts;
    const apiKey = getApiKey();

    if (!apiKey || !content) {
        return { summary: [], aiPowered: false };
    }

    const prompt = `Summarise the following educational lesson in exactly 3 concise bullet points (each ≤ 20 words). Respond with ONLY valid JSON array of strings, e.g. ["point 1", "point 2", "point 3"].

Lesson title: "${title}"
Content: ${content.slice(0, 2000)}`;

    try {
        const aiText = await geminiRequest(apiKey, prompt);
        const cleaned = aiText.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (!Array.isArray(parsed)) throw new Error('Expected array');
        return { summary: parsed.slice(0, 3).map(String), aiPowered: true };
    } catch (err) {
        console.warn('[aiService] Gemini summariseLesson failed:', err.message);
        return { summary: [], aiPowered: false };
    }
}

module.exports = {
    enhanceSummary,
    generateHint,
    rateQuiz,
    generateQuestions,
    summariseLesson,
    isConfigured: () => !!getApiKey(),
};
