'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { authAPI } from '@/lib/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(null);
    const [error, setError] = useState(null);

    // Initialize auth state from cookies on mount
    useEffect(() => {
        const initAuth = () => {
            try {
                const savedToken = Cookies.get('token');
                const savedUser = Cookies.get('user');

                if (savedToken && savedUser) {
                    try {
                        const parsedUser = JSON.parse(savedUser);
                        setToken(savedToken);
                        setUser(parsedUser);
                    } catch (parseError) {
                        // Corrupted cookie data
                        Cookies.remove('token');
                        Cookies.remove('user');
                    }
                }
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = async (credentials) => {
        setError(null);
        const response = await authAPI.login(credentials);

        if (response.success) {
            const { user: userData, token: authToken } = response.data;

            Cookies.set('token', authToken, { expires: 7, sameSite: 'lax' });
            Cookies.set('user', JSON.stringify(userData), { expires: 7, sameSite: 'lax' });

            // Set state synchronously so ProtectedRoute sees it immediately
            setToken(authToken);
            setUser(userData);

            return response;
        }

        throw new Error('Login failed');
    };

    const register = async (userData) => {
        setError(null);
        const response = await authAPI.register(userData);

        if (response.success) {
            const { user: newUser, token: authToken } = response.data;

            Cookies.set('token', authToken, { expires: 7, sameSite: 'lax' });
            Cookies.set('user', JSON.stringify(newUser), { expires: 7, sameSite: 'lax' });

            setToken(authToken);
            setUser(newUser);

            return response;
        }

        throw new Error('Registration failed');
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        setError(null);
        Cookies.remove('token');
        Cookies.remove('user');
    };

    const updateUser = (updatedUser) => {
        setUser(updatedUser);
        Cookies.set('user', JSON.stringify(updatedUser), { expires: 7 });
    };

    const isAuthenticated = () => {
        return !!(user && token);
    };

    const isAdmin = () => {
        return user?.role === 'admin';
    };

    const isStudent = () => {
        return user?.role === 'student';
    };

    const value = {
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated,
        isAdmin,
        isStudent,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};