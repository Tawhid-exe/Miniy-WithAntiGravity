import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState(null);

    // Removed local api creation, using imported instance

    const loadUser = async () => {
        try {
            // We need a specific endpoint to just get user info.
            // Currently we don't have a dedicated /me endpoint in authRoutes.
            // I'll assume we might need to add one or use a workaround.
            // For now, let's assume valid cookie means valid user if we hit a protected route?
            // Actually, we should add a /me endpoint or similar.
            // Let's rely on stored user or check session.
            // For this iteration, let's skip auto-load implementation details that require backend changes 
            // OR I can quickly add a /me endpoint to backend in the next step.
            // I will add /me endpoint to backend for completeness.
            const { data } = await api.get('/me');
            setUser(data.user);
            setIsAuthenticated(true);
            setLoading(false);
        } catch (error) {
            setUser(null);
            setIsAuthenticated(false);
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/login', { email, password });
            setUser(data.user);
            setIsAuthenticated(true);
            return data;
        } catch (error) {
            setError(error.response?.data?.message || 'Login failed');
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            const { data } = await api.post('/register', userData);
            setUser(data.user);
            setIsAuthenticated(true);
            return data;
        } catch (error) {
            setError(error.response?.data?.message || 'Registration failed');
            throw error;
        }
    };

    const logout = async () => {
        try {
            await api.get('/logout');
            setUser(null);
            setIsAuthenticated(false);
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const clearErrors = () => {
        setError(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isAuthenticated,
            error,
            login,
            register,
            logout,
            clearErrors,
            loadUser // Exposed so App can call it
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
