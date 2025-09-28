'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { authAPI } from '@/lib/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(null);

    useEffect(() => {
        // Initialize auth state from cookies
        const savedToken = Cookies.get('token');
        const savedUser = Cookies.get('user');

        if (savedToken && savedUser) {
            try {
                setToken(savedToken);
                setUser(JSON.parse(savedUser));
            } catch (error) {
                console.error('Error parsing saved user:', error);
                logout();
            }
        }
        setLoading(false);
    }, []);

    const login = async (credentials) => {
        try {
            setLoading(true);
            const response = await authAPI.login(credentials);

            if (response.success) {
                const { user: userData, token: authToken } = response.data;

                // Save to state
                setUser(userData);
                setToken(authToken);

                // Save to cookies
                Cookies.set('token', authToken, { expires: 7 }); // 7 days
                Cookies.set('user', JSON.stringify(userData), { expires: 7 });

                return response;
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        try {
            setLoading(true);
            const response = await authAPI.register(userData);

            if (response.success) {
                const { user: newUser, token: authToken } = response.data;

                // Save to state
                setUser(newUser);
                setToken(authToken);

                // Save to cookies
                Cookies.set('token', authToken, { expires: 7 });
                Cookies.set('user', JSON.stringify(newUser), { expires: 7 });

                return response;
            }
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
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