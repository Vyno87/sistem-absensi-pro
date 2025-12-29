import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/UI/GlassCard';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import { User, Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post('/auth', formData);
            login(res.data.token);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.errors?.[0]?.msg || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[100px]" />
            </div>

            <GlassCard className="w-full max-w-md p-8 backdrop-blur-xl border-opacity-20 animate-fade-in-up">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2">
                        <span className="text-gradient">Welcome Back</span>
                    </h1>
                    <p className="text-gray-400">Sign in to access your dashboard</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        label="Username"
                        icon={<User className="w-5 h-5" />}
                        placeholder="Enter your username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />

                    <Input
                        label="Password"
                        type="password"
                        icon={<Lock className="w-5 h-5" />}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full" isLoading={loading} icon={<ArrowRight className="w-5 h-5" />}>
                        Sign In
                    </Button>
                </form>
            </GlassCard>
        </div>
    );
};

export default Login;
