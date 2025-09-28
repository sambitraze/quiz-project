'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/LoadingSpinner';
import { quizzesAPI, lessonsAPI } from '@/lib/api';
import { FileQuestion, Search, Edit, Trash2, Plus, Eye, Minus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QuizzesManagement() {
    const [quizzes, setQuizzes] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingQuiz, setEditingQuiz] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        lesson_id: '',
        questions: [{ question_text: '', options: ['', '', '', ''], correct_answer: 0, points: 1 }]
    });

    useEffect(() => {
        fetchQuizzes();
        fetchLessons();
    }, [pagination.page]);

    const fetchQuizzes = async () => {
        try {
            setLoading(true);
            const response = await quizzesAPI.getAllQuizzes(pagination.page, pagination.limit);
            setQuizzes(response.data.quizzes);
            setPagination(prev => ({ ...prev, ...response.data.pagination }));
        } catch (error) {
            console.error('Error fetching quizzes:', error);
            toast.error('Failed to fetch quizzes');
        } finally {
            setLoading(false);
        }
    };

    const fetchLessons = async () => {
        try {
            const response = await lessonsAPI.getAllLessons(1, 100); // Get more lessons for dropdown
            setLessons(response.data.lessons);
        } catch (error) {
            console.error('Error fetching lessons:', error);
        }
    };

    const handleCreateQuiz = async (e) => {
        e.preventDefault();
        try {
            // Filter out empty questions
            const validQuestions = formData.questions.filter(q =>
                q.question_text.trim() && q.options.some(opt => opt.trim())
            );

            if (validQuestions.length === 0) {
                toast.error('Please add at least one valid question');
                return;
            }

            await quizzesAPI.createQuiz({ ...formData, questions: validQuestions });
            toast.success('Quiz created successfully');
            setShowCreateModal(false);
            resetForm();
            fetchQuizzes();
        } catch (error) {
            console.error('Error creating quiz:', error);
            toast.error('Failed to create quiz');
        }
    };

    const handleUpdateQuiz = async (e) => {
        e.preventDefault();
        try {
            const validQuestions = formData.questions.filter(q =>
                q.question_text.trim() && q.options.some(opt => opt.trim())
            );

            await quizzesAPI.updateQuiz(editingQuiz.id, { ...formData, questions: validQuestions });
            toast.success('Quiz updated successfully');
            setEditingQuiz(null);
            resetForm();
            fetchQuizzes();
        } catch (error) {
            console.error('Error updating quiz:', error);
            toast.error('Failed to update quiz');
        }
    };

    const handleDeleteQuiz = async (quizId) => {
        if (window.confirm('Are you sure you want to delete this quiz? This will also delete all associated results.')) {
            try {
                await quizzesAPI.deleteQuiz(quizId);
                toast.success('Quiz deleted successfully');
                fetchQuizzes();
            } catch (error) {
                console.error('Error deleting quiz:', error);
                toast.error('Failed to delete quiz');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            lesson_id: '',
            questions: [{ question_text: '', options: ['', '', '', ''], correct_answer: 0, points: 1 }]
        });
    };

    const openEditModal = async (quiz) => {
        try {
            const fullQuiz = await quizzesAPI.getQuizById(quiz.id);
            setEditingQuiz(quiz);
            setFormData({
                title: fullQuiz.data.quiz.title,
                description: fullQuiz.data.quiz.description,
                lesson_id: fullQuiz.data.quiz.lesson_id || '',
                questions: fullQuiz.data.quiz.questions.map(q => ({
                    ...q,
                    options: Array.isArray(q.options) ? q.options : JSON.parse(q.options)
                }))
            });
        } catch (error) {
            console.error('Error fetching quiz details:', error);
            toast.error('Failed to load quiz details');
        }
    };

    const addQuestion = () => {
        setFormData(prev => ({
            ...prev,
            questions: [...prev.questions, { question_text: '', options: ['', '', '', ''], correct_answer: 0, points: 1 }]
        }));
    };

    const removeQuestion = (index) => {
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index)
        }));
    };

    const updateQuestion = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.map((q, i) =>
                i === index ? { ...q, [field]: value } : q
            )
        }));
    };

    const updateOption = (questionIndex, optionIndex, value) => {
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.map((q, i) =>
                i === questionIndex ? {
                    ...q,
                    options: q.options.map((opt, j) => j === optionIndex ? value : opt)
                } : q
            )
        }));
    };

    const filteredQuizzes = quizzes.filter(quiz =>
        quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (quiz.description && quiz.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const QuizModal = ({ isOpen, onClose, onSubmit, isEditing }) => {
        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center text-black z-50 p-4">
                <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                        <h2 className="text-xl font-bold mb-4">
                            {isEditing ? 'Edit Quiz' : 'Create New Quiz'}
                        </h2>
                        <form onSubmit={onSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Associated Lesson (Optional)
                                    </label>
                                    <select
                                        value={formData.lesson_id}
                                        onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">No lesson</option>
                                        {lessons.map(lesson => (
                                            <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Questions</label>
                                    <button
                                        type="button"
                                        onClick={addQuestion}
                                        className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Question
                                    </button>
                                </div>

                                {formData.questions.map((question, qIndex) => (
                                    <div key={qIndex} className="border border-gray-200 rounded-lg p-4 mb-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="font-medium">Question {qIndex + 1}</h4>
                                            {formData.questions.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeQuestion(qIndex)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="Enter question text"
                                                    value={question.question_text}
                                                    onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                    required
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {question.options.map((option, oIndex) => (
                                                    <div key={oIndex} className="flex items-center space-x-2">
                                                        <input
                                                            type="radio"
                                                            name={`correct-${qIndex}`}
                                                            checked={question.correct_answer === oIndex}
                                                            onChange={() => updateQuestion(qIndex, 'correct_answer', oIndex)}
                                                            className="text-blue-600"
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder={`Option ${oIndex + 1}`}
                                                            value={option}
                                                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                                            className="flex-1 px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex items-center space-x-4">
                                                <label className="text-sm text-gray-600">Points:</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={question.points}
                                                    onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value))}
                                                    className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    {isEditing ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    };

    if (loading && quizzes.length === 0) {
        return (
            <ProtectedRoute adminOnly>
                <LoadingSpinner text="Loading quizzes..." />
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute adminOnly>
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8 flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Quiz Management</h1>
                            <p className="mt-2 text-gray-600">Create and manage quizzes</p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Quiz
                        </button>
                    </div>

                    {/* Search */}
                    <div className="bg-white rounded-lg shadow mb-6">
                        <div className="p-6">
                            <div className="relative">
                                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                                <input
                                    type="text"
                                    placeholder="Search quizzes..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Quizzes Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            <div className="col-span-full">
                                <LoadingSpinner size="small" text="Loading quizzes..." />
                            </div>
                        ) : filteredQuizzes.length === 0 ? (
                            <div className="col-span-full text-center py-8">
                                <FileQuestion className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No quizzes found</p>
                            </div>
                        ) : (
                            filteredQuizzes.map((quiz) => (
                                <div key={quiz.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                                    <div className="p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{quiz.title}</h3>
                                        {quiz.description && (
                                            <p className="text-gray-600 text-sm mb-3">{quiz.description}</p>
                                        )}
                                        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                                            <span>{quiz.question_count} questions</span>
                                            {quiz.lesson_title && <span>Lesson: {quiz.lesson_title}</span>}
                                        </div>
                                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                            <span>By {quiz.created_by_username}</span>
                                            <span>{new Date(quiz.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                onClick={() => window.open(`/quizzes/${quiz.id}`, '_blank')}
                                                className="p-2 text-gray-600 hover:text-gray-900"
                                                title="View"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => openEditModal(quiz)}
                                                className="p-2 text-blue-600 hover:text-blue-900"
                                                title="Edit"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteQuiz(quiz.id)}
                                                className="p-2 text-red-600 hover:text-red-900"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="mt-8 flex justify-center">
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                    disabled={pagination.page === 1}
                                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <span className="px-3 py-1 text-sm text-gray-700">
                                    Page {pagination.page} of {pagination.pages}
                                </span>
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                    disabled={pagination.page === pagination.pages}
                                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            <QuizModal
                isOpen={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                    resetForm();
                }}
                onSubmit={handleCreateQuiz}
                isEditing={false}
            />

            {/* Edit Modal */}
            <QuizModal
                isOpen={!!editingQuiz}
                onClose={() => {
                    setEditingQuiz(null);
                    resetForm();
                }}
                onSubmit={handleUpdateQuiz}
                isEditing={true}
            />
        </ProtectedRoute>
    );
}