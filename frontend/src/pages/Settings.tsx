import React, { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import GlassCard from '../components/UI/GlassCard';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import api from '../services/api';
import { MapPin, Save, ToggleLeft, ToggleRight, Shield, Crosshair, Fingerprint } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Settings = () => {
    const { registerBiometric } = useAuth();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        enabled: false,
        centerLat: -6.2088,
        centerLng: 106.8456,
        radiusMeters: 100,
        blockOutOfRange: true
    });
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/geofence');
            setSettings(res.data);
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');
        try {
            await api.post('/geofence', settings);
            setMessage(`✅ ${t('settings.saveSuccess')}`);
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage(`❌ ${t('settings.saveFailed')}`);
            console.error('Error saving settings:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation tidak didukung oleh browser Anda');
            return;
        }

        setSaving(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setSettings({
                    ...settings,
                    centerLat: parseFloat(position.coords.latitude.toFixed(6)),
                    centerLng: parseFloat(position.coords.longitude.toFixed(6))
                });
                setSaving(false);
            },
            (error) => {
                console.error('Error getting location:', error);
                alert('Gagal mendapatkan lokasi. Pastikan izin lokasi aktif.');
                setSaving(false);
            },
            { enableHighAccuracy: true }
        );
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-full text-white">{t('common.loading')}...</div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[var(--text-main)] mb-2">⚙️ {t('settings.title')}</h1>
                <p className="text-[var(--text-muted)]">{t('settings.subtitle')}</p>
            </div>

            <GlassCard className="max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--glass-border)]">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[var(--text-main)]">Smart Geofencing</h2>
                        <p className="text-[var(--text-muted)] text-sm">{t('settings.geofenceDesc')}</p>
                    </div>
                </div>

                {/* Enable/Disable Toggle */}
                <div className="mb-6">
                    <div className="flex items-center justify-between p-4 bg-[var(--glass-shine)] rounded-xl">
                        <div className="flex items-center gap-3">
                            {settings.enabled ? (
                                <ToggleRight className="w-8 h-8 text-green-400" />
                            ) : (
                                <ToggleLeft className="w-8 h-8 text-gray-400" />
                            )}
                            <div>
                                <h3 className="text-[var(--text-main)] font-semibold">{t('settings.geofenceActive')}</h3>
                                <p className="text-[var(--text-muted)] text-sm">{t('settings.geofenceDesc')}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
                            className={`px-6 py-2 rounded-lg font-semibold transition-all ${settings.enabled
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-600 text-gray-300'
                                }`}
                        >
                            {settings.enabled ? 'AKTIF' : 'NONAKTIF'}
                        </button>
                    </div>
                </div>

                {/* Office Location */}
                <div className="mb-6">
                    <label className="text-[var(--text-main)] font-semibold mb-2 block flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        {t('settings.officeLocation')}
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label={t('settings.lat')}
                            type="number"
                            step="0.000001"
                            value={settings.centerLat}
                            onChange={(e) => setSettings({ ...settings, centerLat: parseFloat(e.target.value) })}
                            placeholder="-6.2088"
                        />
                        <Input
                            label={t('settings.lng')}
                            type="number"
                            step="0.000001"
                            value={settings.centerLng}
                            onChange={(e) => setSettings({ ...settings, centerLng: parseFloat(e.target.value) })}
                            placeholder="106.8456"
                        />
                    </div>
                    <div className="mt-3">
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={<Crosshair className="w-4 h-4" />}
                            onClick={handleGetCurrentLocation}
                            className="w-full md:w-auto text-xs"
                        >
                            {t('settings.useCurrentLocation')}
                        </Button>
                    </div>
                    <p className="text-gray-400 text-xs mt-2">
                        💡 {t('settings.locationTip')}
                    </p>
                </div>

                {/* Radius Setting */}
                <div className="mb-6">
                    <label className="text-[var(--text-main)] font-semibold mb-2 block">
                        {t('settings.radius')}
                    </label>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min="10"
                            max="500"
                            step="10"
                            value={settings.radiusMeters}
                            onChange={(e) => setSettings({ ...settings, radiusMeters: parseInt(e.target.value) })}
                            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <div className="px-4 py-2 bg-primary/20 text-primary font-bold rounded-lg min-w-[80px] text-center">
                            {settings.radiusMeters}m
                        </div>
                    </div>
                    <p className="text-gray-400 text-xs mt-2">
                        {t('settings.radiusDesc')}: {settings.radiusMeters} m
                    </p>
                </div>

                {/* Block Mode */}
                <div className="mb-6">
                    <div className="p-4 bg-[var(--glass-shine)] rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[var(--text-main)] font-semibold">{t('settings.blockMode')}</h3>
                            <button
                                onClick={() => setSettings({ ...settings, blockOutOfRange: !settings.blockOutOfRange })}
                                className={`px-4 py-1 rounded-lg text-sm font-semibold transition-all ${settings.blockOutOfRange
                                    ? 'bg-red-500 text-white'
                                    : 'bg-yellow-500 text-black'
                                    }`}
                            >
                                {settings.blockOutOfRange ? 'BLOCK' : 'WARN'}
                            </button>
                        </div>
                        <p className="text-[var(--text-muted)] text-sm">
                            {settings.blockOutOfRange
                                ? `🚫 ${t('settings.blockDesc')}`
                                : `⚠️ ${t('settings.warnDesc')}`}
                        </p>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex items-center gap-4">
                    <Button
                        icon={<Save className="w-4 h-4" />}
                        onClick={handleSave}
                        isLoading={saving}
                        className="flex-1"
                    >
                        {t('common.save')}
                    </Button>
                </div>
                {/* Message */}
                {message && (
                    <div className={`mt-4 p-4 rounded-xl text-center font-semibold ${message.includes('✅') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                        {message}
                    </div>
                )}

                {/* Biometric Security Section */}
                <div className="mt-8 pt-8 border-t border-[var(--glass-border)]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500">
                            <Fingerprint className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--text-main)]">{t('settings.biometricTitle')}</h2>
                            <p className="text-[var(--text-muted)] text-sm">{t('settings.biometricDesc')}</p>
                        </div>
                    </div>

                    <div className="p-4 bg-[var(--glass-shine)] rounded-xl border border-[var(--glass-border)]">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="text-center md:text-left">
                                <h3 className="text-[var(--text-main)] font-semibold flex items-center gap-2 justify-center md:justify-start">
                                    {t('settings.biometricStatus')}
                                </h3>
                                <p className="text-[var(--text-muted)] text-sm">
                                    {t('settings.biometricRegisterDesc')}
                                </p>
                            </div>
                            <Button
                                variant="primary"
                                onClick={async () => {
                                    try {
                                        setSaving(true);
                                        await registerBiometric();
                                    } catch (err) {
                                        console.error(err);
                                        alert(t('settings.failedRegisterBiometric'));
                                    } finally {
                                        setSaving(false);
                                    }
                                }}
                                icon={<Fingerprint className="w-4 h-4" />}
                                className="w-full md:w-auto"
                            >
                                {t('settings.activateFingerprint')}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <h4 className="text-blue-400 font-semibold mb-2">ℹ️ {t('settings.info')}</h4>
                    <ul className="text-[var(--text-muted)] text-sm space-y-1">
                        <li>• {t('settings.info1')}</li>
                        <li>• {t('settings.info2')}</li>
                        <li>• {t('settings.info3')}</li>
                    </ul>
                </div>
            </GlassCard>
        </MainLayout >
    );
};

export default Settings;
