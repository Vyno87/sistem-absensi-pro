import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

interface User {
    _id: string;
    username: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            if (token) {
                try {
                    // Set default header
                    api.defaults.headers.common['x-auth-token'] = token;
                    const res = await api.get('/auth');
                    setUser(res.data);
                } catch (error) {
                    console.error("Auth Load Error", error);
                    localStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                }
            }
            setIsLoading(false);
        };

        loadUser();
    }, [token]);

    const login = (newToken: string) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
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
