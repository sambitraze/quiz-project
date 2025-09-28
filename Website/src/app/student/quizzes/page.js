'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/LoadingSpinner';
import { quizzesAPI } from '@/lib/api';
import { Award, Clock, Search, Filter, Play, CheckCircle, TrendingUp } from 'lucide-react';

export default function StudentQuizzes() {
    const [quizzes, setQuizzes] = useState([]);
    const [filteredQuizzes, setFilteredQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState('all');
    const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0, pages: 0 });

    useEffect(() => {
        fetchQuizzes();
    }, [pagination.page]);

    useEffect(() => {
        filterQuizzes();
    }, [quizzes, searchTerm, difficultyFilter]);

    const fetchQuizzes = async () => {
        try {
            setLoading(true);
            const response = await quizzesAPI.getAllQuizzes(pagination.page, pagination.limit);
            console.log('Student quizzes API response:', response);
            setQuizzes(response.data.quizzes || []);
            setPagination(prev => ({ ...prev, ...response.pagination }));
        } catch (error) {
            console.error('Error fetching quizzes:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterQuizzes = () => {
        let filtered = quizzes;

        if (searchTerm) {
            filtered = filtered.filter(quiz =>
                quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                quiz.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (difficultyFilter !== 'all') {
            // For now, we'll filter by question count as a proxy for difficulty
            const minQuestions = difficultyFilter === 'easy' ? 0 : difficultyFilter === 'medium' ? 6 : 11;
            const maxQuestions = difficultyFilter === 'easy' ? 5 : difficultyFilter === 'medium' ? 10 : 100;
            filtered = filtered.filter(quiz => quiz.question_count >= minQuestions && quiz.question_count <= maxQuestions);
        }

        setFilteredQuizzes(filtered);
    };

    const getDifficultyLevel = (questionCount) => {
        if (questionCount <= 5) return { label: 'Easy', color: 'bg-green-100 text-green-800' };
        if (questionCount <= 10) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
        return { label: 'Hard', color: 'bg-red-100 text-red-800' };
    };

    if (loading && quizzes.length === 0) {
        return (
            <ProtectedRoute>
                <LoadingSpinner text="Loading quizzes..." />
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Practice Quizzes</h1>
                                <p className="mt-2 text-gray-600">Test your knowledge and track your progress</p>
                            </div>
                            <Link
                                href="/student"
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Back to Dashboard
                            </Link>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-lg shadow mb-6">
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search quizzes..."
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Filter className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <select
                                        value={difficultyFilter}
                                        onChange={(e) => setDifficultyFilter(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="all">All Difficulties</option>
                                        <option value="easy">Easy (1-5 questions)</option>
                                        <option value="medium">Medium (6-10 questions)</option>
                                        <option value="hard">Hard (11+ questions)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quizzes Grid */}
                    {loading ? (
                        <div className="flex justify-center">
                            <LoadingSpinner size="small" text="Loading quizzes..." />
                        </div>
                    ) : filteredQuizzes.length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-8 text-center">
                            <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes found</h3>
                            <p className="text-gray-500">
                                {searchTerm || difficultyFilter !== 'all'
                                    ? 'Try adjusting your search or filters'
                                    : 'No quizzes available yet'
                                }
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredQuizzes.map(quiz => {
                                    const difficulty = getDifficultyLevel(quiz.question_count);
                                    return (
                                        <div key={quiz.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden">
                                            <div className="p-6">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{quiz.title}</h3>
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${difficulty.color}`}>
                                                            {difficulty.label}
                                                        </span>
                                                    </div>
                                                    <Award className="h-6 w-6 text-yellow-600 flex-shrink-0" />
                                                </div>

                                                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{quiz.description}</p>

                                                <div className="space-y-3 mb-4">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-500">Questions:</span>
                                                        <span className="font-medium text-gray-900">{quiz.question_count}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-500">Time Limit:</span>
                                                        <span className="font-medium text-gray-900 flex items-center">
                                                            <Clock className="h-4 w-4 mr-1" />
                                                            {quiz.time_limit ? `${quiz.time_limit} minutes` : 'No limit'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-500">Total Points:</span>
                                                        <span className="font-medium text-gray-900">{quiz.total_points || quiz.question_count}</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Link
                                                        href={`/student/quizzes/${quiz.id}`}
                                                        className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                                                    >
                                                        <Play className="mr-2 h-4 w-4" />
                                                        Take Quiz
                                                    </Link>

                                                    {/* Show if user has taken this quiz before */}
                                                    {quiz.user_best_score && (
                                                        <div className="flex items-center justify-center w-full px-3 py-2 bg-green-50 text-green-700 text-sm rounded-md">
                                                            <CheckCircle className="mr-2 h-4 w-4" />
                                                            Best Score: {quiz.user_best_score}%
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination */}
                            {pagination.pages > 1 && (
                                <div className="mt-8 flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Showing page {pagination.page} of {pagination.pages}
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                            disabled={pagination.page === 1}
                                            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded disabled:opacity-50 hover:bg-gray-300"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                            disabled={pagination.page === pagination.pages}
                                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded disabled:opacity-50 hover:bg-blue-700"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}