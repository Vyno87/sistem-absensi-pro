import React, { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import GlassCard from '../components/UI/GlassCard';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Modal from '../components/UI/Modal';
import api from '../services/api';
import { Calendar, Plus, Check, X, Clock } from 'lucide-react';

interface Leave {
    _id: string;
    employeeId: string;
    type: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    approvalNotes?: string;
    createdAt: string;
}

const Leaves = () => {
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        employeeId: '',
        type: 'annual',
        startDate: '',
        endDate: '',
        reason: ''
    });
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            const res = await api.get('/leaves');
            setLeaves(res.data);
        } catch (error) {
            console.error('Error fetching leaves:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            await api.post('/leaves', formData);
            setFormData({ employeeId: '', type: 'annual', startDate: '', endDate: '', reason: '' });
            setIsModalOpen(false);
            fetchLeaves();
        } catch (error: any) {
            alert(error.response?.data?.msg || 'Failed to submit leave request');
        } finally {
            setFormLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await api.put(`/leaves/${id}/approve`);
            fetchLeaves();
        } catch (error: any) {
            alert(error.response?.data?.msg || 'Failed to approve');
        }
    };

    const handleReject = async (id: string) => {
        try {
            await api.put(`/leaves/${id}/reject`);
            fetchLeaves();
        } catch (error: any) {
            alert(error.response?.data?.msg || 'Failed to reject');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-500/20 text-green-400';
            case 'rejected': return 'bg-red-500/20 text-red-400';
            default: return 'bg-yellow-500/20 text-yellow-400';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'annual': return 'Annual Leave';
            case 'sick': return 'Sick Leave';
            case 'personal': return 'Personal Leave';
            case 'unpaid': return 'Unpaid Leave';
            default: return type;
        }
    };

    return (
        <MainLayout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Leave Management</h1>
                    <p className="text-gray-400">Request and manage employee leaves</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
                    Request Leave
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <p className="text-white">Loading...</p>
                ) : leaves.length === 0 ? (
                    <p className="text-gray-400">No leave requests yet.</p>
                ) : (
                    leaves.map((leave) => (
                        <GlassCard key={leave._id}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-purple-500/20 rounded-xl">
                                        <Calendar className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">{leave.employeeId}</h3>
                                        <p className="text-sm text-gray-400">{getTypeLabel(leave.type)}</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(leave.status)}`}>
                                    {leave.status.toUpperCase()}
                                </span>
                            </div>

                            <div className="bg-white/5 rounded-xl p-4 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                                    <Clock className="w-4 h-4" />
                                    <span>{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</span>
                                </div>
                                <p className="text-white text-sm">{leave.reason}</p>
                            </div>

                            {leave.status === 'pending' && (
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleApprove(leave._id)}
                                        icon={<Check className="w-4 h-4" />}
                                        className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/30"
                                    >
                                        Approve
                                    </Button>
                                    <Button
                                        onClick={() => handleReject(leave._id)}
                                        icon={<X className="w-4 h-4" />}
                                        className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30"
                                    >
                                        Reject
                                    </Button>
                                </div>
                            )}
                        </GlassCard>
                    ))
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Request Leave">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        placeholder="Employee ID"
                        value={formData.employeeId}
                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                        required
                    />
                    <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary focus:outline-none"
                        required
                    >
                        <option value="annual">Annual Leave</option>
                        <option value="sick">Sick Leave</option>
                        <option value="personal">Personal Leave</option>
                        <option value="unpaid">Unpaid Leave</option>
                    </select>
                    <Input
                        type="date"
                        placeholder="Start Date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        required
                    />
                    <Input
                        type="date"
                        placeholder="End Date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        required
                    />
                    <textarea
                        placeholder="Reason for leave"
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary focus:outline-none resize-none"
                        rows={3}
                        required
                    />
                    <Button type="submit" isLoading={formLoading} className="w-full">
                        Submit Request
                    </Button>
                </form>
            </Modal>
        </MainLayout>
    );
};

export default Leaves;
