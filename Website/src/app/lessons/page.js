'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { lessonsAPI } from '@/lib/api';
import { BookOpen, Clock, User, Star, ArrowRight } from 'lucide-react';

export default function PublicLessons() {
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 0 });

    useEffect(() => {
        fetchLessons();
    }, [pagination.page]);

    const fetchLessons = async () => {
        try {
            setLoading(true);
            const response = await lessonsAPI.getAllLessons(pagination.page, pagination.limit);
            console.log('Public lessons API response:', response);
            setLessons(response.lessons || []);
            setPagination(prev => ({ ...prev, ...response.pagination }));
        } catch (error) {
            console.error('Error fetching lessons:', error);
            setLessons([]);
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

    if (loading && lessons.length === 0) {
        return <LoadingSpinner text="Loading lessons..." />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Explore Our <span className="text-blue-600">Lessons</span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Discover comprehensive learning materials designed to help you master new skills and concepts.
                    </p>
                    <div className="mt-8">
                        <Link
                            href="/auth/login"
                            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Login to Access Full Features
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </div>
                </div>

                {/* Lessons Grid */}
                {lessons.length === 0 ? (
                    <div className="text-center py-12">
                        <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No lessons available</h3>
                        <p className="text-gray-600">Check back later for new learning materials.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {lessons.map(lesson => (
                                <div key={lesson.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{lesson.title}</h3>
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelColor(lesson.level)}`}>
                                                        {lesson.level || 'beginner'}
                                                    </span>
                                                    <div className="flex items-center">
                                                        {getDifficultyStars(lesson.level || 'beginner')}
                                                    </div>
                                                </div>
                                            </div>
                                            <BookOpen className="h-6 w-6 text-blue-600 flex-shrink-0" />
                                        </div>

                                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{lesson.description || 'Learn important concepts and skills with this comprehensive lesson.'}</p>

                                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                            <div className="flex items-center">
                                                <User className="h-4 w-4 mr-1" />
                                                <span>{lesson.created_by_username || 'Instructor'}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <Clock className="h-4 w-4 mr-1" />
                                                <span>{new Date(lesson.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <div className="border-t pt-4">
                                            <div className="flex space-x-2">
                                                <Link
                                                    href={`/lessons/${lesson.id}`}
                                                    className="flex-1 text-center px-3 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                                                >
                                                    Preview
                                                </Link>
                                                <Link
                                                    href="/auth/login"
                                                    className="flex-1 text-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                                >
                                                    Study
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
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
                <div className="mt-16 bg-white rounded-2xl shadow-xl p-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Start Learning?</h2>
                    <p className="text-gray-600 mb-6">
                        Join our community of learners and get access to interactive quizzes, progress tracking, and personalized learning paths.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/auth/register"
                            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Sign Up Now
                        </Link>
                        <Link
                            href="/auth/login"
                            className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Already have an account?
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}