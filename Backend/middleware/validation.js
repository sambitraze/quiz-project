const Joi = require('joi');

// User validation schemas
const registerSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(50).required(),
    role: Joi.string().valid('student', 'admin').default('student')
});

const loginSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
});

// Lesson validation schemas
const lessonSchema = Joi.object({
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(500).allow(''),
    content: Joi.string().min(1).required(),
    video_url: Joi.string().uri().allow(''),
    level: Joi.string().valid('beginner', 'intermediate', 'advanced').default('beginner')
});

// Quiz validation schemas
const quizSchema = Joi.object({
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(500),
    lesson_id: Joi.number().integer().positive(),
    questions: Joi.array().items(
        Joi.object({
            question_text: Joi.string().min(1).required(),
            options: Joi.array().items(Joi.string()).min(2).max(6).required(),
            correct_answer: Joi.number().integer().min(0).required(),
            points: Joi.number().integer().positive().default(1)
        })
    ).min(1).required()
});

// Quiz result validation schemas
const quizResultSchema = Joi.object({
    quiz_id: Joi.number().integer().positive().required(),
    answers: Joi.array().items(
        Joi.object({
            question_id: Joi.number().integer().positive().required(),
            selected_answer: Joi.number().integer().min(0).required()
        })
    ).required()
});

// Feedback validation schemas
const feedbackSchema = Joi.object({
    lesson_id: Joi.number().integer().positive().required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().max(1000).allow('')
});

// Middleware function to validate request body
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body);

        if (error) {
            return res.status(400).json({
                error: true,
                message: error.details[0].message,
                code: 'VALIDATION_ERROR'
            });
        }

        req.body = value; // Use validated and sanitized data
        next();
    };
};

module.exports = {
    registerSchema,
    loginSchema,
    lessonSchema,
    quizSchema,
    quizResultSchema,
    feedbackSchema,
    validate
};