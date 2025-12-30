import React, { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import GlassCard from '../components/UI/GlassCard';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Modal from '../components/UI/Modal';
import api from '../services/api';
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
            alert(error.response?.data?.msg || 'Failed to save shift');
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

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this shift?')) return;

        try {
            await api.delete(`/shifts/${id}`);
            fetchShifts();
        } catch (error: any) {
            alert(error.response?.data?.msg || 'Failed to delete shift');
        }
    };

    return (
        <MainLayout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Shift Management</h1>
                    <p className="text-gray-400">Manage employee work shifts</p>
                </div>
                <Button
                    onClick={() => {
                        setFormData({ name: '', startTime: '', endTime: '', description: '' });
                        setEditingId(null);
                        setIsModalOpen(true);
                    }}
                    icon={<Plus className="w-4 h-4" />}
                >
                    Add Shift
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <p className="text-white">Loading...</p>
                ) : shifts.length === 0 ? (
                    <p className="text-gray-400">No shifts created yet.</p>
                ) : (
                    shifts.map((shift) => (
                        <GlassCard key={shift._id} className="relative">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-indigo-500/20 rounded-xl">
                                    <Clock className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">{shift.name}</h3>
                                    <p className="text-sm text-gray-400">{shift.description || 'No description'}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between bg-white/5 rounded-xl p-4 mb-4">
                                <div className="text-center">
                                    <p className="text-xs text-gray-400">Start</p>
                                    <p className="text-xl font-bold text-green-400">{shift.startTime}</p>
                                </div>
                                <div className="text-gray-500">→</div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-400">End</p>
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
                                    Edit
                                </Button>
                                <Button
                                    onClick={() => handleDelete(shift._id)}
                                    variant="secondary"
                                    icon={<Trash2 className="w-4 h-4" />}
                                    className="flex-1 hover:bg-red-500/20 hover:text-red-400"
                                >
                                    Delete
                                </Button>
                            </div>
                        </GlassCard>
                    ))
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? 'Edit Shift' : 'Add New Shift'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        placeholder="Shift Name (e.g., Morning Shift)"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <Input
                        type="time"
                        placeholder="Start Time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        required
                    />
                    <Input
                        type="time"
                        placeholder="End Time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        required
                    />
                    <Input
                        placeholder="Description (optional)"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                    <Button type="submit" isLoading={formLoading} className="w-full">
                        {editingId ? 'Update Shift' : 'Add Shift'}
                    </Button>
                </form>
            </Modal>
        </MainLayout>
    );
};

export default Shifts;
