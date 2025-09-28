'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/LoadingSpinner';
import { quizResultsAPI } from '@/lib/api';
import { ArrowLeft, CheckCircle, XCircle, Trophy, Clock, Target, Award } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResultDetails() {
    const params = useParams();
    const resultId = params.id;
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (resultId) {
            fetchResult();
        }
    }, [resultId]);

    const fetchResult = async () => {
        try {
            setLoading(true);
            const response = await quizResultsAPI.getResultById(resultId);
            console.log('Fetched result:', response);
            setResult(response.quiz_result || response.data?.quiz_result);
        } catch (error) {
            console.error('Error fetching result:', error);
            toast.error('Failed to load result details');
        } finally {
            setLoading(false);
        }
    };

    const getGradeColor = (percentage) => {
        if (percentage >= 90) return 'text-green-600 bg-green-100 border-green-200';
        if (percentage >= 80) return 'text-blue-600 bg-blue-100 border-blue-200';
        if (percentage >= 70) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
        if (percentage >= 60) return 'text-orange-600 bg-orange-100 border-orange-200';
        return 'text-red-600 bg-red-100 border-red-200';
    };

    const getGrade = (percentage) => {
        if (percentage >= 90) return 'A+';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B';
        if (percentage >= 60) return 'C';
        return 'F';
    };

    const getPerformanceMessage = (percentage) => {
        if (percentage >= 90) return { message: 'Excellent work! You have mastered this topic.', icon: Trophy, color: 'text-yellow-600' };
        if (percentage >= 80) return { message: 'Great job! You have a good understanding.', icon: Award, color: 'text-blue-600' };
        if (percentage >= 70) return { message: 'Good effort! Keep practicing to improve.', icon: Target, color: 'text-green-600' };
        if (percentage >= 60) return { message: 'You\'re on the right track. Review the material and try again.', icon: Clock, color: 'text-orange-600' };
        return { message: 'Keep studying! Focus on understanding the concepts better.', icon: Target, color: 'text-red-600' };
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <LoadingSpinner text="Loading result details..." />
            </ProtectedRoute>
        );
    }

    if (!result) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Result not found</h2>
                        <p className="text-gray-600 mb-4">The quiz result you're looking for doesn't exist.</p>
                        <Link
                            href="/student/results"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Results
                        </Link>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    const performance = getPerformanceMessage(result.percentage);
    const PerformanceIcon = performance.icon;

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <Link
                            href="/student/results"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Results
                        </Link>
                    </div>

                    {/* Result Overview */}
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
                        <div className="px-6 py-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{result.quiz_title}</h1>
                                    <p className="text-gray-600">Quiz completed on {new Date(result.completed_at).toLocaleDateString()}</p>
                                </div>
                                <div className={`px-6 py-3 rounded-lg border ${getGradeColor(result.percentage)}`}>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold">{getGrade(result.percentage)}</div>
                                        <div className="text-sm">{result.percentage}%</div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <div className="flex items-center">
                                        <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                                        <div>
                                            <p className="text-sm text-gray-500">Score</p>
                                            <p className="font-semibold">{result.score} / {result.total_points}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <div className="flex items-center">
                                        <Target className="h-6 w-6 text-blue-600 mr-2" />
                                        <div>
                                            <p className="text-sm text-gray-500">Correct Answers</p>
                                            <p className="font-semibold">
                                                {result.detailed_answers ?
                                                    result.detailed_answers.filter(answer => answer.is_correct).length : 0
                                                } / {result.detailed_answers?.length || 0}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <div className="flex items-center">
                                        <Clock className="h-6 w-6 text-purple-600 mr-2" />
                                        <div>
                                            <p className="text-sm text-gray-500">Completed At</p>
                                            <p className="font-semibold">{new Date(result.completed_at).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`mt-6 p-4 rounded-lg bg-white border-l-4 ${performance.color.replace('text-', 'border-')}`}>
                                <div className="flex items-center">
                                    <PerformanceIcon className={`h-6 w-6 ${performance.color} mr-3`} />
                                    <p className="text-gray-700">{performance.message}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Question Details */}
                    {result.detailed_answers && result.detailed_answers.length > 0 && (
                        <div className="bg-white rounded-lg shadow mb-6">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Question-by-Question Review</h2>
                            </div>

                            <div className="p-6 space-y-6">
                                {result.detailed_answers.map((answer, index) => (
                                    <div key={answer.question_id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <h3 className="text-sm font-medium text-black flex-1">
                                                Question {index + 1}: {answer.question_text}
                                            </h3>
                                            <div className="flex items-center ml-4">
                                                {answer.is_correct ? (
                                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                                ) : (
                                                    <XCircle className="h-5 w-5 text-red-600" />
                                                )}
                                                <span className="ml-2 text-black text-sm font-medium">
                                                    {answer.is_correct ? answer.points : 0} / {answer.points} pts
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className={`p-3 rounded-md ${answer.is_correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                                <p className="text-sm text-black">
                                                    <span className="font-medium text-black">Your answer: </span>
                                                    {answer.user_answer !== undefined ?
                                                        answer.options[answer.user_answer] || 'No answer selected' :
                                                        'No answer selected'
                                                    }
                                                </p>
                                            </div>

                                            {!answer.is_correct && (
                                                <div className="p-3 rounded-md bg-green-50 border border-green-200">
                                                    <p className="text-sm text-black">
                                                        <span className="font-medium text-black">Correct answer: </span>
                                                        {answer.options[answer.correct_answer]}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">What would you like to do next?</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Link
                                href={`/student/quizzes/${result.quiz_id}`}
                                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <Award className="h-6 w-6 text-blue-600 mr-3" />
                                <div>
                                    <h4 className="font-medium text-gray-900">Retake Quiz</h4>
                                    <p className="text-sm text-gray-600">Try to improve your score</p>
                                </div>
                            </Link>

                            <Link
                                href="/student/quizzes"
                                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <Trophy className="h-6 w-6 text-yellow-600 mr-3" />
                                <div>
                                    <h4 className="font-medium text-gray-900">More Quizzes</h4>
                                    <p className="text-sm text-gray-600">Practice with other quizzes</p>
                                </div>
                            </Link>

                            <Link
                                href="/student/lessons"
                                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <Target className="h-6 w-6 text-green-600 mr-3" />
                                <div>
                                    <h4 className="font-medium text-gray-900">Study Materials</h4>
                                    <p className="text-sm text-gray-600">Review lessons to improve</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}