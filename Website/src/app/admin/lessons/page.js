'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/LoadingSpinner';
import { lessonsAPI } from '@/lib/api';
import { BookOpen, Search, Edit, Trash2, Plus, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LessonsManagement() {
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingLesson, setEditingLesson] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        content: '',
        video_url: '',
        level: 'beginner'
    });

    useEffect(() => {
        fetchLessons();
    }, [pagination.page]);

    const fetchLessons = async () => {
        try {
            setLoading(true);
            const response = await lessonsAPI.getAllLessons(pagination.page, pagination.limit);
            setLessons(response.data.lessons);
            setPagination(prev => ({ ...prev, ...response.data.pagination }));
        } catch (error) {
            console.error('Error fetching lessons:', error);
            toast.error('Failed to fetch lessons');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLesson = async (e) => {
        e.preventDefault();
        try {
            await lessonsAPI.createLesson(formData);
            toast.success('Lesson created successfully');
            setShowCreateModal(false);
            setFormData({ title: '', content: '', video_url: '', description: '', level: 'beginner' });
            fetchLessons();
        } catch (error) {
            console.error('Error creating lesson:', error);
            toast.error('Failed to create lesson');
        }
    };

    const handleUpdateLesson = async (e) => {
        e.preventDefault();
        try {
            await lessonsAPI.updateLesson(editingLesson.id, formData);
            toast.success('Lesson updated successfully');
            setEditingLesson(null);
            setFormData({ title: '', content: '', video_url: '', description: '', level: 'beginner' });
            fetchLessons();
        } catch (error) {
            console.error('Error updating lesson:', error);
            toast.error('Failed to update lesson');
        }
    };

    const handleDeleteLesson = async (lessonId) => {
        if (window.confirm('Are you sure you want to delete this lesson?')) {
            try {
                await lessonsAPI.deleteLesson(lessonId);
                toast.success('Lesson deleted successfully');
                fetchLessons();
            } catch (error) {
                console.error('Error deleting lesson:', error);
                toast.error('Failed to delete lesson');
            }
        }
    };

    const openEditModal = (lesson) => {
        setEditingLesson(lesson);
        setFormData({
            title: lesson.title,
            description: lesson.description || '',
            content: lesson.content,
            video_url: lesson.video_url || '',
            level: lesson.level || 'beginner'
        });
    };

    const filteredLessons = lessons.filter(lesson =>
        lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const LessonModal = ({ isOpen, onClose, onSubmit, isEditing }) => {
        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 text-black">
                <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <h2 className="text-xl font-bold mb-4">
                        {isEditing ? 'Edit Lesson' : 'Create New Lesson'}
                    </h2>
                    <form onSubmit={onSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Title
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Description
                            </label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Brief lesson description"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Video URL
                            </label>
                            <input
                                type="url"
                                value={formData.video_url}
                                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="https://www.youtube.com/watch?v=... or direct video URL"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Difficulty Level
                            </label>
                            <select
                                value={formData.level}
                                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Content
                            </label>
                            <textarea
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                rows={10}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Detailed lesson content..."
                                required
                            />
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                {isEditing ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    if (loading && lessons.length === 0) {
        return (
            <ProtectedRoute adminOnly>
                <LoadingSpinner text="Loading lessons..." />
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute adminOnly>
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8 flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Lessons Management</h1>
                            <p className="mt-2 text-gray-600">Create and manage educational content</p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Lesson
                        </button>
                    </div>

                    {/* Search */}
                    <div className="bg-white rounded-lg shadow mb-6">
                        <div className="p-6">
                            <div className="relative">
                                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                                <input
                                    type="text"
                                    placeholder="Search lessons..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Lessons Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            <div className="col-span-full">
                                <LoadingSpinner size="small" text="Loading lessons..." />
                            </div>
                        ) : filteredLessons.length === 0 ? (
                            <div className="col-span-full text-center py-8">
                                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No lessons found</p>
                            </div>
                        ) : (
                            filteredLessons.map((lesson) => (
                                <div key={lesson.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                                    <div className="p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{lesson.title}</h3>
                                        {lesson.description && (
                                            <p className="text-gray-900 text-sm mb-2 font-medium">
                                                {lesson.description}
                                            </p>
                                        )}
                                        {lesson.level && (
                                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-2">
                                                {lesson.level.charAt(0).toUpperCase() + lesson.level.slice(1)}
                                            </span>
                                        )}
                                        <p className="text-gray-800 text-sm mb-4 line-clamp-3">
                                            {lesson.content.substring(0, 150)}...
                                        </p>
                                        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                                            <span>By {lesson.created_by_username}</span>
                                            <span>{new Date(lesson.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                onClick={() => window.open(`/lessons/${lesson.id}`, '_blank')}
                                                className="p-2 text-gray-600 hover:text-gray-900"
                                                title="View"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => openEditModal(lesson)}
                                                className="p-2 text-blue-600 hover:text-blue-900"
                                                title="Edit"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteLesson(lesson.id)}
                                                className="p-2 text-red-600 hover:text-red-900"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="mt-8 flex justify-center">
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                    disabled={pagination.page === 1}
                                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <span className="px-3 py-1 text-sm text-gray-700">
                                    Page {pagination.page} of {pagination.pages}
                                </span>
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
            </div>

            {/* Create Modal */}
            <LessonModal
                isOpen={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                    setFormData({ title: '', content: '' });
                }}
                onSubmit={handleCreateLesson}
                isEditing={false}
            />

            {/* Edit Modal */}
            <LessonModal
                isOpen={!!editingLesson}
                onClose={() => {
                    setEditingLesson(null);
                    setFormData({ title: '', content: '' });
                }}
                onSubmit={handleUpdateLesson}
                isEditing={true}
            />
        </ProtectedRoute>
    );
}