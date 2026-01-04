import React, { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import GlassCard from '../components/UI/GlassCard';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, TrendingUp, Award, CalendarCheck, Calendar } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const Dashboard = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/dashboard/stats');
                setStats(res.data);
            } catch (error) {
                console.error("Error fetching stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
        // Real-time polling setiap 2 detik
        const interval = setInterval(fetchStats, 2000);
        return () => clearInterval(interval);
    }, []);

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                labels: { color: '#94a3b8' },
            },
        },
        scales: {
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#94a3b8' },
            },
            x: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#94a3b8' },
            },
        },
    };

    const lineData = {
        labels: [t('days.mon'), t('days.tue'), t('days.wed'), t('days.thu'), t('days.fri'), t('days.sat'), t('days.sun')],
        datasets: [
            {
                label: t('dashboard.attendanceRate'),
                data: [85, 88, 92, 90, 85, 95, 98],
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.5)',
                tension: 0.4,
            },
        ],
    };

    const doughnutData = {
        labels: stats?.employeesByStatus?.map((s: any) => s._id) || [t('common.active'), t('common.inactive')],
        datasets: [
            {
                data: stats?.employeesByStatus?.map((s: any) => s.count) || [10, 5],
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(234, 179, 8, 0.8)',
                ],
                borderColor: 'transparent',
            },
        ],
    };

    if (loading) return (
        <MainLayout>
            <div className="flex items-center justify-center h-full text-white">{t('common.loadingDashboard')}</div>
        </MainLayout>
    );

    return (
        <MainLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                    {user?.role === 'admin' ? t('dashboard.overview') : `${t('dashboard.welcome')}, ${user?.username}`}
                </h1>
                <p className="text-gray-400">
                    {user?.role === 'admin' ? t('dashboard.monitoring') : t('dashboard.userSubtitle')}
                </p>
            </div>

            {user?.role === 'admin' ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[
                            { label: t('dashboard.totalEmployees'), value: stats?.totalEmployees || 0, icon: <Users className="text-blue-400" />, color: 'from-blue-500/20 to-blue-600/5' },
                            { label: t('dashboard.avgPerformance'), value: `${stats?.averagePerformance || 0}%`, icon: <TrendingUp className="text-green-400" />, color: 'from-green-500/20 to-green-600/5' },
                            { label: t('dashboard.promotionReady'), value: stats?.promotionRecommended || 0, icon: <Award className="text-yellow-400" />, color: 'from-yellow-500/20 to-yellow-600/5' },
                            { label: t('dashboard.activeStatus'), value: stats?.employeesByStatus?.length || 0, icon: <UserCheck className="text-purple-400" />, color: 'from-purple-500/20 to-purple-600/5' },
                        ].map((stat, idx) => (
                            <GlassCard key={idx} className={`relative overflow-hidden bg-gradient-to-br ${stat.color} border-white/5 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] transition-all cursor-default group`}>
                                <div className="flex justify-between items-start z-10 relative">
                                    <div>
                                        <p className="text-gray-400 text-sm font-medium mb-1">{stat.label}</p>
                                        <h3 className="text-3xl font-bold text-white group-hover:text-primary transition-colors">{stat.value}</h3>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-xl backdrop-blur-md group-hover:bg-primary/20 transition-all">
                                        {stat.icon}
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <GlassCard className="lg:col-span-2">
                            <h3 className="text-xl font-bold text-white mb-6">{t('dashboard.weeklyAttendance')}</h3>
                            <div className="h-[300px] w-full">
                                <Line options={chartOptions} data={lineData} />
                            </div>
                        </GlassCard>

                        <GlassCard>
                            <h3 className="text-xl font-bold text-white mb-6">{t('dashboard.employeeStatus')}</h3>
                            <div className="h-[300px] flex items-center justify-center">
                                <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#cbd5e1' } } } }} />
                            </div>
                        </GlassCard>
                    </div>
                </>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <GlassCard className="flex flex-col items-center justify-center p-12 text-center h-[300px]">
                        <div className="p-4 bg-primary/20 rounded-full mb-6 text-primary">
                            <CalendarCheck size={48} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">{t('dashboard.readyCheckIn')}</h2>
                        <p className="text-gray-400 mb-6">{t('dashboard.markAttendance')}</p>
                        <button
                            onClick={() => navigate('/attendance')}
                            className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:scale-105 transition-all"
                        >
                            {t('dashboard.goToAttendance')}
                        </button>
                    </GlassCard>

                    <GlassCard className="flex flex-col items-center justify-center p-12 text-center h-[300px]">
                        <div className="p-4 bg-green-500/20 rounded-full mb-6 text-green-400">
                            <Calendar size={48} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">{t('dashboard.needLeave')}</h2>
                        <p className="text-gray-400 mb-6">{t('dashboard.submitLeave')}</p>
                        <button
                            onClick={() => navigate('/leaves')}
                            className="px-8 py-3 bg-green-500 text-white rounded-xl font-bold shadow-lg shadow-green-500/30 hover:scale-105 transition-all"
                        >
                            {t('dashboard.requestLeave')}
                        </button>
                    </GlassCard>
                </div>
            )}
        </MainLayout>
    );
};

export default Dashboard;

