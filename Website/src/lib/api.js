import axios from 'axios';
import Cookies from 'js-cookie';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = Cookies.get('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Only auto-redirect on 401 if we're NOT on the login/register page
        // and it's not an auth endpoint itself (to avoid redirect loops)
        if (error.response?.status === 401) {
            const url = error.config?.url || '';
            const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
            if (!isAuthEndpoint && typeof window !== 'undefined') {
                const isOnAuthPage = window.location.pathname.startsWith('/auth/');
                if (!isOnAuthPage) {
                    Cookies.remove('token');
                    Cookies.remove('user');
                    window.location.href = '/auth/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

// Auth API calls
export const authAPI = {
    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },

    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },

    getProfile: async () => {
        const response = await api.get('/auth/profile');
        return response.data;
    }
};

// Users API calls
export const usersAPI = {
    getAllUsers: async (page = 1, limit = 10) => {
        const response = await api.get(`/users?page=${page}&limit=${limit}`);
        return response.data;
    },

    getUserById: async (id) => {
        const response = await api.get(`/users/${id}`);
        return response.data;
    },

    updateUserRole: async (id, role) => {
        const response = await api.put(`/users/${id}/role`, { role });
        return response.data;
    },

    deleteUser: async (id) => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    },

    getUserStats: async () => {
        const response = await api.get('/users/stats/overview');
        return response.data;
    }
};

// Lessons API calls
export const lessonsAPI = {
    getAllLessons: async (page = 1, limit = 10) => {
        const response = await api.get(`/lessons?page=${page}&limit=${limit}`);
        return response.data;
    },

    getLessonById: async (id) => {
        const response = await api.get(`/lessons/${id}`);
        return response.data;
    },

    createLesson: async (lessonData) => {
        const response = await api.post('/lessons', lessonData);
        return response.data;
    },

    updateLesson: async (id, lessonData) => {
        const response = await api.put(`/lessons/${id}`, lessonData);
        return response.data;
    },

    deleteLesson: async (id) => {
        const response = await api.delete(`/lessons/${id}`);
        return response.data;
    },

    searchLessons: async (query, page = 1, limit = 10) => {
        const response = await api.get(`/lessons/search/${encodeURIComponent(query)}?page=${page}&limit=${limit}`);
        return response.data;
    }
};

// Quizzes API calls
export const quizzesAPI = {
    getAllQuizzes: async (page = 1, limit = 10) => {
        const response = await api.get(`/quizzes?page=${page}&limit=${limit}`);
        return response.data;
    },

    getQuizById: async (id) => {
        const response = await api.get(`/quizzes/${id}`);
        return response.data;
    },

    createQuiz: async (quizData) => {
        const response = await api.post('/quizzes', quizData);
        return response.data;
    },

    updateQuiz: async (id, quizData) => {
        const response = await api.put(`/quizzes/${id}`, quizData);
        return response.data;
    },

    deleteQuiz: async (id) => {
        const response = await api.delete(`/quizzes/${id}`);
        return response.data;
    },

    getQuizzesByLesson: async (lessonId) => {
        const response = await api.get(`/quizzes/lesson/${lessonId}`);
        return response.data;
    }
};

// Quiz Results API calls
export const quizResultsAPI = {
    submitQuiz: async (quizData) => {
        const response = await api.post('/quiz-results', quizData);
        return response.data;
    },

    getUserResults: async (userId, page = 1, limit = 10) => {
        const response = await api.get(`/quiz-results/user/${userId}?page=${page}&limit=${limit}`);
        return response.data;
    },

    getMyResults: async (page = 1, limit = 10) => {
        const user = JSON.parse(Cookies.get('user') || '{}');
        const response = await api.get(`/quiz-results/user/${user.id}?page=${page}&limit=${limit}`);
        return response.data;
    },

    getQuizResults: async (quizId, page = 1, limit = 10) => {
        const response = await api.get(`/quiz-results/quiz/${quizId}?page=${page}&limit=${limit}`);
        return response.data;
    },

    getResultById: async (id) => {
        const response = await api.get(`/quiz-results/${id}`);
        return response.data;
    },

    deleteResult: async (id) => {
        const response = await api.delete(`/quiz-results/${id}`);
        return response.data;
    }
};

// Feedback API calls
export const feedbackAPI = {
    getAllFeedback: async (page = 1, limit = 10) => {
        const response = await api.get(`/feedback?page=${page}&limit=${limit}`);
        return response.data;
    },

    getLessonFeedback: async (lessonId, page = 1, limit = 10) => {
        const response = await api.get(`/feedback/lesson/${lessonId}?page=${page}&limit=${limit}`);
        return response.data;
    },

    createFeedback: async (feedbackData) => {
        const response = await api.post('/feedback', feedbackData);
        return response.data;
    },

    updateFeedback: async (id, feedbackData) => {
        const response = await api.put(`/feedback/${id}`, feedbackData);
        return response.data;
    },

    deleteFeedback: async (id) => {
        const response = await api.delete(`/feedback/${id}`);
        return response.data;
    },

    getMyFeedback: async (page = 1, limit = 10) => {
        const response = await api.get(`/feedback/my-feedback?page=${page}&limit=${limit}`);
        return response.data;
    }
};

// ML / Adaptive Learning API calls
export const mlAPI = {
    getUserProfile: async (userId) => {
        const response = await api.get(`/ml/profile/${userId}`);
        return response.data;
    },

    getRecommendations: async (userId) => {
        const response = await api.get(`/ml/recommendations/${userId}`);
        return response.data;
    },

    getResultSummary: async (resultId) => {
        const response = await api.get(`/ml/summary/${resultId}`);
        return response.data;
    },

    getAdminOverview: async () => {
        const response = await api.get('/ml/admin/overview');
        return response.data;
    },
};

// AI Features API calls (Google Gemini — free tier with fallback)
export const aiAPI = {
    /** Check whether the backend has a Gemini API key configured */
    getStatus: async () => {
        const response = await api.get('/ai/status');
        return response.data;
    },

    /** AI-enhanced performance summary for a quiz result */
    getEnhancedSummary: async (resultId) => {
        const response = await api.get(`/ai/summary/${resultId}`);
        return response.data;
    },

    /** Get a hint for a question the student answered incorrectly */
    getHint: async (questionId, quizResultId) => {
        const response = await api.post('/ai/hint', { question_id: questionId, quiz_result_id: quizResultId });
        return response.data;
    },

    /** Admin: rate a quiz's educational quality */
    rateQuiz: async (quizId) => {
        const response = await api.post(`/ai/rate-quiz/${quizId}`);
        return response.data;
    },

    /** Admin: generate quiz questions for a topic using AI */
    generateQuestions: async ({ topic, difficulty = 'medium', count = 3, lessonId }) => {
        const response = await api.post('/ai/generate-questions', {
            topic, difficulty, count, lesson_id: lessonId,
        });
        return response.data;
    },

    /** Get a 3-bullet AI summary of a lesson's content */
    getLessonSummary: async (lessonId) => {
        const response = await api.get(`/ai/lesson-summary/${lessonId}`);
        return response.data;
    },
};

export default api;