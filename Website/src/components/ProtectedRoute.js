'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const ProtectedRoute = ({ children, adminOnly = false, studentOnly = false }) => {
    const { user, loading, isAuthenticated, isAdmin, isStudent } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated()) {
                router.push('/auth/login');
                return;
            }

            if (adminOnly && !isAdmin()) {
                router.push('/unauthorized');
                return;
            }

            if (studentOnly && !isStudent()) {
                router.push('/unauthorized');
                return;
            }
        }
    }, [user, loading, router, adminOnly, studentOnly, isAuthenticated, isAdmin, isStudent]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!isAuthenticated()) {
        return null;
    }

    if (adminOnly && !isAdmin()) {
        return null;
    }

    if (studentOnly && !isStudent()) {
        return null;
    }

    return children;
};

export default ProtectedRoute;