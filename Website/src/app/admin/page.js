'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/LoadingSpinner';
import { usersAPI, lessonsAPI, quizzesAPI, feedbackAPI } from '@/lib/api';
import { Users, BookOpen, FileQuestion, MessageSquare, BarChart3, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [userStats, lessons, quizzes, feedback] = await Promise.all([
                usersAPI.getUserStats(),
                lessonsAPI.getAllLessons(1, 1),
                quizzesAPI.getAllQuizzes(1, 1),
                feedbackAPI.getAllFeedback(1, 1)
            ]);

            setStats({
                users: userStats.data,
                totalLessons: lessons.data.pagination.total,
                totalQuizzes: quizzes.data.pagination.total,
                totalFeedback: feedback.data.pagination.total
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <ProtectedRoute adminOnly>
                <LoadingSpinner text="Loading admin dashboard..." />
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute adminOnly>
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="mt-2 text-gray-600">Manage your quiz application</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Users className="h-8 w-8 text-blue-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Total Users</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats?.users?.total_users || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <BookOpen className="h-8 w-8 text-green-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Total Lessons</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats?.totalLessons || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <FileQuestion className="h-8 w-8 text-purple-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Total Quizzes</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats?.totalQuizzes || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <MessageSquare className="h-8 w-8 text-orange-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Total Feedback</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats?.totalFeedback || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* User Stats */}
                    {stats?.users && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <Users className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-500">Students</p>
                                        <p className="text-xl font-semibold text-gray-900">{stats.users.students}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <Users className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-500">Admins</p>
                                        <p className="text-xl font-semibold text-gray-900">{stats.users.admins}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <TrendingUp className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-500">New Today</p>
                                        <p className="text-xl font-semibold text-gray-900">{stats.users.registered_today}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Link
                                    href="/admin/users"
                                    className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                    <Users className="h-8 w-8 text-blue-600 mr-3" />
                                    <div>
                                        <p className="font-medium text-gray-900">Manage Users</p>
                                        <p className="text-sm text-gray-600">View and edit users</p>
                                    </div>
                                </Link>

                                <Link
                                    href="/admin/lessons"
                                    className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                                >
                                    <BookOpen className="h-8 w-8 text-green-600 mr-3" />
                                    <div>
                                        <p className="font-medium text-gray-900">Manage Lessons</p>
                                        <p className="text-sm text-gray-600">Create and edit lessons</p>
                                    </div>
                                </Link>

                                <Link
                                    href="/admin/quizzes"
                                    className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                                >
                                    <FileQuestion className="h-8 w-8 text-purple-600 mr-3" />
                                    <div>
                                        <p className="font-medium text-gray-900">Manage Quizzes</p>
                                        <p className="text-sm text-gray-600">Create and edit quizzes</p>
                                    </div>
                                </Link>

                                <Link
                                    href="/admin/results"
                                    className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                                >
                                    <BarChart3 className="h-8 w-8 text-orange-600 mr-3" />
                                    <div>
                                        <p className="font-medium text-gray-900">Quiz Results</p>
                                        <p className="text-sm text-gray-600">View and manage results</p>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}