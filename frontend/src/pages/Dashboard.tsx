import React, { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import GlassCard from '../components/UI/GlassCard';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    UserCheck,
    TrendingUp,
    Award,
    CalendarCheck,
    Calendar,
    Clock,
    MapPin,
    BarChart3,
    User
} from 'lucide-react';
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
import LiveMap from '../components/Dashboard/LiveMap';

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
    const [recentActivity, setRecentActivity] = useState([]);
    const [enableGPS, setEnableGPS] = useState(() => {
        // Load GPS setting from localStorage
        const saved = localStorage.getItem('gpsEnabled');
        return saved !== null ? saved === 'true' : true;
    });

    // Save GPS setting to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('gpsEnabled', enableGPS.toString());
    }, [enableGPS]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/dashboard/stats');
                setStats(res.data);
            } catch (error) {
                console.error("Error fetching stats", error);
            } finally {
                // setLoading(false); // Moved to the if/else block
            }
        };

        const fetchRecent = async () => {
            try {
                const res = await api.get('/attendance'); // Reuse user API for recent list
                setRecentActivity(res.data);
            } catch (error) {
                console.error("Error fetching recent", error);
            }
        };

        if (user?.role === 'admin') {
            fetchStats();
            fetchRecent();

            // Real-time polling setiap 2 detik
            const interval = setInterval(() => {
                fetchStats();
                fetchRecent();
            }, 2000);
            setLoading(false); // Set loading to false after initial fetch for admin
            return () => clearInterval(interval);
        } else {
            setLoading(false); // Set loading to false immediately for non-admin users
        }
    }, [user]);

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
                label: t('dashboard.attendanceTrend'),
                data: stats?.weeklyAttendance || [],
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.5)',
                tension: 0.4,
            },
        ],
    };

    const doughnutData = {
        labels: [t('dashboard.present'), t('dashboard.late'), t('dashboard.absent')],
        datasets: [
            {
                data: [stats?.todayStats?.present || 0, stats?.todayStats?.late || 0, stats?.todayStats?.absent || 0],
                backgroundColor: ['#4ade80', '#facc15', '#f87171'],
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
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            {user?.role === 'admin' ? t('dashboard.overview') : `${t('dashboard.welcome')}, ${user?.username}`}
                        </h1>
                        <p className="text-gray-400">
                            {user?.role === 'admin' ? t('dashboard.monitoring') : t('dashboard.userSubtitle')}
                        </p>
                    </div>

                    {/* GPS Control Toggle (Admin Only) */}
                    {user?.role === 'admin' && (
                        <div className="flex items-center space-x-3 bg-white/5 px-4 py-3 rounded-lg border border-white/10">
                            <MapPin className={`w-5 h-5 ${enableGPS ? 'text-green-400' : 'text-gray-500'}`} />
                            <div className="flex flex-col">
                                <span className="text-white text-sm font-medium">GPS Enforcement</span>
                                <span className="text-gray-400 text-xs">{enableGPS ? 'Active' : 'Disabled'}</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={enableGPS}
                                    onChange={(e) => setEnableGPS(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                        </div>
                    )}
                </div>
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

                        {/* Live Map Section */}
                        <div className="lg:col-span-3">
                            <LiveMap />
                        </div>

                        <div className="space-y-8">
                            {/* Employee Status Chart */}
                            <GlassCard>
                                <h3 className="text-xl font-bold text-white mb-6">{t('dashboard.employeeStatus')}</h3>
                                <div className="h-[200px] flex justify-center">
                                    <Doughnut data={doughnutData} options={{
                                        plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } }
                                    }} />
                                </div>
                            </GlassCard>

                            {/* Recent Activity Feed (Live) */}
                            <GlassCard>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-blue-400" />
                                        Recent Activity (Live)
                                    </h3>
                                    <span className="animate-pulse w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
                                </div>
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {recentActivity.length === 0 ? (
                                        <div className="text-gray-400 text-center py-4">{t('common.noData')}</div>
                                    ) : (
                                        recentActivity.map((record: any, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/5">
                                                <div className="flex items-center space-x-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${record.status === 'late' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white text-sm">{record.employeeName || 'Unknown'}</p>
                                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">{record.position || 'Employee'}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-mono font-bold text-sm ${record.status === 'late' ? 'text-yellow-400' : 'text-green-400'}`}>
                                                        {new Date(record.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                    </p>
                                                    <p className="text-[10px] text-blue-300 font-medium capitalize">
                                                        {record.type || 'Check In'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </GlassCard>
                        </div>
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

