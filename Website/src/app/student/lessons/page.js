'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/LoadingSpinner';
import { lessonsAPI } from '@/lib/api';
import { BookOpen, Clock, Search, Filter, ArrowRight, Star, User } from 'lucide-react';

export default function StudentLessons() {
    const [lessons, setLessons] = useState([]);
    const [filteredLessons, setFilteredLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [levelFilter, setLevelFilter] = useState('all');
    const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0, pages: 0 });

    useEffect(() => {
        fetchLessons();
    }, [pagination.page]);

    useEffect(() => {
        filterLessons();
    }, [lessons, searchTerm, levelFilter]);

    const fetchLessons = async () => {
        try {
            setLoading(true);
            const response = await lessonsAPI.getAllLessons(pagination.page, pagination.limit);
            setLessons(response.data.lessons || []);
            setPagination(prev => ({ ...prev, ...response.pagination }));
        } catch (error) {
            console.error('Error fetching lessons:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterLessons = () => {
        let filtered = lessons;

        if (searchTerm) {
            filtered = filtered.filter(lesson =>
                lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                lesson.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (levelFilter !== 'all') {
            filtered = filtered.filter(lesson => lesson.level === levelFilter);
        }

        setFilteredLessons(filtered);
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
        return (
            <ProtectedRoute>
                <LoadingSpinner text="Loading lessons..." />
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
                                <h1 className="text-3xl font-bold text-gray-900">Lessons</h1>
                                <p className="mt-2 text-gray-600">Explore our comprehensive learning materials</p>
                            </div>
                            <Link
                                href="/student"
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Back to Dashboard
                            </Link>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-lg shadow mb-6">
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search lessons..."
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Filter className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <select
                                        value={levelFilter}
                                        onChange={(e) => setLevelFilter(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="all">All Levels</option>
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lessons Grid */}
                    {loading ? (
                        <div className="flex justify-center">
                            <LoadingSpinner size="small" text="Loading lessons..." />
                        </div>
                    ) : filteredLessons.length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-8 text-center">
                            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No lessons found</h3>
                            <p className="text-gray-500">
                                {searchTerm || levelFilter !== 'all'
                                    ? 'Try adjusting your search or filters'
                                    : 'No lessons available yet'
                                }
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredLessons.map(lesson => (
                                    <div key={lesson.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden">
                                        <div className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{lesson.title}</h3>
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelColor(lesson.level)}`}>
                                                            {lesson.level}
                                                        </span>
                                                        <div className="flex items-center">
                                                            {getDifficultyStars(lesson.level)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <BookOpen className="h-6 w-6 text-blue-600 flex-shrink-0" />
                                            </div>

                                            <p className="text-gray-600 text-sm mb-4 line-clamp-3">{lesson.description}</p>

                                            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                                <div className="flex items-center">
                                                    <User className="h-4 w-4 mr-1" />
                                                    <span>{lesson.author_name || 'Instructor'}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <Clock className="h-4 w-4 mr-1" />
                                                    <span>{new Date(lesson.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>

                                            <Link
                                                href={`/student/lessons/${lesson.id}`}
                                                className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                                            >
                                                Start Lesson
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {pagination.pages > 1 && (
                                <div className="mt-8 flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Showing page {pagination.page} of {pagination.pages}
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                            disabled={pagination.page === 1}
                                            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded disabled:opacity-50 hover:bg-gray-300"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                            disabled={pagination.page === pagination.pages}
                                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded disabled:opacity-50 hover:bg-blue-700"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}