'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { quizzesAPI } from '@/lib/api';
import { Award, Clock, Target, ArrowLeft, Lock, User, Calendar, CheckCircle } from 'lucide-react';

export default function QuizPreview() {
    const params = useParams();
    const router = useRouter();
    const quizId = params.id;

    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (quizId) {
            fetchQuiz();
        }
    }, [quizId]);

    const fetchQuiz = async () => {
        try {
            setLoading(true);
            const response = await quizzesAPI.getQuizById(quizId);
            console.log('Quiz API response:', response); // Debug log
            setQuiz(response.data.quiz);
        } catch (error) {
            console.error('Error fetching quiz:', error);
            setError('Quiz not found or unavailable');
        } finally {
            setLoading(false);
        }
    };

    const getDifficultyLevel = (questionCount) => {
        if (questionCount <= 5) return { label: 'Easy', color: 'bg-green-100 text-green-800 border-green-200', icon: '⭐' };
        if (questionCount <= 10) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '⭐⭐' };
        return { label: 'Hard', color: 'bg-red-100 text-red-800 border-red-200', icon: '⭐⭐⭐' };
    };

    if (loading) {
        return <LoadingSpinner text="Loading quiz preview..." />;
    }

    if (error || !quiz) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
                <div className="text-center">
                    <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Quiz Not Found</h1>
                    <p className="text-gray-600 mb-6">The quiz you're looking for doesn't exist or is unavailable.</p>
                    <Link
                        href="/quizzes"
                        className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Browse All Quizzes
                    </Link>
                </div>
            </div>
        );
    }

    const difficulty = getDifficultyLevel(quiz.questions?.length || 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
            <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                {/* Navigation */}
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center text-purple-600 hover:text-purple-700 transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Back to Quizzes
                    </button>
                </div>

                {/* Quiz Header */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-12 text-white">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-4">
                                    <Award className="h-8 w-8" />
                                    <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${difficulty.color.replace('text-', 'text-').replace('bg-', 'bg-white text-')}`}>
                                        {difficulty.label} {difficulty.icon}
                                    </span>
                                </div>
                                <h1 className="text-3xl font-bold mb-4">{quiz.title}</h1>
                                <p className="text-lg opacity-90">
                                    {quiz.description || 'Test your knowledge with this comprehensive quiz.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="px-8 py-8">
                        {/* Quiz Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                                <Target className="h-8 w-8 text-purple-600 mr-3" />
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">{quiz.questions?.length || 0}</div>
                                    <div className="text-gray-600">Questions</div>
                                </div>
                            </div>
                            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                                <Clock className="h-8 w-8 text-blue-600 mr-3" />
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {quiz.time_limit ? `${quiz.time_limit} min` : 'No limit'}
                                    </div>
                                    <div className="text-gray-600">Time Limit</div>
                                </div>
                            </div>
                            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                                <Calendar className="h-8 w-8 text-green-600 mr-3" />
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {new Date(quiz.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="text-gray-600">Created</div>
                                </div>
                            </div>
                        </div>

                        {/* Sample Questions Preview */}
                        <div className="mb-8">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                <CheckCircle className="h-6 w-6 text-purple-600 mr-2" />
                                What You'll Learn
                            </h3>
                            <div className="bg-gray-50 rounded-lg p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-start">
                                        <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                        <div>
                                            <div className="font-medium text-gray-900">Interactive Questions</div>
                                            <div className="text-gray-600 text-sm">Multiple choice and various question types</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                        <div>
                                            <div className="font-medium text-gray-900">Instant Feedback</div>
                                            <div className="text-gray-600 text-sm">Get results and explanations immediately</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                        <div>
                                            <div className="font-medium text-gray-900">Progress Tracking</div>
                                            <div className="text-gray-600 text-sm">Monitor your learning progress</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                        <div>
                                            <div className="font-medium text-gray-900">Detailed Results</div>
                                            <div className="text-gray-600 text-sm">Comprehensive performance analysis</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Locked Content Notice */}
                        <div className="bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-xl p-6 mb-8">
                            <div className="flex items-center justify-center text-center">
                                <Lock className="h-12 w-12 text-purple-600 mr-4" />
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                        Sign in to take this quiz
                                    </h4>
                                    <p className="text-gray-600">
                                        Create an account or log in to access all quiz features and track your progress.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                href="/auth/login"
                                className="flex-1 bg-purple-600 text-white text-center px-6 py-4 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                            >
                                Sign In to Take Quiz
                            </Link>
                            <Link
                                href="/auth/register"
                                className="flex-1 border border-purple-600 text-purple-600 text-center px-6 py-4 rounded-lg hover:bg-purple-50 transition-colors font-semibold"
                            >
                                Create Account
                            </Link>
                        </div>

                        <div className="mt-6 text-center">
                            <Link
                                href="/quizzes"
                                className="text-purple-600 hover:text-purple-700 transition-colors"
                            >
                                Browse more quizzes
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Additional Information */}
                <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                        Why Take This Quiz?
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <div>
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Target className="h-8 w-8 text-purple-600" />
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">Test Knowledge</h4>
                            <p className="text-gray-600 text-sm">
                                Validate your understanding and identify areas for improvement.
                            </p>
                        </div>
                        <div>
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <User className="h-8 w-8 text-blue-600" />
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">Track Progress</h4>
                            <p className="text-gray-600 text-sm">
                                Monitor your learning journey and celebrate achievements.
                            </p>
                        </div>
                        <div>
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Award className="h-8 w-8 text-green-600" />
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">Earn Recognition</h4>
                            <p className="text-gray-600 text-sm">
                                Complete quizzes to build your learning portfolio.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}