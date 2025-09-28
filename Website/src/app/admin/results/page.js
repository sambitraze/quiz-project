'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/LoadingSpinner';
import { quizResultsAPI, quizzesAPI } from '@/lib/api';
import { BarChart3, Search, Eye, Trash2, Trophy, Users, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResultsManagement() {
    const [quizzes, setQuizzes] = useState([]);
    const [selectedQuiz, setSelectedQuiz] = useState('');
    const [results, setResults] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

    useEffect(() => {
        fetchQuizzes();
    }, []);

    useEffect(() => {
        if (selectedQuiz) {
            fetchResults();
        }
    }, [selectedQuiz, pagination.page]);

    const fetchQuizzes = async () => {
        try {
            const response = await quizzesAPI.getAllQuizzes(1, 100);
            setQuizzes(response.data.quizzes);
            if (response.data.quizzes.length > 0) {
                setSelectedQuiz(response.data.quizzes[0].id);
            }
        } catch (error) {
            console.error('Error fetching quizzes:', error);
            toast.error('Failed to fetch quizzes');
        } finally {
            setLoading(false);
        }
    };

    const fetchResults = async () => {
        if (!selectedQuiz) return;

        try {
            setLoading(true);
            const response = await quizResultsAPI.getQuizResults(selectedQuiz, pagination.page, pagination.limit);
            setResults(response.data.quiz_results);
            setStats(response.data.statistics);
            setPagination(prev => ({ ...prev, ...response.data.pagination }));
        } catch (error) {
            console.error('Error fetching results:', error);
            toast.error('Failed to fetch results');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteResult = async (resultId) => {
        if (window.confirm('Are you sure you want to delete this quiz result?')) {
            try {
                await quizResultsAPI.deleteResult(resultId);
                toast.success('Result deleted successfully');
                fetchResults();
            } catch (error) {
                console.error('Error deleting result:', error);
                toast.error('Failed to delete result');
            }
        }
    };

    const viewDetailedResult = async (resultId) => {
        try {
            const response = await quizResultsAPI.getResultById(resultId);
            // For now, just log the detailed result. In a real app, you'd show a modal
            console.log('Detailed result:', response.data);
            toast.success('Check console for detailed results');
        } catch (error) {
            console.error('Error fetching detailed result:', error);
            toast.error('Failed to fetch detailed result');
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

    if (loading && quizzes.length === 0) {
        return (
            <ProtectedRoute adminOnly>
                <LoadingSpinner text="Loading quiz results..." />
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute adminOnly>
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Quiz Results Management</h1>
                        <p className="mt-2 text-gray-600">View and manage quiz results and performance</p>
                    </div>

                    {/* Quiz Selector */}
                    <div className="bg-white rounded-lg shadow mb-6">
                        <div className="p-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Quiz to View Results
                            </label>
                            <select
                                value={selectedQuiz}
                                onChange={(e) => {
                                    setSelectedQuiz(e.target.value);
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                                className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                {quizzes.map(quiz => (
                                    <option key={quiz.id} value={quiz.id}>
                                        {quiz.title} ({quiz.question_count} questions)
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {selectedQuiz && (
                        <>
                            {/* Statistics */}
                            {stats && (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                    <div className="bg-white rounded-lg shadow p-6">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <Users className="h-8 w-8 text-blue-600" />
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-500">Total Attempts</p>
                                                <p className="text-2xl font-semibold text-gray-900">{stats.total_attempts}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-lg shadow p-6">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <BarChart3 className="h-8 w-8 text-green-600" />
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-500">Average Score</p>
                                                <p className="text-2xl font-semibold text-gray-900">{stats.average_percentage}%</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-lg shadow p-6">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <Trophy className="h-8 w-8 text-yellow-600" />
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-500">Highest Score</p>
                                                <p className="text-2xl font-semibold text-gray-900">{stats.highest_percentage}%</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-lg shadow p-6">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <Clock className="h-8 w-8 text-red-600" />
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-500">Lowest Score</p>
                                                <p className="text-2xl font-semibold text-gray-900">{stats.lowest_percentage}%</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Results Table */}
                            <div className="bg-white rounded-lg shadow">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-900">Quiz Results</h2>
                                </div>

                                {loading ? (
                                    <div className="p-8">
                                        <LoadingSpinner size="small" text="Loading results..." />
                                    </div>
                                ) : results.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">No results found for this quiz</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Rank
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Student
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Score
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Grade
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Completed At
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
                                                            <div className="flex items-center">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${result.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                                                                        result.rank === 2 ? 'bg-gray-100 text-gray-800' :
                                                                            result.rank === 3 ? 'bg-orange-100 text-orange-800' :
                                                                                'bg-blue-100 text-blue-800'
                                                                    }`}>
                                                                    {result.rank}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">{result.username}</div>
                                                                <div className="text-sm text-gray-500">{result.email}</div>
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
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {new Date(result.completed_at).toLocaleDateString()} at{' '}
                                                            {new Date(result.completed_at).toLocaleTimeString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <div className="flex justify-end space-x-2">
                                                                <button
                                                                    onClick={() => viewDetailedResult(result.id)}
                                                                    className="text-blue-600 hover:text-blue-900"
                                                                    title="View Details"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteResult(result.id)}
                                                                    className="text-red-600 hover:text-red-900"
                                                                    title="Delete Result"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
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
                        </>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}