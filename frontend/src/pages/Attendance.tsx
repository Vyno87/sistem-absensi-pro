import React, { useState, useEffect, useRef, useCallback } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import GlassCard from '../components/UI/GlassCard';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { Clock, CheckCircle, XCircle, Camera, RefreshCw, User, MapPin } from 'lucide-react';
import Webcam from 'react-webcam';

const Attendance = () => {
    const { t, language } = useLanguage();
    const [employeeId, setEmployeeId] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [gpsEnabled, setGpsEnabled] = useState(true); // Real-time GPS setting from backend
    const webcamRef = useRef<Webcam>(null);

    const fetchRecent = async () => {
        try {
            const res = await api.get('/attendance');
            setRecentActivity(res.data);
        } catch (err: any) {
            if (err.response?.status !== 401) {
                console.error('Error fetching recent:', err);
            }
        }
    };

    // Fetch GPS setting from backend
    const fetchGPSSetting = async () => {
        try {
            const res = await api.get('/settings/gpsEnabled');
            setGpsEnabled(res.data.value);
        } catch (err) {
            console.error('Error fetching GPS setting:', err);
        }
    };

    useEffect(() => {
        // Pastikan token ada sebelum mulai polling
        const token = localStorage.getItem('token');
        if (!token) return;

        // Initial fetch
        fetchRecent();
        fetchGPSSetting(); // Initial GPS setting fetch

        // Real-time polling setiap 5 detik (Optimized for mobile)
        const interval = setInterval(() => {
            fetchStats();
            fetchRecent();
            fetchGPSSetting(); // Poll GPS setting for real-time sync
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setImgSrc(imageSrc);
        }
    }, [webcamRef]);

    const handleAttendance = async (type: 'Check In' | 'Check Out') => {
        if (!employeeId || !imgSrc) {
            setMessage({ type: 'error', text: t('attendance.validationError') });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            let locationData = {};

            // Only request GPS if enabled by Admin
            if (gpsEnabled) {
                if (!navigator.geolocation) {
                    throw new Error('Geolocation not supported');
                }

                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    });
                });

                locationData = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
            }

            const res = await api.post('/attendance', {
                type,
                employeeId,
                checkIn: new Date(),
                facePhoto: imgSrc,
                ...locationData
            });

            if (res.data.msg) {
                // Handle specific messages usually meant for errors but sent as 200/201
                if (res.data.msg.includes('outside')) {
                    setMessage({ type: 'error', text: res.data.msg });
                    return;
                }
            }

            fetchRecent();

            const successType = type === 'Check In' ? t('attendance.checkIn') : t('attendance.checkOut');
            setLoading(false);
            setMessage({ type: 'success', text: `${t('attendance.success')}: ${successType}` });
            setEmployeeId('');
            setImgSrc(null);
        } catch (err: any) {
            console.error("Attendance Error:", err);

            if (err.code === 1 || err.message === 'User denied Geolocation') {
                setMessage({ type: 'error', text: t('attendance.locationDenied') });
            } else if (err.code === 2) {
                setMessage({ type: 'error', text: 'Lokasi tidak tersedia. Hubungi admin.' });
            } else if (err.response?.data?.msg?.includes('outside')) {
                setMessage({
                    type: 'error',
                    text: `${t('attendance.outsideOffice')}: ${err.response.data.distance}m`
                });
            } else {
                setMessage({ type: 'error', text: err.response?.data?.msg || err.message || t('attendance.failed') });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                {/* Left Side - Clock & Actions */}
                <div className="flex flex-col justify-center space-y-8">
                    <div className="text-center">
                        <h2 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-4 animate-pulse">
                            {currentTime.toLocaleTimeString('id-ID', { hour12: false })}
                        </h2>
                        <p className="text-xl text-gray-400">
                            {currentTime.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>

                    <GlassCard className="p-6 border-indigo-500/30">
                        <h3 className="text-2xl font-bold text-white mb-6 text-center">{t('attendance.faceVerification')}</h3>

                        <div className="relative mb-6 rounded-2xl overflow-hidden bg-slate-900 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center aspect-video">
                            {!imgSrc ? (
                                <>
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        className="w-full h-full object-cover"
                                        videoConstraints={{ facingMode: "user" }}
                                    />
                                    <button
                                        onClick={capture}
                                        className="absolute bottom-4 p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all transform hover:scale-110"
                                    >
                                        <Camera size={24} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <img src={imgSrc} alt="captured" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => setImgSrc(null)}
                                        className="absolute bottom-4 p-4 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all transform hover:scale-110"
                                    >
                                        <RefreshCw size={24} />
                                    </button>
                                </>
                            )}
                        </div>

                        <div className="space-y-4">
                            <Input
                                placeholder={t('attendance.employeeId')}
                                value={employeeId}
                                onChange={(e) => setEmployeeId(e.target.value)}
                                className="text-center text-xl tracking-widest"
                                icon={<Clock />}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    onClick={() => handleAttendance('Check In')}
                                    isLoading={loading}
                                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-none"
                                >
                                    {t('attendance.checkIn')}
                                </Button>
                                <Button
                                    onClick={() => handleAttendance('Check Out')}
                                    variant="secondary"
                                    isLoading={loading}
                                    className="w-full"
                                >
                                    {t('attendance.checkOut')}
                                </Button>
                            </div>

                            {message && (
                                <div className={`p-4 rounded-xl flex items-center justify-center space-x-2 animate-bounce ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {message.type === 'success' ? <CheckCircle /> : <XCircle />}
                                    <span>{message.text}</span>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>

                {/* Right Side - Recent Activity (Placeholder) */}
                <GlassCard>
                    <h3 className="text-xl font-bold text-white mb-6">{t('attendance.recentActivity')}</h3>
                    <div className="space-y-4">
                        {recentActivity.length === 0 ? (
                            <div className="text-gray-400 text-center py-4">{t('common.noData')}</div>
                        ) : (
                            recentActivity.map((record: any, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors animate-fade-in">
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${record.status === 'late' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-gradient-to-br from-indigo-500 to-purple-500'}`}>
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">{record.employeeName || 'Unknown'}</p>
                                            <p className="text-xs text-gray-400">{record.position || 'Employee'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${record.status === 'late' ? 'text-yellow-400' : 'text-green-400'}`}>
                                            {new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                        </p>
                                        <p className="text-xs text-gray-400 capitalize">
                                            <span className={record.type === 'Check Out' ? 'text-orange-400 font-medium' : 'text-blue-400 font-medium'}>
                                                {record.type}
                                            </span>
                                            <span className="mx-1">•</span>
                                            {record.status || 'Present'}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </GlassCard>
            </div>
        </MainLayout>
    );
};

export default Attendance;

