import React, { useState, useEffect, useCallback, useRef } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import GlassCard from '../components/UI/GlassCard';
import Webcam from 'react-webcam';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { Clock, CheckCircle, XCircle, RefreshCw, User, AlertTriangle } from 'lucide-react';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';

// Tipe data untuk AttendanceRecord
interface AttendanceRecord {
    employeeName: string;
    position: string;
    checkIn: string;
    status: string;
    type?: string;
}

const Attendance = () => {
    const { t, language } = useLanguage();
    const [employeeId, setEmployeeId] = useState('');
    const [loadingAction, setLoadingAction] = useState<'Check In' | 'Check Out' | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const webcamRef = useRef<Webcam>(null);
    const [recentActivity, setRecentActivity] = useState<AttendanceRecord[]>([]);
    const [gpsEnabled, setGpsEnabled] = useState(false);
    const [geofenceSettings, setGeofenceSettings] = useState<any>(null);
    const [distanceFromOffice, setDistanceFromOffice] = useState<number | null>(null);

    // Fetch recent attendance
    const fetchRecent = async () => {
        try {
            const res = await api.get('/attendance');
            setRecentActivity(res.data);
        } catch (err) {
            console.error('Error fetching recent activity:', err);
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

    // Fetch Geofence settings
    const fetchGeofenceSettings = async () => {
        try {
            const res = await api.get('/geofence');
            setGeofenceSettings(res.data);
        } catch (err) {
            console.error('Error fetching geofence settings:', err);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        fetchRecent();
        fetchGPSSetting();
        fetchGeofenceSettings();

        // Real-time polling setiap 5 detik
        const interval = setInterval(() => {
            fetchRecent();
            fetchGPSSetting();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot({
            width: 400,
            height: 300
        });
        if (imageSrc) {
            setImgSrc(imageSrc);
        }
    }, [webcamRef]);

    const handleAttendance = async (type: 'Check In' | 'Check Out') => {
        if (!employeeId || !imgSrc) {
            setMessage({ type: 'error', text: t('attendance.validationError') });
            return;
        }

        setLoadingAction(type);
        setMessage(null);

        try {
            let locationData = {};

            // Only request GPS if enabled by Admin
            if (gpsEnabled) {
                if (!navigator.geolocation) {
                    throw new Error('Geolocation not supported');
                }

                // Add timeout handling specifically for UI feedback
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: false, // Changed to false for faster lock
                        timeout: 5000, // Reduced timeout to 5s
                        maximumAge: 0
                    });
                });

                locationData = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };

                // Calculate distance if geofencing is enabled
                if (geofenceSettings?.enabled) {
                    const R = 6371e3; // Earth radius in meters
                    const φ1 = geofenceSettings.centerLat * Math.PI / 180;
                    const φ2 = position.coords.latitude * Math.PI / 180;
                    const Δφ = (position.coords.latitude - geofenceSettings.centerLat) * Math.PI / 180;
                    const Δλ = (position.coords.longitude - geofenceSettings.centerLng) * Math.PI / 180;

                    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                        Math.cos(φ1) * Math.cos(φ2) *
                        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    const distance = R * c;

                    setDistanceFromOffice(Math.round(distance));
                }
            }

            // Simple Device Fingerprinting
            let deviceId = localStorage.getItem('absensi_device_id');
            if (!deviceId) {
                deviceId = 'dev_' + Math.random().toString(36).substr(2, 9) + Date.now();
                localStorage.setItem('absensi_device_id', deviceId);
            }

            const attendancePayload = {
                type,
                employeeId,
                checkIn: new Date(),
                facePhoto: imgSrc,
                deviceId,
                ...locationData
            };

            try {
                const res = await api.post('/attendance', attendancePayload);

                if (res.data.msg) {
                    if (res.data.msg.includes('outside')) {
                        setMessage({ type: 'error', text: res.data.msg });
                        return;
                    }
                }

                setMessage({
                    type: 'success',
                    text: type === 'Check In' ? 'Check-in Berhasil!' : 'Check-out Berhasil!'
                });

                // Clear any pending sync for this employee if successful
                const pending = JSON.parse(localStorage.getItem('pending_attendance') || '[]');
                const remaining = pending.filter((p: any) => p.employeeId !== employeeId);
                localStorage.setItem('pending_attendance', JSON.stringify(remaining));

            } catch (error: any) {
                if (!navigator.onLine || error.code === 'ERR_NETWORK') {
                    // Offline handling
                    const pending = JSON.parse(localStorage.getItem('pending_attendance') || '[]');
                    pending.push({ ...attendancePayload, offlineTimestamp: new Date() });
                    localStorage.setItem('pending_attendance', JSON.stringify(pending));

                    setMessage({
                        type: 'warning',
                        text: 'Offline! Absensi disimpan secara lokal dan akan disinkronisasi saat internet aktif.'
                    });
                } else {
                    throw error;
                }
            }
            fetchRecent();
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
            setLoadingAction(null);
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

                    {/* Distance Indicator */}
                    {geofenceSettings?.enabled && distanceFromOffice !== null && (
                        <div className={`p-4 rounded-xl border-2 ${distanceFromOffice <= geofenceSettings.radiusMeters
                            ? 'bg-green-500/10 border-green-500/50'
                            : 'bg-red-500/10 border-red-500/50'
                            }`}>
                            <div className="text-center">
                                <p className={`text-sm ${distanceFromOffice <= geofenceSettings.radiusMeters
                                    ? 'text-green-400'
                                    : 'text-red-400'
                                    }`}>
                                    📍 Jarak dari Kantor
                                </p>
                                <p className={`text-3xl font-bold ${distanceFromOffice <= geofenceSettings.radiusMeters
                                    ? 'text-green-400'
                                    : 'text-red-400'
                                    }`}>
                                    {distanceFromOffice}m
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Max: {geofenceSettings.radiusMeters}m | Status: {
                                        distanceFromOffice <= geofenceSettings.radiusMeters
                                            ? '✅ Dalam Radius'
                                            : '❌ Di Luar Radius'
                                    }
                                </p>
                            </div>
                        </div>
                    )}

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
                                        videoConstraints={{ facingMode: "user" }} // Ensure front camera
                                    />
                                    {/* Face Guide Overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-[180px] h-[240px] border-2 border-dashed border-white/50 rounded-[50%] shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
                                        <p className="absolute bottom-16 text-white text-xs font-semibold bg-black/50 px-3 py-1 rounded-full border border-white/20">
                                            Posisikan wajah dalam area oval
                                        </p>
                                    </div>
                                    <div className="absolute bottom-4">
                                        <Button onClick={capture} icon={<User className="w-4 h-4" />}>
                                            {t('attendance.capturePhoto')}
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <img src={imgSrc} alt="Captured" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                        <Button onClick={() => setImgSrc(null)} variant="secondary" icon={<RefreshCw className="w-4 h-4" />}>
                                            {t('attendance.retakePhoto')}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="space-y-4">
                            <Input
                                placeholder={t('attendance.enterEmployeeId')}
                                value={employeeId}
                                onChange={(e) => setEmployeeId(e.target.value)}
                                className="text-center text-xl tracking-widest"
                                icon={<Clock />}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    onClick={() => handleAttendance('Check In')}
                                    isLoading={loadingAction === 'Check In'}
                                    disabled={loadingAction !== null}
                                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-none"
                                >
                                    {t('attendance.checkIn')}
                                </Button>
                                <Button
                                    onClick={() => handleAttendance('Check Out')}
                                    variant="secondary"
                                    isLoading={loadingAction === 'Check Out'}
                                    disabled={loadingAction !== null}
                                    className="w-full"
                                >
                                    {t('attendance.checkOut')}
                                </Button>
                            </div>

                            {message && (
                                <div className={`p-4 rounded-xl flex items-center justify-center space-x-2 animate-bounce ${message.type === 'success' ? 'bg-green-500/20 text-green-400' :
                                    message.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-red-500/20 text-red-400'}`}>
                                    {message.type === 'success' ? <CheckCircle /> : message.type === 'warning' ? <AlertTriangle /> : <XCircle />}
                                    <span>{message.text}</span>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>

                {/* Right Side - Recent Activity */}
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
                                            {new Date(record.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })}
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
