import React, { useEffect, useState } from 'react';
import GlassCard from '../UI/GlassCard';
import api from '../../services/api';
import { TrendingUp, AlertTriangle, Star, UserX, RefreshCw } from 'lucide-react';

interface Insight {
    type: string;
    severity: 'info' | 'warning' | 'critical';
    title: string;
    description: string;
    employeeId?: string;
    employeeName?: string;
    department?: string;
    actionRequired: boolean;
    metadata?: any;
}

interface InsightsData {
    insights: Insight[];
    summary: {
        total: number;
        critical: number;
        warning: number;
        info: number;
    };
    generatedAt: string;
}

const SmartInsights: React.FC = () => {
    const [data, setData] = useState<InsightsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    const fetchInsights = async () => {
        try {
            const res = await api.get('/analytics/insights');
            setData(res.data);
        } catch (error) {
            console.error('Error fetching insights:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInsights();
        // Auto-refresh every 5 minutes
        const interval = setInterval(fetchInsights, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/50';
            case 'warning': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
            case 'info': return 'text-blue-400 bg-blue-500/20 border-blue-500/50';
            default: return 'text-gray-400 bg-gray-500/20 border-gray-500/50';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'late_pattern': return <AlertTriangle className="w-4 h-4" />;
            case 'absence_trend': return <TrendingUp className="w-4 h-4" />;
            case 'performance_star': return <Star className="w-4 h-4" />;
            case 'risk_employee': return <UserX className="w-4 h-4" />;
            default: return <TrendingUp className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <GlassCard>
                <div className="flex items-center justify-center h-32">
                    <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                </div>
            </GlassCard>
        );
    }

    if (!data || data.insights.length === 0) {
        return (
            <GlassCard>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500">
                        <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Smart Insights</h3>
                        <p className="text-xs text-gray-400">AI-Powered Analytics</p>
                    </div>
                </div>
                <p className="text-gray-400 text-sm text-center py-4">
                    ✅ Semua berjalan lancar! Tidak ada insight yang perlu perhatian.
                </p>
            </GlassCard>
        );
    }

    const displayedInsights = expanded ? data.insights : data.insights.slice(0, 3);

    return (
        <GlassCard>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500">
                        <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Smart Insights</h3>
                        <p className="text-xs text-gray-400">AI-Powered Analytics • 30 Hari Terakhir</p>
                    </div>
                </div>

                {/* Summary Badges */}
                <div className="flex gap-2">
                    {data.summary.critical > 0 && (
                        <span className="px-2 py-1 text-xs font-bold bg-red-500/20 text-red-400 rounded-lg border border-red-500/50">
                            {data.summary.critical} 🔴
                        </span>
                    )}
                    {data.summary.warning > 0 && (
                        <span className="px-2 py-1 text-xs font-bold bg-yellow-500/20 text-yellow-400 rounded-lg border border-yellow-500/50">
                            {data.summary.warning} 🟡
                        </span>
                    )}
                    {data.summary.info > 0 && (
                        <span className="px-2 py-1 text-xs font-bold bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/50">
                            {data.summary.info} 🔵
                        </span>
                    )}
                </div>
            </div>

            {/* Insights List */}
            <div className="space-y-3">
                {displayedInsights.map((insight, idx) => (
                    <div
                        key={idx}
                        className={`p-3 rounded-xl border-2 ${getSeverityColor(insight.severity)}`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                                {getTypeIcon(insight.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm mb-1">
                                    {insight.title}
                                </h4>
                                <p className="text-xs opacity-80 leading-relaxed">
                                    {insight.description}
                                </p>
                                {insight.actionRequired && (
                                    <div className="mt-2 text-xs font-semibold opacity-90">
                                        ⚡ Tindak lanjut diperlukan
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Show More/Less */}
            {data.insights.length > 3 && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="mt-4 w-full py-2 text-sm font-semibold text-primary hover:text-white transition-colors"
                >
                    {expanded ? '↑ Tampilkan Lebih Sedikit' : `↓ Lihat ${data.insights.length - 3} Insight Lainnya`}
                </button>
            )}

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-white/10 text-xs text-gray-400 text-center">
                Terakhir diperbarui: {new Date(data.generatedAt).toLocaleString('id-ID')}
            </div>
        </GlassCard>
    );
};

export default SmartInsights;
