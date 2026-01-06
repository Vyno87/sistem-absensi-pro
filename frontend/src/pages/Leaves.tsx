import React, { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import GlassCard from '../components/UI/GlassCard';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Modal from '../components/UI/Modal';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
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
    const { t } = useLanguage();
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
    const [errorMsg, setErrorMsg] = useState('');

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
            setErrorMsg(error.response?.data?.msg || t('leaves.failedSubmit'));
        } finally {
            setFormLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await api.put(`/leaves/${id}/approve`);
            fetchLeaves();
        } catch (error: any) {
            setErrorMsg(error.response?.data?.msg || t('leaves.failedApprove'));
        }
    };

    const handleReject = async (id: string) => {
        try {
            await api.put(`/leaves/${id}/reject`);
            fetchLeaves();
        } catch (error: any) {
            setErrorMsg(error.response?.data?.msg || t('leaves.failedReject'));
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-500/20 text-green-400';
            case 'rejected': return 'bg-red-500/20 text-red-400';
            default: return 'bg-yellow-500/20 text-yellow-400';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'approved': return t('leaves.approved');
            case 'rejected': return t('leaves.rejected');
            default: return t('leaves.pending');
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'annual': return t('leaves.annualLeave');
            case 'sick': return t('leaves.sickLeave');
            case 'personal': return t('leaves.personalLeave');
            case 'unpaid': return t('leaves.unpaidLeave');
            default: return type;
        }
    };

    return (
        <MainLayout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{t('leaves.title')}</h1>
                    <p className="text-gray-400">{t('leaves.subtitle')}</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
                    {t('leaves.requestLeave')}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <p className="text-white">{t('common.loading')}</p>
                ) : leaves.length === 0 ? (
                    <p className="text-gray-400">{t('leaves.noLeaves')}</p>
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
                                    {getStatusLabel(leave.status)}
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
                                        {t('leaves.approve')}
                                    </Button>
                                    <Button
                                        onClick={() => handleReject(leave._id)}
                                        icon={<X className="w-4 h-4" />}
                                        className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30"
                                    >
                                        {t('leaves.reject')}
                                    </Button>
                                </div>
                            )}
                        </GlassCard>
                    ))
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('leaves.requestLeave')}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        placeholder={t('leaves.employeeId')}
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
                        <option value="annual">{t('leaves.annualLeave')}</option>
                        <option value="sick">{t('leaves.sickLeave')}</option>
                        <option value="personal">{t('leaves.personalLeave')}</option>
                        <option value="unpaid">{t('leaves.unpaidLeave')}</option>
                    </select>
                    <Input
                        type="date"
                        placeholder={t('leaves.startDate')}
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        required
                    />
                    <Input
                        type="date"
                        placeholder={t('leaves.endDate')}
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        required
                    />
                    <textarea
                        placeholder={t('leaves.reason')}
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary focus:outline-none resize-none"
                        rows={3}
                        required
                    />
                    <Button type="submit" isLoading={formLoading} className="w-full">
                        {t('leaves.submitRequest')}
                    </Button>
                </form>
            </Modal>

            {/* Error Modal */}
            <Modal isOpen={!!errorMsg} onClose={() => setErrorMsg('')} title="Gagal">
                <div className="text-center p-4">
                    <p className="text-gray-300 mb-6">{errorMsg}</p>
                    <Button onClick={() => setErrorMsg('')} className="w-full">
                        Tutup
                    </Button>
                </div>
            </Modal >
        </MainLayout >
    );
};

export default Leaves;

