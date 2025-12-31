import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import GlassCard from '../components/UI/GlassCard';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import { User, Lock, ArrowRight, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const { t, language, setLanguage } = useLanguage();
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
            setError(err.response?.data?.errors?.[0]?.msg || t('login.failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Language Selector - Top Right */}
            <div className="absolute top-4 right-4 z-10">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl rounded-xl p-2 border border-white/10">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <div className="flex bg-white/5 rounded-lg p-1">
                        <button
                            onClick={() => setLanguage('en')}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${language === 'en' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            EN
                        </button>
                        <button
                            onClick={() => setLanguage('id')}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${language === 'id' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            ID
                        </button>
                    </div>
                </div>
            </div>

            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[100px]" />
            </div>

            <GlassCard className="w-full max-w-md p-8 backdrop-blur-xl border-opacity-20 animate-fade-in-up">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2">
                        <span className="text-gradient">{t('login.title')}</span>
                    </h1>
                    <p className="text-gray-400">{t('login.subtitle')}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        label={t('login.username')}
                        icon={<User className="w-5 h-5" />}
                        placeholder={t('login.username')}
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />

                    <Input
                        label={t('login.password')}
                        type="password"
                        icon={<Lock className="w-5 h-5" />}
                        placeholder={t('login.password')}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full" isLoading={loading} icon={<ArrowRight className="w-5 h-5" />}>
                        {t('login.btn')}
                    </Button>
                </form>
            </GlassCard>
        </div>
    );
};

export default Login;

