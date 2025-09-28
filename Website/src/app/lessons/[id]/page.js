'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import VideoPlayer from '@/components/VideoPlayer';
import { lessonsAPI } from '@/lib/api';
import { BookOpen, ArrowLeft, Lock, User, Calendar, Play, Star, ArrowRight } from 'lucide-react';

export default function PublicLessonView() {
    const params = useParams();
    const router = useRouter();
    const lessonId = params.id;

    const [lesson, setLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (lessonId) {
            fetchLesson();
        }
    }, [lessonId]);

    const fetchLesson = async () => {
        try {
            setLoading(true);
            const response = await lessonsAPI.getLessonById(lessonId);
            setLesson(response.lesson || response.data?.lesson);
        } catch (error) {
            console.error('Error fetching lesson:', error);
            setError('Lesson not found or unavailable');
        } finally {
            setLoading(false);
        }
    };

    const getLevelColor = (level) => {
        switch (level) {
            case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
            case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
        return <LoadingSpinner text="Loading lesson preview..." />;
    }

    if (error || !lesson) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Lesson Not Found</h1>
                    <p className="text-gray-600 mb-6">The lesson you're looking for doesn't exist or is unavailable.</p>
                    <Link
                        href="/lessons"
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Browse All Lessons
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                {/* Navigation */}
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Back to Lessons
                    </button>
                </div>

                {/* Lesson Header */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12 text-white">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-4">
                                    <BookOpen className="h-8 w-8" />
                                    <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${getLevelColor(lesson.level).replace('text-', 'text-').replace('bg-', 'bg-white text-')}`}>
                                        {lesson.level || 'beginner'}
                                    </span>
                                </div>
                                <h1 className="text-3xl font-bold mb-4">{lesson.title}</h1>
                                <p className="text-lg opacity-90">
                                    {lesson.description || 'Learn essential concepts and practical skills through this comprehensive lesson.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="px-8 py-8">
                        {/* Lesson Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                                <Star className="h-8 w-8 text-yellow-500 mr-3" />
                                <div>
                                    <div className="flex items-center mb-1">
                                        {getDifficultyStars(lesson.level)}
                                    </div>
                                    <div className="text-gray-600 text-sm">Difficulty Level</div>
                                </div>
                            </div>
                            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                                <User className="h-8 w-8 text-blue-600 mr-3" />
                                <div>
                                    <div className="text-lg font-semibold text-gray-900">Instructor</div>
                                    <div className="text-gray-600 text-sm">Expert-led content</div>
                                </div>
                            </div>
                            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                                <Calendar className="h-8 w-8 text-green-600 mr-3" />
                                <div>
                                    <div className="text-lg font-semibold text-gray-900">
                                        {new Date(lesson.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="text-gray-600 text-sm">Published</div>
                                </div>
                            </div>
                        </div>

                        {/* Video Preview (if available) */}
                        {lesson.video_url && (
                            <div className="mb-8">
                                <div className="flex items-center mb-4">
                                    <Play className="h-6 w-6 text-blue-600 mr-2" />
                                    <h3 className="text-xl font-semibold text-gray-900">Lesson Preview</h3>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <VideoPlayer videoUrl={lesson.video_url} title={lesson.title} />
                                </div>
                            </div>
                        )}

                        {/* Content Preview */}
                        <div className="mb-8">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Lesson Overview</h3>
                            <div className="bg-gray-50 rounded-lg p-6">
                                <div className="prose prose-lg max-w-none text-gray-700">
                                    {lesson.content ? (
                                        <div dangerouslySetInnerHTML={{
                                            __html: lesson.content.split('\n\n')[0].replace(/\n/g, '<br/>') + '...'
                                        }} />
                                    ) : (
                                        <p>This comprehensive lesson covers essential concepts with practical examples and hands-on exercises.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Learning Outcomes */}
                        <div className="mb-8">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">What You'll Learn</h3>
                            <div className="bg-gray-50 rounded-lg p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-start">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                        <div>
                                            <div className="font-medium text-gray-900">Core Concepts</div>
                                            <div className="text-gray-600 text-sm">Master fundamental principles and theory</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                        <div>
                                            <div className="font-medium text-gray-900">Practical Skills</div>
                                            <div className="text-gray-600 text-sm">Apply knowledge through hands-on exercises</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                        <div>
                                            <div className="font-medium text-gray-900">Real Examples</div>
                                            <div className="text-gray-600 text-sm">See concepts in action with real scenarios</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                        <div>
                                            <div className="font-medium text-gray-900">Best Practices</div>
                                            <div className="text-gray-600 text-sm">Learn industry standards and recommendations</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Access Notice */}
                        <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 rounded-xl p-6 mb-8">
                            <div className="flex items-center justify-center text-center">
                                <Lock className="h-12 w-12 text-blue-600 mr-4" />
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                        Sign in to access full lesson content
                                    </h4>
                                    <p className="text-gray-600">
                                        Get complete access to all lessons, quizzes, and track your learning progress.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                href="/auth/login"
                                className="flex-1 bg-blue-600 text-white text-center px-6 py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                            >
                                Sign In to Continue Learning
                            </Link>
                            <Link
                                href="/auth/register"
                                className="flex-1 border border-blue-600 text-blue-600 text-center px-6 py-4 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
                            >
                                Create Account
                            </Link>
                        </div>

                        <div className="mt-6 text-center">
                            <Link
                                href="/lessons"
                                className="text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                Browse more lessons
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Call to Action */}
                <div className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-center text-white">
                    <h2 className="text-2xl font-bold mb-4">Ready to Start Learning?</h2>
                    <p className="mb-6 opacity-90">
                        Join thousands of learners who are advancing their skills through our comprehensive lessons.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/auth/register"
                            className="px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                        >
                            Get Started Free
                        </Link>
                        <Link
                            href="/auth/login"
                            className="px-8 py-3 border border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}