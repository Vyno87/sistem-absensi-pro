import React, { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import GlassCard from '../components/UI/GlassCard';
import api from '../services/api';
import { UserPlus, Search, MoreVertical } from 'lucide-react';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';

const Employees = () => {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await api.get('/employees');
                setEmployees(res.data);
            } catch (error) {
                console.error("Fetch Error", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEmployees();
    }, []);

    return (
        <MainLayout>
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Employee Management</h1>
                    <p className="text-gray-400">Manage your workforce efficiently.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <Input placeholder="Search employee..." icon={<Search className="w-4 h-4" />} className="md:w-64" />
                    <Button icon={<UserPlus className="w-4 h-4" />}>Add New</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                    <p className="text-white">Loading...</p>
                ) : (
                    employees.map((emp) => (
                        <GlassCard key={emp._id} className="group relative hover:border-indigo-500/50">
                            <div className="absolute top-4 right-4 text-gray-400 cursor-pointer hover:text-white">
                                <MoreVertical size={20} />
                            </div>

                            <div className="flex flex-col items-center text-center pt-4">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[2px] mb-4">
                                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                                        <span className="text-2xl font-bold text-white">{emp.name.charAt(0)}</span>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-white mb-1">{emp.name}</h3>
                                <p className="text-primary text-sm mb-4">{emp.position}</p>

                                <div className="w-full bg-white/5 rounded-xl p-3 flex justify-between items-center text-sm">
                                    <div className="text-gray-400">ID: <span className="text-white font-mono">{emp.employeeId}</span></div>
                                    <div className={`px-2 py-1 rounded text-xs font-bold ${emp.status === 'Tetap' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                        {emp.status}
                                    </div>
                                </div>

                                <div className="mt-4 w-full grid grid-cols-2 gap-2 text-center text-xs">
                                    <div className="p-2 rounded bg-white/5">
                                        <p className="text-gray-400">Present</p>
                                        <p className="text-white font-bold text-lg">{emp.attendanceCount?.present || 0}</p>
                                    </div>
                                    <div className="p-2 rounded bg-white/5">
                                        <p className="text-gray-400">Performance</p>
                                        <p className="text-white font-bold text-lg">{emp.performanceScore || 0}%</p>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    ))
                )}
            </div>
        </MainLayout>
    );
};

export default Employees;
