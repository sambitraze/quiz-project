import axios from 'axios';
import Cookies from 'js-cookie';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
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
        if (error.response?.status === 401) {
            // Token expired or invalid, redirect to login
            Cookies.remove('token');
            Cookies.remove('user');
            if (typeof window !== 'undefined') {
                window.location.href = '/auth/login';
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

export default api;