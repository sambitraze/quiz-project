'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/LoadingSpinner';
import { lessonsAPI, quizzesAPI, quizResultsAPI } from '@/lib/api';
import { BookOpen, Award, TrendingUp, Clock, Play, Trophy, Star, Target, CheckCircle, AlertCircle } from 'lucide-react';

export default function StudentDashboard() {
    const [lessons, setLessons] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [stats, setStats] = useState(null);
    const [recentResults, setRecentResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [lessonsResponse, quizzesResponse, statsResponse] = await Promise.all([
                lessonsAPI.getAllLessons(1, 6),
                quizzesAPI.getAllQuizzes(1, 6),
                quizResultsAPI.getMyResults(1, 50) // Get more results for better stats
            ]);

            console.log('Dashboard responses:', { lessonsResponse, quizzesResponse, statsResponse });

            // Handle lessons API response structure
            const lessonsData = lessonsResponse.lessons || lessonsResponse.data?.lessons || [];
            setLessons(lessonsData);

            // Handle quizzes API response structure  
            const quizzesData = quizzesResponse.quizzes || quizzesResponse.data?.quizzes || [];
            setQuizzes(quizzesData);

            // Handle quiz results API response structure
            const resultsData = statsResponse.quiz_results || statsResponse.data?.quiz_results || [];

            if (resultsData.length > 0) {
                // Calculate statistics from results
                const totalQuizzes = resultsData.length;
                const percentages = resultsData.map(result => result.percentage);
                const averagePercentage = percentages.reduce((sum, p) => sum + p, 0) / totalQuizzes;
                const highestPercentage = Math.max(...percentages);

                setStats({
                    total_quizzes_taken: totalQuizzes,
                    average_percentage: averagePercentage,
                    highest_percentage: highestPercentage
                });

                // Set recent results (most recent 5)
                const sortedResults = resultsData
                    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
                    .slice(0, 5);
                setRecentResults(sortedResults);
            } else {
                setStats({
                    total_quizzes_taken: 0,
                    average_percentage: 0,
                    highest_percentage: 0
                });
                setRecentResults([]);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setStats({
                total_quizzes_taken: 0,
                average_percentage: 0,
                highest_percentage: 0
            });
            setRecentResults([]);
        } finally {
            setLoading(false);
        }
    };

    const getGradeColor = (percentage) => {
        if (percentage >= 90) return 'text-green-600 bg-green-100';
        if (percentage >= 80) return 'text-blue-600 bg-blue-100';
        if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
        if (percentage >= 60) return 'text-orange-600 bg-orange-100';
        return 'text-red-600 bg-red-100';
    };

    const getPerformanceIcon = (percentage) => {
        if (percentage >= 90) return <Trophy className="h-5 w-5 text-yellow-500" />;
        if (percentage >= 80) return <Star className="h-5 w-5 text-blue-500" />;
        if (percentage >= 70) return <Target className="h-5 w-5 text-green-500" />;
        if (percentage >= 60) return <CheckCircle className="h-5 w-5 text-orange-500" />;
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <LoadingSpinner text="Loading your dashboard..." />
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Welcome to Your Dashboard</h1>
                        <p className="mt-2 text-gray-600">Track your learning progress and continue your journey</p>
                    </div>

                    {/* Stats Overview */}
                    {stats && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <BookOpen className="h-8 w-8 text-blue-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Quizzes Taken</p>
                                        <p className="text-2xl font-semibold text-gray-900">{stats.total_quizzes_taken || 0}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <Award className="h-8 w-8 text-green-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Average Score</p>
                                        <p className="text-2xl font-semibold text-gray-900">
                                            {stats.average_percentage ? `${Math.round(stats.average_percentage)}%` : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <Trophy className="h-8 w-8 text-yellow-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Best Score</p>
                                        <p className="text-2xl font-semibold text-gray-900">
                                            {stats.highest_percentage ? `${Math.round(stats.highest_percentage)}%` : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <TrendingUp className="h-8 w-8 text-purple-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Progress</p>
                                        <p className="text-2xl font-semibold text-gray-900">
                                            {stats.total_quizzes_taken ? `${Math.min(100, stats.total_quizzes_taken * 10)}%` : '0%'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Available Lessons */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-lg shadow-md">
                                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                    <h2 className="text-lg font-semibold text-gray-900">Available Lessons</h2>
                                    <Link
                                        href="/student/lessons"
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                        View All
                                    </Link>
                                </div>

                                {lessons.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">No lessons available yet</p>
                                    </div>
                                ) : (
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {lessons.map(lesson => (
                                                <div key={lesson.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h3 className="font-medium text-gray-900 text-sm">{lesson.title}</h3>
                                                        {lesson.level && (
                                                            <span className={`text-xs px-2 py-1 rounded-full ${lesson.level === 'beginner' ? 'bg-green-100 text-green-800' :
                                                                lesson.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-red-100 text-red-800'
                                                                }`}>
                                                                {lesson.level}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-600 text-xs mb-3 line-clamp-2">{lesson.description}</p>
                                                    <Link
                                                        href={`/student/lessons/${lesson.id}`}
                                                        className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                    >
                                                        <Play className="h-4 w-4 mr-1" />
                                                        Start Learning
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Available Quizzes */}
                            <div className="bg-white rounded-lg shadow-md mt-6">
                                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                    <h2 className="text-lg font-semibold text-gray-900">Practice Quizzes</h2>
                                    <Link
                                        href="/student/quizzes"
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                        View All
                                    </Link>
                                </div>

                                {quizzes.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">No quizzes available yet</p>
                                    </div>
                                ) : (
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {quizzes.map(quiz => (
                                                <div key={quiz.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h3 className="font-medium text-gray-900 text-sm">{quiz.title}</h3>
                                                        <div className="flex items-center text-xs text-gray-500">
                                                            <Clock className="h-3 w-3 mr-1" />
                                                            {quiz.time_limit ? `${quiz.time_limit}m` : 'No limit'}
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-600 text-xs mb-2">{quiz.description}</p>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-gray-500">
                                                            {quiz.questions?.length || quiz.question_count || 0} questions
                                                        </span>
                                                        <Link
                                                            href={`/student/quizzes/${quiz.id}`}
                                                            className="inline-flex items-center bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700"
                                                        >
                                                            Take Quiz
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Results Sidebar */}
                        <div className="space-y-6">
                            {/* Recent Quiz Results */}
                            <div className="bg-white rounded-lg shadow-md">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-900">Recent Results</h2>
                                </div>

                                {recentResults.length === 0 ? (
                                    <div className="p-6 text-center">
                                        <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-500 text-sm">No quiz results yet</p>
                                        <p className="text-gray-400 text-xs mt-1">Take a quiz to see your progress!</p>
                                    </div>
                                ) : (
                                    <div className="p-6 space-y-4">
                                        {recentResults.map(result => (
                                            <div key={result.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    {getPerformanceIcon(result.percentage)}
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{result.quiz_title}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(result.completed_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`text-sm font-semibold px-2 py-1 rounded ${getGradeColor(result.percentage)}`}>
                                                        {result.percentage}%
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-white rounded-lg shadow-md">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                                </div>
                                <div className="p-6 space-y-3">
                                    <Link
                                        href="/student/lessons"
                                        className="flex items-center w-full p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                    >
                                        <BookOpen className="h-5 w-5 text-blue-600 mr-3" />
                                        <span className="text-sm font-medium text-blue-900">Browse Lessons</span>
                                    </Link>
                                    <Link
                                        href="/student/quizzes"
                                        className="flex items-center w-full p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                                    >
                                        <Award className="h-5 w-5 text-green-600 mr-3" />
                                        <span className="text-sm font-medium text-green-900">Take a Quiz</span>
                                    </Link>
                                    <Link
                                        href="/student/results"
                                        className="flex items-center w-full p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                                    >
                                        <TrendingUp className="h-5 w-5 text-purple-600 mr-3" />
                                        <span className="text-sm font-medium text-purple-900">View Progress</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}