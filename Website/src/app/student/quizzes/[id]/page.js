'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/LoadingSpinner';
import { quizzesAPI, quizResultsAPI } from '@/lib/api';
import { Clock, ArrowLeft, ArrowRight, CheckCircle, Award, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TakeQuiz() {
    const params = useParams();
    const router = useRouter();
    const quizId = params.id;

    const [quiz, setQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [quizStarted, setQuizStarted] = useState(false);

    useEffect(() => {
        if (quizId) {
            fetchQuiz();
        }
    }, [quizId]);

    useEffect(() => {
        let timer;
        if (quizStarted && timeRemaining > 0) {
            timer = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        submitQuiz();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [quizStarted, timeRemaining]);

    const fetchQuiz = async () => {
        try {
            setLoading(true);
            const response = await quizzesAPI.getQuizById(quizId);
            console.log('Student quiz API response:', response);
            setQuiz(response.data.quiz || response);
            setQuestions(response.data.quiz?.questions || []);
            const quizData = response.quiz || response;
            if (quizData.time_limit) {
                setTimeRemaining(quizData.time_limit * 60); // Convert minutes to seconds
            }
        } catch (error) {
            console.error('Error fetching quiz:', error);
            toast.error('Failed to load quiz');
        } finally {
            setLoading(false);
        }
    };

    const startQuiz = () => {
        setQuizStarted(true);
        toast.success('Quiz started! Good luck!');
    };

    const handleAnswerSelect = (questionId, optionId) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionId
        }));
    };

    const goToQuestion = (index) => {
        if (index >= 0 && index < questions.length) {
            setCurrentQuestion(index);
        }
    };

    const submitQuiz = async () => {
        if (submitting) return;

        setSubmitting(true);
        try {
            // Prepare answers in the format expected by the API
            const formattedAnswers = Object.entries(answers)
                .filter(([questionId, selectedOptionId]) => selectedOptionId !== undefined && selectedOptionId !== null)
                .map(([questionId, selectedOptionId]) => {
                    const parsedQuestionId = parseInt(questionId);
                    const parsedSelectedAnswer = parseInt(selectedOptionId);

                    if (isNaN(parsedQuestionId) || isNaN(parsedSelectedAnswer)) {
                        console.error('Invalid data:', { questionId, selectedOptionId });
                        return null;
                    }

                    return {
                        question_id: parsedQuestionId,
                        selected_answer: parsedSelectedAnswer
                    };
                })
                .filter(answer => answer !== null);

            const quizData = {
                quiz_id: parseInt(quizId),
                answers: formattedAnswers
            };

            console.log('Quiz submission data:', quizData);

            const response = await quizResultsAPI.submitQuiz(quizData);

            toast.success('Quiz submitted successfully!');
            // The API returns response.data.quiz_result.id
            const resultId = response.quiz_result?.id || response.data?.quiz_result?.id;
            router.push(`/student/results/${resultId}`);
        } catch (error) {
            console.error('Error submitting quiz:', error);
            toast.error('Failed to submit quiz. Please try again.');
            setSubmitting(false);
        }
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const getTimeColor = () => {
        if (!timeRemaining || !quiz?.time_limit) return 'text-gray-600';
        const percentage = (timeRemaining / (quiz.time_limit * 60)) * 100;
        if (percentage > 50) return 'text-green-600';
        if (percentage > 20) return 'text-yellow-600';
        return 'text-red-600';
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <LoadingSpinner text="Loading quiz..." />
            </ProtectedRoute>
        );
    }

    if (!quiz) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Quiz not found</h2>
                        <p className="text-gray-600 mb-4">The quiz you're looking for doesn't exist or has been removed.</p>
                        <Link
                            href="/student/quizzes"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Quizzes
                        </Link>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    if (!quizStarted) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gray-50">
                    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                        <div className="bg-white rounded-lg shadow-lg p-8">
                            <div className="text-center mb-8">
                                <Award className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
                                <p className="text-gray-600">{quiz.description}</p>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                    <span className="text-gray-600">Number of Questions:</span>
                                    <span className="font-semibold text-gray-900">{questions.length}</span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                    <span className="text-gray-600">Time Limit:</span>
                                    <span className="font-semibold text-gray-900 flex items-center">
                                        <Clock className="h-4 w-4 mr-1" />
                                        {quiz.time_limit ? `${quiz.time_limit} minutes` : 'No time limit'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                    <span className="text-gray-600">Total Points:</span>
                                    <span className="font-semibold text-gray-900">{quiz.total_points || questions.length}</span>
                                </div>
                            </div>

                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
                                <div className="flex">
                                    <AlertCircle className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
                                    <div>
                                        <h3 className="text-sm font-medium text-yellow-800">Instructions</h3>
                                        <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside space-y-1">
                                            <li>Read each question carefully before selecting your answer</li>
                                            <li>You can navigate between questions using the navigation buttons</li>
                                            <li>Make sure to answer all questions before submitting</li>
                                            {quiz.time_limit && <li>Keep an eye on the timer - the quiz will auto-submit when time runs out</li>}
                                            <li>Once submitted, you cannot change your answers</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="flex space-x-4">
                                <Link
                                    href="/student/quizzes"
                                    className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Cancel
                                </Link>
                                <button
                                    onClick={startQuiz}
                                    className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Start Quiz
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    const currentQ = questions[currentQuestion];
    const answeredCount = Object.keys(answers).length;
    const progress = (answeredCount / questions.length) * 100;

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    {/* Header with Timer and Progress */}
                    <div className="bg-white rounded-lg shadow mb-6 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-xl font-bold text-gray-900">{quiz.title}</h1>
                            {timeRemaining !== null && (
                                <div className={`flex items-center font-mono text-lg ${getTimeColor()}`}>
                                    <Clock className="h-5 w-5 mr-2" />
                                    {formatTime(timeRemaining)}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                            <span>Question {currentQuestion + 1} of {questions.length}</span>
                            <span>{answeredCount} answered</span>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {currentQ && (
                        <div className="bg-white rounded-lg shadow p-6 mb-6">
                            <div className="mb-6">
                                <div className="flex items-start justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-gray-900 flex-1">
                                        {currentQ.question_text}
                                    </h2>
                                    <span className="text-sm text-gray-500 ml-4">
                                        {currentQ.points || 1} point{(currentQ.points || 1) !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {currentQ.options?.map((option, index) => (
                                        <label
                                            key={index}
                                            className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${answers[currentQ.id] === index
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name={`question-${currentQ.id}`}
                                                value={index}
                                                checked={answers[currentQ.id] === index}
                                                onChange={() => handleAnswerSelect(currentQ.id, index)}
                                                className="mr-3 text-blue-600"
                                            />
                                            <span className="text-gray-900">{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={() => goToQuestion(currentQuestion - 1)}
                            disabled={currentQuestion === 0}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Previous
                        </button>

                        <div className="flex space-x-2">
                            {questions.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToQuestion(index)}
                                    className={`w-10 h-10 rounded-full text-sm font-medium ${index === currentQuestion
                                        ? 'bg-blue-600 text-white'
                                        : answers[questions[index]?.id]
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-200 text-gray-700'
                                        }`}
                                >
                                    {index + 1}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => goToQuestion(currentQuestion + 1)}
                            disabled={currentQuestion === questions.length - 1}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </button>
                    </div>

                    {/* Submit Button */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">
                                    {answeredCount} of {questions.length} questions answered
                                </p>
                                {answeredCount < questions.length && (
                                    <p className="text-sm text-yellow-600 mt-1">
                                        You still have unanswered questions
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={submitQuiz}
                                disabled={submitting}
                                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Submit Quiz
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}