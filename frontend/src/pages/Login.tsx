import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import GlassCard from '../components/UI/GlassCard';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import { User, Lock, ArrowRight, Globe, Download, Monitor, Smartphone, Info, Fingerprint } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [deviceType, setDeviceType] = useState<'pc' | 'android' | 'ios'>('pc');
    const { login, loginBiometric } = useAuth();
    const { t, language, setLanguage } = useLanguage();
    const navigate = useNavigate();

    useEffect(() => {
        // Detect OS
        const userAgent = window.navigator.userAgent.toLowerCase();
        if (/iphone|ipad|ipod/.test(userAgent)) {
            setDeviceType('ios');
        } else if (/android/.test(userAgent)) {
            setDeviceType('android');
            // Usually android shows "Add to Home Screen"
        } else {
            setDeviceType('pc');
        }

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deviceType === 'ios') {
            // iOS instructions are handled in the UI
            return;
        }

        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
        } else if (deviceType === 'android') {
            // If Android but no deferredPrompt (e.g. already handled by browser)
            alert(t('login.iosInstruction')); // Fallback instruction for Android
        }
    };

    const handleBiometricLogin = async () => {
        setLoading(true);
        setError('');
        try {
            await loginBiometric();
            navigate('/dashboard');
        } catch (err: any) {
            setError(t('login.biometricFailed'));
        } finally {
            setLoading(false);
        }
    };

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
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-black selection:bg-primary/30">
            {/* Background Gradients - Nuansa Neon Premium */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-5%] w-[80vh] h-[80vh] bg-primary/10 rounded-full blur-[120px] animate-float-neon" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[70vh] h-[70vh] bg-secondary/10 rounded-full blur-[100px] animate-float-neon-delayed" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vh] h-[60vh] bg-indigo-500/5 rounded-full blur-[150px] animate-float-neon-slow" />

                {/* Grid Overlay for Tech Feel */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
            </div>

            {/* Language Selector - Top Right */}
            <div className="absolute top-6 right-6 z-20">
                <div className="flex items-center gap-2 bg-white/5 backdrop-blur-xl rounded-2xl p-1.5 border border-white/10">
                    <Globe className="w-4 h-4 text-gray-500 ml-2" />
                    <div className="flex bg-white/5 rounded-xl p-1">
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

            <div className="w-full max-w-md space-y-6 relative z-10">
                <GlassCard className="p-8 backdrop-blur-xl border-opacity-20 animate-fade-in-up">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold mb-2">
                            <span className="text-gradient leading-tight">{t('login.title')}</span>
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
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center font-medium">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full text-lg py-6" isLoading={loading} icon={<ArrowRight className="w-6 h-6" />}>
                            {t('login.btn')}
                        </Button>

                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-[#020617] px-2 text-gray-500">OR</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleBiometricLogin}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/20 transition-all group"
                        >
                            <Fingerprint className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            <span className="font-bold">{t('login.biometricBtn')}</span>
                        </button>
                    </form>
                </GlassCard>

                {/* Download PWA Section */}
                <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-primary/20 rounded-xl">
                                <Download className="w-6 h-6 text-primary" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-white font-bold">{t('login.downloadApp')}</h3>
                                <p className="text-gray-400 text-xs">{t('login.installInstruction')}</p>
                            </div>
                        </div>

                        {deviceType === 'ios' ? (
                            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3">
                                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-blue-100 leading-relaxed">
                                    {t('login.iosInstruction')}
                                </p>
                            </div>
                        ) : (
                            <button
                                onClick={handleInstallClick}
                                className="w-full flex items-center justify-center gap-3 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all group"
                            >
                                {deviceType === 'pc' ? <Monitor className="w-5 h-5 text-primary" /> : <Smartphone className="w-5 h-5 text-primary" />}
                                <span className="font-bold">{t('login.installBtn')}</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="text-center text-gray-500 text-xs pt-4">
                    &copy; 2026 {t('app.title')}. All Rights Reserved.
                </div>
            </div>
        </div>
    );
};

export default Login;

