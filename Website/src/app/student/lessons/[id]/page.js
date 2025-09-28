'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/LoadingSpinner';
import { lessonsAPI } from '@/lib/api';
import { BookOpen, ArrowLeft, Clock, User, Star, Tag, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import VideoPlayer from '@/components/VideoPlayer';

export default function LessonView() {
    const params = useParams();
    const lessonId = params.id;
    const [lesson, setLesson] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (lessonId) {
            fetchLesson();
        }
    }, [lessonId]);

    const fetchLesson = async () => {
        try {
            setLoading(true);
            const response = await lessonsAPI.getLessonById(lessonId);
            setLesson(response.data.lesson);
        } catch (error) {
            console.error('Error fetching lesson:', error);
            toast.error('Failed to load lesson');
        } finally {
            setLoading(false);
        }
    };

    const getLevelColor = (level) => {
        switch (level) {
            case 'beginner': return 'bg-green-100 text-green-800';
            case 'intermediate': return 'bg-yellow-100 text-yellow-800';
            case 'advanced': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getDifficultyStars = (level) => {
        const stars = level === 'beginner' ? 1 : level === 'intermediate' ? 2 : 3;
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                className={`h-4 w-4 ${i < stars ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            />
        ));
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <LoadingSpinner text="Loading lesson..." />
            </ProtectedRoute>
        );
    }

    if (!lesson) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Lesson not found</h2>
                        <p className="text-gray-600 mb-4">The lesson you're looking for doesn't exist or has been removed.</p>
                        <Link
                            href="/student/lessons"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Lessons
                        </Link>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <Link
                            href="/student/lessons"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Lessons
                        </Link>
                    </div>

                    {/* Lesson Content */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        {/* Lesson Header */}
                        <div className="px-6 py-8 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h1 className="text-3xl font-bold text-gray-900 mb-4">{lesson.title}</h1>
                                    <div className="flex items-center space-x-4 mb-4">
                                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getLevelColor(lesson.level)}`}>
                                            {lesson.level}
                                        </span>
                                        <div className="flex items-center">
                                            {getDifficultyStars(lesson.level)}
                                            <span className="ml-2 text-sm text-gray-600">Difficulty</span>
                                        </div>
                                    </div>
                                </div>
                                <BookOpen className="h-12 w-12 text-blue-600 flex-shrink-0" />
                            </div>

                            <p className="text-lg text-gray-700 mb-6">{lesson.description}</p>

                            {/* Lesson Meta */}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center">
                                    <User className="h-4 w-4 mr-2" />
                                    <span>By {lesson.author_name || 'Instructor'}</span>
                                </div>
                                <div className="flex items-center">
                                    <Clock className="h-4 w-4 mr-2" />
                                    <span>Created {new Date(lesson.created_at).toLocaleDateString()}</span>
                                </div>
                                {lesson.updated_at !== lesson.created_at && (
                                    <div className="flex items-center">
                                        <Tag className="h-4 w-4 mr-2" />
                                        <span>Updated {new Date(lesson.updated_at).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Video Player */}
                        {lesson.video_url && (
                            <div className="px-6 py-6 bg-gray-50 border-b border-gray-200">
                                <div className="flex items-center mb-4">
                                    <Play className="h-6 w-6 text-blue-600 mr-2" />
                                    <h2 className="text-xl font-semibold text-gray-900">Lesson Video</h2>
                                </div>
                                <VideoPlayer videoUrl={lesson.video_url} title={lesson.title} />
                            </div>
                        )}

                        {/* Lesson Content */}
                        <div className="px-6 py-8">
                            <div className="prose prose-lg max-w-none">
                                {lesson.content ? (
                                    <div
                                        className='text-black'
                                        dangerouslySetInnerHTML={{
                                            __html: lesson.content.replace(/\n/g, '<br/>')
                                        }}
                                    />
                                ) : (
                                    <p className="text-gray-500 italic">No content available for this lesson.</p>
                                )}
                            </div>
                        </div>

                        {/* Lesson Footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    Last updated: {new Date(lesson.updated_at).toLocaleDateString()}
                                </div>
                                <div className="flex space-x-3">
                                    <Link
                                        href="/student/lessons"
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                                    >
                                        Back to Lessons
                                    </Link>
                                    <Link
                                        href="/student/quizzes"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    >
                                        Take a Quiz
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Related Actions */}
                    <div className="mt-8 bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Link
                                href="/student/lessons"
                                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <BookOpen className="h-6 w-6 text-blue-600 mr-3" />
                                <div>
                                    <h4 className="font-medium text-gray-900">More Lessons</h4>
                                    <p className="text-sm text-gray-600">Continue learning with other lessons</p>
                                </div>
                            </Link>
                            <Link
                                href="/student/quizzes"
                                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <Star className="h-6 w-6 text-yellow-600 mr-3" />
                                <div>
                                    <h4 className="font-medium text-gray-900">Practice Quiz</h4>
                                    <p className="text-sm text-gray-600">Test your knowledge</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}