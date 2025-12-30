import React, { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import GlassCard from '../components/UI/GlassCard';
import api from '../services/api';
import { Users, UserCheck, TrendingUp, Award } from 'lucide-react';
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
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Attendance Rate',
                data: [85, 88, 92, 90, 85, 95, 98],
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.5)',
                tension: 0.4,
            },
        ],
    };

    const doughnutData = {
        labels: stats?.employeesByStatus?.map((s: any) => s._id) || ['Active', 'Inactive'],
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
            <div className="flex items-center justify-center h-full text-white">Loading Dashboard...</div>
        </MainLayout>
    );

    return (
        <MainLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
                <p className="text-gray-400">Real-time attendance monitoring</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'Total Employees', value: stats?.totalEmployees || 0, icon: <Users className="text-blue-400" />, color: 'from-blue-500/20 to-blue-600/5' },
                    { label: 'Avg Performance', value: `${stats?.averagePerformance || 0}%`, icon: <TrendingUp className="text-green-400" />, color: 'from-green-500/20 to-green-600/5' },
                    { label: 'Promotion Ready', value: stats?.promotionRecommended || 0, icon: <Award className="text-yellow-400" />, color: 'from-yellow-500/20 to-yellow-600/5' },
                    { label: 'Active Status', value: stats?.employeesByStatus?.length || 0, icon: <UserCheck className="text-purple-400" />, color: 'from-purple-500/20 to-purple-600/5' },
                ].map((stat, idx) => (
                    <GlassCard key={idx} className={`relative overflow-hidden bg-gradient-to-br ${stat.color} border-white/5`}>
                        <div className="flex justify-between items-start z-10 relative">
                            <div>
                                <p className="text-gray-400 text-sm font-medium mb-1">{stat.label}</p>
                                <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
                            </div>
                            <div className="p-3 bg-white/5 rounded-xl backdrop-blur-md">
                                {stat.icon}
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <GlassCard className="lg:col-span-2">
                    <h3 className="text-xl font-bold text-white mb-6">Weekly Attendance</h3>
                    <div className="h-[300px] w-full">
                        <Line options={chartOptions} data={lineData} />
                    </div>
                </GlassCard>

                <GlassCard>
                    <h3 className="text-xl font-bold text-white mb-6">Employee Status</h3>
                    <div className="h-[300px] flex items-center justify-center">
                        <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#cbd5e1' } } } }} />
                    </div>
                </GlassCard>
            </div>
        </MainLayout>
    );
};

export default Dashboard;
