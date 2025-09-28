'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { quizzesAPI } from '@/lib/api';
import { Award, Clock, Target, ArrowRight, Trophy, Star } from 'lucide-react';

export default function PublicQuizzes() {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 0 });

    useEffect(() => {
        fetchQuizzes();
    }, [pagination.page]);

    const fetchQuizzes = async () => {
        try {
            setLoading(true);
            const response = await quizzesAPI.getAllQuizzes(pagination.page, pagination.limit);
            console.log('Public quizzes API response:', response);
            setQuizzes(response.quizzes || []);
            setPagination(prev => ({ ...prev, ...response.pagination }));
        } catch (error) {
            console.error('Error fetching quizzes:', error);
            setQuizzes([]);
        } finally {
            setLoading(false);
        }
    };

    const getDifficultyLevel = (questionCount) => {
        if (questionCount <= 5) return { label: 'Easy', color: 'bg-green-100 text-green-800', icon: '⭐' };
        if (questionCount <= 10) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800', icon: '⭐⭐' };
        return { label: 'Hard', color: 'bg-red-100 text-red-800', icon: '⭐⭐⭐' };
    };

    if (loading && quizzes.length === 0) {
        return <LoadingSpinner text="Loading quizzes..." />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Test Your <span className="text-purple-600">Knowledge</span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Challenge yourself with our interactive quizzes and track your progress as you learn.
                    </p>
                    <div className="mt-8">
                        <Link
                            href="/auth/login"
                            className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            Login to Take Quizzes
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </div>
                </div>

                {/* Quiz Stats Banner */}
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <div className="flex flex-col items-center">
                            <Trophy className="h-12 w-12 text-yellow-500 mb-3" />
                            <div className="text-3xl font-bold text-gray-900">{quizzes.length}</div>
                            <div className="text-gray-600">Available Quizzes</div>
                        </div>
                        <div className="flex flex-col items-center">
                            <Target className="h-12 w-12 text-blue-500 mb-3" />
                            <div className="text-3xl font-bold text-gray-900">
                                {quizzes.reduce((sum, quiz) => sum + (quiz.question_count || 0), 0)}
                            </div>
                            <div className="text-gray-600">Total Questions</div>
                        </div>
                        <div className="flex flex-col items-center">
                            <Star className="h-12 w-12 text-purple-500 mb-3" />
                            <div className="text-3xl font-bold text-gray-900">Interactive</div>
                            <div className="text-gray-600">Learning Experience</div>
                        </div>
                    </div>
                </div>

                {/* Quizzes Grid */}
                {quizzes.length === 0 ? (
                    <div className="text-center py-12">
                        <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No quizzes available</h3>
                        <p className="text-gray-600">Check back later for new challenges.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {quizzes.map(quiz => {
                                const difficulty = getDifficultyLevel(quiz.question_count);
                                return (
                                    <div key={quiz.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                                        <div className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{quiz.title}</h3>
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${difficulty.color}`}>
                                                        {difficulty.label}
                                                    </span>
                                                </div>
                                                <Award className="h-6 w-6 text-purple-600 flex-shrink-0" />
                                            </div>

                                            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                                {quiz.description || 'Test your understanding with this comprehensive quiz.'}
                                            </p>

                                            <div className="space-y-3 mb-6">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-500">Questions:</span>
                                                    <span className="font-medium text-gray-900 flex items-center">
                                                        <Target className="h-4 w-4 mr-1" />
                                                        {quiz.question_count}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-500">Time Limit:</span>
                                                    <span className="font-medium text-gray-900 flex items-center">
                                                        <Clock className="h-4 w-4 mr-1" />
                                                        {quiz.time_limit ? `${quiz.time_limit} min` : 'No limit'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-500">Difficulty:</span>
                                                    <span className="font-medium text-gray-900">{difficulty.icon}</span>
                                                </div>
                                            </div>

                                            <div className="border-t pt-4">
                                                <div className="flex space-x-2">
                                                    <Link
                                                        href={`/quizzes/${quiz.id}`}
                                                        className="flex-1 text-center px-3 py-2 border border-purple-600 text-purple-600 rounded-md hover:bg-purple-50 transition-colors"
                                                    >
                                                        Preview
                                                    </Link>
                                                    <Link
                                                        href="/auth/login"
                                                        className="flex-1 text-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                                                    >
                                                        Take Quiz
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="mt-12 flex items-center justify-center">
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                        disabled={pagination.page === 1}
                                        className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-md disabled:opacity-50 hover:bg-gray-50"
                                    >
                                        Previous
                                    </button>

                                    <span className="px-4 py-2 text-sm text-gray-700">
                                        Page {pagination.page} of {pagination.pages}
                                    </span>

                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                        disabled={pagination.page === pagination.pages}
                                        className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-md disabled:opacity-50 hover:bg-gray-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Call to Action */}
                <div className="mt-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-center text-white">
                    <h2 className="text-2xl font-bold mb-4">Ready to Challenge Yourself?</h2>
                    <p className="mb-6 opacity-90">
                        Join thousands of learners who are improving their skills through our interactive quiz platform.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/auth/register"
                            className="px-8 py-3 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                        >
                            Get Started Free
                        </Link>
                        <Link
                            href="/auth/login"
                            className="px-8 py-3 border border-white text-white rounded-lg hover:bg-white hover:text-purple-600 transition-colors"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}