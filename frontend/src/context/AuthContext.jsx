import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            loadUser();
        } else {
            setLoading(false);
        }
    }, []);

    const loadUser = async () => {
        try {
            const response = await authAPI.getMe();
            setUser(response.data.data);
        } catch (error) {
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const response = await authAPI.login({ email, password });
        if (response.data.success) {
            localStorage.setItem('token', response.data.token);
            setUser(response.data.user);
            return response.data.user;
        }
        throw new Error(response.data.message);
    };

    const register = async (email, phone, password) => {
        const response = await authAPI.register({ email, phone, password });
        if (response.data.success) {
            localStorage.setItem('token', response.data.token);
            setUser(response.data.user);
            return response.data.user;
        }
        throw new Error(response.data.message);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const refreshUser = async () => {
        await loadUser();
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
