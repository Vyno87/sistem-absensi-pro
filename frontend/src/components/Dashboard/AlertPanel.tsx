import React, { useEffect, useState } from 'react';
import GlassCard from '../UI/GlassCard';
import api from '../../services/api';
import { AlertTriangle, X, Clock, User } from 'lucide-react';

interface Alert {
    _id: string;
    employeeId: string;
    employeeName: string;
    position: string;
    expectedTime: string;
    alertTime: string;
    status: string;
}

const AlertPanel: React.FC = () => {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAlerts = async () => {
        try {
            const res = await api.get('/alerts');
            setAlerts(res.data);
        } catch (error) {
            console.error('Error fetching alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    const dismissAlert = async (id: string) => {
        try {
            await api.post(`/alerts/${id}/dismiss`);
            setAlerts(alerts.filter(a => a._id !== id));
        } catch (error) {
            console.error('Error dismissing alert:', error);
        }
    };

    useEffect(() => {
        fetchAlerts();
        // Auto-refresh every 1 minute
        const interval = setInterval(fetchAlerts, 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return null; // Don't show anything while loading
    }

    if (alerts.length === 0) {
        return null; // Don't show panel if no alerts
    }

    return (
        <GlassCard className="border-2 border-red-500/50 bg-red-500/5">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-red-500/30">
                <div className="p-2 rounded-lg bg-red-500/20 animate-pulse">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-red-400">Late Alerts</h3>
                    <p className="text-xs text-gray-400">{alerts.length} Key Employee{alerts.length > 1 ? 's' : ''} Belum Hadir</p>
                </div>
                <div className="px-3 py-1 bg-red-500/20 text-red-400 font-bold text-sm rounded-lg border border-red-500/50">
                    🔔 {alerts.length}
                </div>
            </div>

            {/* Alerts List */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                {alerts.map((alert) => (
                    <div
                        key={alert._id}
                        className="p-3 rounded-xl bg-white/5 border border-red-500/30 hover:border-red-500/50 transition-colors"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                {/* Employee Info */}
                                <div className="flex items-center gap-2 mb-2">
                                    <User className="w-4 h-4 text-red-400 flex-shrink-0" />
                                    <h4 className="font-semibold text-white truncate">
                                        {alert.employeeName}
                                    </h4>
                                </div>
                                <p className="text-xs text-gray-400 mb-1">
                                    📌 {alert.position} • ID: {alert.employeeId}
                                </p>

                                {/* Time Info */}
                                <div className="flex items-center gap-2 text-xs text-yellow-400">
                                    <Clock className="w-3 h-3" />
                                    <span>
                                        Expected: {alert.expectedTime} | Alert: {new Date(alert.alertTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>

                            {/* Dismiss Button */}
                            <button
                                onClick={() => dismissAlert(alert._id)}
                                className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                                title="Dismiss Alert"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Info */}
            <div className="mt-4 pt-3 border-t border-red-500/30 text-xs text-center text-gray-400">
                💡 Alerts auto-refresh setiap 1 menit • Tandai key employees di halaman Employees
            </div>
        </GlassCard>
    );
};

export default AlertPanel;
