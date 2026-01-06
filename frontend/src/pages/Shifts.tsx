import React, { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import GlassCard from '../components/UI/GlassCard';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Modal from '../components/UI/Modal';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { Clock, Plus, Edit, Trash2 } from 'lucide-react';

interface Shift {
    _id: string;
    name: string;
    startTime: string;
    endTime: string;
    description?: string;
    isActive: boolean;
}

const Shifts = () => {
    const { t } = useLanguage();
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        startTime: '',
        endTime: '',
        description: ''
    });
    const [formLoading, setFormLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        fetchShifts();
    }, []);

    const fetchShifts = async () => {
        try {
            const res = await api.get('/shifts');
            setShifts(res.data);
        } catch (error) {
            console.error('Error fetching shifts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            if (editingId) {
                await api.put(`/shifts/${editingId}`, formData);
            } else {
                await api.post('/shifts', formData);
            }

            setFormData({ name: '', startTime: '', endTime: '', description: '' });
            setIsModalOpen(false);
            setEditingId(null);
            fetchShifts();
        } catch (error: any) {
            setErrorMsg(error.response?.data?.msg || t('shifts.failedSave'));
        } finally {
            setFormLoading(false);
        }
    };

    const handleEdit = (shift: Shift) => {
        setFormData({
            name: shift.name,
            startTime: shift.startTime,
            endTime: shift.endTime,
            description: shift.description || ''
        });
        setEditingId(shift._id);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        setDeleteId(id);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/shifts/${deleteId}`);
            setDeleteId(null);
            fetchShifts();
        } catch (error: any) {
            setDeleteId(null);
            setErrorMsg(error.response?.data?.msg || t('shifts.failedDelete'));
        }
    };

    return (
        <MainLayout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{t('shifts.title')}</h1>
                    <p className="text-gray-400">{t('shifts.subtitle')}</p>
                </div>
                <Button
                    onClick={() => {
                        setFormData({ name: '', startTime: '', endTime: '', description: '' });
                        setEditingId(null);
                        setIsModalOpen(true);
                    }}
                    icon={<Plus className="w-4 h-4" />}
                >
                    {t('shifts.addShift')}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <p className="text-white">{t('common.loading')}</p>
                ) : shifts.length === 0 ? (
                    <p className="text-gray-400">{t('shifts.noShifts')}</p>
                ) : (
                    shifts.map((shift) => (
                        <GlassCard key={shift._id} className="relative">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-indigo-500/20 rounded-xl">
                                    <Clock className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">{shift.name}</h3>
                                    <p className="text-sm text-gray-400">{shift.description || t('shifts.noDescription')}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between bg-white/5 rounded-xl p-4 mb-4">
                                <div className="text-center">
                                    <p className="text-xs text-gray-400">{t('shifts.start')}</p>
                                    <p className="text-xl font-bold text-green-400">{shift.startTime}</p>
                                </div>
                                <div className="text-gray-500">→</div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-400">{t('shifts.end')}</p>
                                    <p className="text-xl font-bold text-red-400">{shift.endTime}</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    onClick={() => handleEdit(shift)}
                                    variant="secondary"
                                    icon={<Edit className="w-4 h-4" />}
                                    className="flex-1"
                                >
                                    {t('common.edit')}
                                </Button>
                                <Button
                                    onClick={() => handleDelete(shift._id)}
                                    variant="secondary"
                                    icon={<Trash2 className="w-4 h-4" />}
                                    className="flex-1 hover:bg-red-500/20 hover:text-red-400"
                                >
                                    {t('common.delete')}
                                </Button>
                            </div>
                        </GlassCard>
                    ))
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? t('shifts.editShift') : t('shifts.addNewShift')}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        placeholder={t('shifts.shiftName')}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <Input
                        type="time"
                        placeholder={t('shifts.startTime')}
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        required
                    />
                    <Input
                        type="time"
                        placeholder={t('shifts.endTime')}
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        required
                    />
                    <Input
                        placeholder={t('shifts.description')}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                    <Button type="submit" isLoading={formLoading} className="w-full">
                        {editingId ? t('shifts.updateShift') : t('shifts.addShift')}
                    </Button>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title={t('shifts.confirmDelete')}>
                <div className="p-4">
                    <p className="text-gray-300 mb-6">Apakah Anda yakin ingin menghapus shift ini?</p>
                    <div className="flex gap-3">
                        <Button onClick={executeDelete} className="flex-1 bg-red-500 hover:bg-red-600 border-none">
                            {t('common.delete')}
                        </Button>
                        <Button onClick={() => setDeleteId(null)} variant="secondary" className="flex-1">
                            {t('common.cancel')}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Error Modal */}
            <Modal isOpen={!!errorMsg} onClose={() => setErrorMsg('')} title="Gagal">
                <div className="text-center p-4">
                    <p className="text-gray-300 mb-6">{errorMsg}</p>
                    <Button onClick={() => setErrorMsg('')} className="w-full">
                        Tutup
                    </Button>
                </div>
            </Modal>
        </MainLayout>
    );
};

export default Shifts;

