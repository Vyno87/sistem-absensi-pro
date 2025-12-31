import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import GlassCard from '../components/UI/GlassCard';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import { User, Lock, ArrowRight, Globe, Download, Monitor, Smartphone, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [deviceType, setDeviceType] = useState<'pc' | 'android' | 'ios'>('pc');
    const { login } = useAuth();
    const { t, language, setLanguage } = useLanguage();
    const navigate = useNavigate();

    useEffect(() => {
        // Detect OS
        const userAgent = window.navigator.userAgent.toLowerCase();
        if (/iphone|ipad|ipod/.test(userAgent)) {
            setDeviceType('ios');
        } else if (/android/.test(userAgent)) {
            setDeviceType('android');
            setIsInstallable(true); // Usually android shows "Add to Home Screen"
        } else {
            setDeviceType('pc');
        }

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
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
                setIsInstallable(false);
            }
        } else if (deviceType === 'android') {
            // If Android but no deferredPrompt (e.g. already handled by browser)
            alert(t('login.iosInstruction')); // Fallback instruction for Android
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
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#020617]">
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
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/30 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-md space-y-6">
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

