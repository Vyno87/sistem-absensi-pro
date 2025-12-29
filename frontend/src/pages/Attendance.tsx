import React, { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import GlassCard from '../components/UI/GlassCard';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import api from '../services/api';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

const Attendance = () => {
    const [employeeId, setEmployeeId] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleAttendance = async (type: 'Check In' | 'Check Out') => {
        if (!employeeId) return setMessage({ type: 'error', text: 'Please enter Employee ID' });

        setLoading(true);
        setMessage(null);
        try {
            await api.post('/attendance', {
                employeeId,
                type: type === 'Check In' ? 'PRESENT' : 'OUT', // Mapping to likely backend enum if needed, or just string
                timestamp: new Date()
            });
            setMessage({ type: 'success', text: `Successfully Record: ${type}` });
            setEmployeeId('');
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Attendance failed' });
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
                            {currentTime.toLocaleTimeString()}
                        </h2>
                        <p className="text-xl text-gray-400">{currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>

                    <GlassCard className="p-10 border-indigo-500/30">
                        <h3 className="text-2xl font-bold text-white mb-6 text-center">Record Attendance</h3>

                        <div className="space-y-6">
                            <Input
                                placeholder="Enter Your Employee ID"
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
                                    CHECK IN
                                </Button>
                                <Button
                                    onClick={() => handleAttendance('Check Out')}
                                    variant="secondary"
                                    isLoading={loading}
                                    className="w-full"
                                >
                                    CHECK OUT
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
                    <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                        ID
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">Employee {100 + i}</p>
                                        <p className="text-xs text-gray-400">Software Engineer</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-green-400 font-bold">08:00 AM</p>
                                    <p className="text-xs text-gray-400">On Time</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>
        </MainLayout>
    );
};

export default Attendance;
