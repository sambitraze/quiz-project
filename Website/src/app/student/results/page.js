'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/LoadingSpinner';
import { quizResultsAPI } from '@/lib/api';
import { TrendingUp, Trophy, Award, Clock, Eye, BarChart3, Target, Star } from 'lucide-react';

export default function StudentResults() {
    const [results, setResults] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

    useEffect(() => {
        fetchResults();
    }, [pagination.page]);

    useEffect(() => {
        // Fetch all results for accurate statistics on first load
        if (pagination.page === 1) {
            fetchAllResultsForStats();
        }
    }, []);

    const fetchAllResultsForStats = async () => {
        try {
            // Fetch all results to calculate accurate statistics
            const allResultsResponse = await quizResultsAPI.getMyResults(1, 1000); // Get all results
            const allResults = allResultsResponse.quiz_results || allResultsResponse.data?.quiz_results || [];

            if (allResults.length > 0) {
                const totalQuizzes = allResults.length;
                const percentages = allResults.map(result => result.percentage);
                const averagePercentage = percentages.reduce((sum, p) => sum + p, 0) / totalQuizzes;
                const highestPercentage = Math.max(...percentages);

                setStats({
                    total_quizzes_taken: totalQuizzes,
                    average_percentage: averagePercentage,
                    highest_percentage: highestPercentage
                });
            } else {
                setStats({
                    total_quizzes_taken: 0,
                    average_percentage: 0,
                    highest_percentage: 0
                });
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
            setStats({
                total_quizzes_taken: 0,
                average_percentage: 0,
                highest_percentage: 0
            });
        }
    };

    const fetchResults = async () => {
        try {
            setLoading(true);
            const response = await quizResultsAPI.getMyResults(pagination.page, pagination.limit);
            console.log('Fetched results:', response);

            // Handle the actual API response structure
            const resultsData = response.quiz_results || response.data?.quiz_results || [];
            const paginationData = response.pagination || response.data?.pagination || {};

            setResults(resultsData);
            setPagination(prev => ({ ...prev, ...paginationData }));

        } catch (error) {
            console.error('Error fetching results:', error);
            setResults([]);
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

    const getGrade = (percentage) => {
        if (percentage >= 90) return 'A+';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B';
        if (percentage >= 60) return 'C';
        return 'F';
    };

    const getPerformanceIcon = (percentage) => {
        if (percentage >= 90) return <Trophy className="h-5 w-5 text-yellow-500" />;
        if (percentage >= 80) return <Star className="h-5 w-5 text-blue-500" />;
        if (percentage >= 70) return <Target className="h-5 w-5 text-green-500" />;
        return <Award className="h-5 w-5 text-gray-500" />;
    };

    if (loading && results.length === 0) {
        return (
            <ProtectedRoute>
                <LoadingSpinner text="Loading your results..." />
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
                                <h1 className="text-3xl font-bold text-gray-900">Your Quiz Results</h1>
                                <p className="mt-2 text-gray-600">Track your progress and performance</p>
                            </div>
                            <Link
                                href="/student"
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Back to Dashboard
                            </Link>
                        </div>
                    </div>

                    {/* Statistics Overview */}
                    {stats && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <BarChart3 className="h-8 w-8 text-blue-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Quizzes Taken</p>
                                        <p className="text-2xl font-semibold text-gray-900">{stats.total_quizzes_taken || 0}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <TrendingUp className="h-8 w-8 text-green-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Average Score</p>
                                        <p className="text-2xl font-semibold text-gray-900">
                                            {stats.average_percentage ? `${Math.round(stats.average_percentage)}%` : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
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

                            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <Award className="h-8 w-8 text-purple-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Average Grade</p>
                                        <p className="text-2xl font-semibold text-gray-900">
                                            {stats.average_percentage ? getGrade(stats.average_percentage) : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Results Table */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Quiz History</h2>
                        </div>

                        {loading ? (
                            <div className="p-8">
                                <LoadingSpinner size="small" text="Loading results..." />
                            </div>
                        ) : results.length === 0 ? (
                            <div className="p-8 text-center">
                                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No quiz results yet</h3>
                                <p className="text-gray-500 mb-4">Take your first quiz to see your results here!</p>
                                <Link
                                    href="/student/quizzes"
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Browse Quizzes
                                </Link>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Quiz
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Score
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Grade
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Performance
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Completed
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {results.map((result) => (
                                            <tr key={result.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{result.quiz_title}</div>
                                                        <div className="text-sm text-gray-500">
                                                            {result.total_questions} questions • {result.total_points} points
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {result.score} / {result.total_points}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {result.percentage}%
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(result.percentage)}`}>
                                                        {getGrade(result.percentage)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {getPerformanceIcon(result.percentage)}
                                                        <span className="ml-2 text-sm text-gray-600">
                                                            {result.percentage >= 90 ? 'Excellent' :
                                                                result.percentage >= 80 ? 'Good' :
                                                                    result.percentage >= 70 ? 'Average' :
                                                                        result.percentage >= 60 ? 'Below Average' : 'Poor'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="flex items-center">
                                                        <Clock className="h-4 w-4 mr-1" />
                                                        <div>
                                                            <div>{new Date(result.completed_at).toLocaleDateString()}</div>
                                                            <div className="text-xs">{new Date(result.completed_at).toLocaleTimeString()}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <Link
                                                        href={`/student/results/${result.id}`}
                                                        className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                                                    >
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        View Details
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing page {pagination.page} of {pagination.pages} ({pagination.total} total results)
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                        disabled={pagination.page === 1}
                                        className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
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

                    {/* Quick Actions */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Link
                            href="/student/quizzes"
                            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center">
                                <Award className="h-8 w-8 text-blue-600 mr-4" />
                                <div>
                                    <h3 className="font-semibold text-gray-900">Take Another Quiz</h3>
                                    <p className="text-sm text-gray-600">Continue practicing and improving</p>
                                </div>
                            </div>
                        </Link>

                        <Link
                            href="/student/lessons"
                            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center">
                                <TrendingUp className="h-8 w-8 text-green-600 mr-4" />
                                <div>
                                    <h3 className="font-semibold text-gray-900">Study Lessons</h3>
                                    <p className="text-sm text-gray-600">Review materials to improve</p>
                                </div>
                            </div>
                        </Link>

                        <Link
                            href="/student"
                            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center">
                                <BarChart3 className="h-8 w-8 text-purple-600 mr-4" />
                                <div>
                                    <h3 className="font-semibold text-gray-900">Dashboard</h3>
                                    <p className="text-sm text-gray-600">View your overall progress</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}