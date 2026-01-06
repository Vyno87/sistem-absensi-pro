import React, { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import GlassCard from '../components/UI/GlassCard';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { UserPlus, Search, Trash2 } from 'lucide-react';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Modal from '../components/UI/Modal';

const Employees = () => {
    const { t } = useLanguage();
    const [employees, setEmployees] = useState<any[]>([]);
    const [shifts, setShifts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        employeeId: '',
        name: '',
        position: '',
        email: '',
        phone: '',
        department: '',
        salary: '',
        status: 'Harian Lepas',
        shiftId: '',
        fingerprintId: '',
        isKeyPerson: false
    });
    const [formLoading, setFormLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        fetchEmployees();
        fetchShifts();
    }, []);

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

    const fetchShifts = async () => {
        try {
            const res = await api.get('/shifts');
            setShifts(res.data);
        } catch (error) {
            console.error("Fetch Shift Error", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            // Prepare payload clean from empty strings
            const payload: any = {
                ...formData,
                salary: parseFloat(formData.salary) || 0,
                joinDate: new Date(),
                performanceScore: 0,
                attendanceCount: { present: 0, absent: 0, late: 0 }
            };

            // Remove empty optional fields to avoid CastErrors in backend
            if (!payload.shiftId) delete payload.shiftId;
            if (!payload.fingerprintId) delete payload.fingerprintId;

            await api.post('/employees', payload);

            // Reset form and close modal
            setFormData({
                employeeId: '',
                name: '',
                position: '',
                email: '',
                phone: '',
                department: '',
                salary: '',
                status: 'Harian Lepas',
                shiftId: '',
                fingerprintId: ''
            });
            setIsModalOpen(false);

            // Refresh employee list
            fetchEmployees();
        } catch (error: any) {
            setErrorMsg(error.response?.data?.msg || t('employees.failedToAdd'));
        } finally {
            setFormLoading(false);
        }
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/employees/${deleteId}`);
            setDeleteId(null);
            fetchEmployees();
        } catch (error: any) {
            setDeleteId(null);
            setErrorMsg(error.response?.data?.msg || t('employees.failedDelete'));
        }
    };

    // Filter employees based on search query (name or ID)
    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <MainLayout>
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{t('employees.title')}</h1>
                    <p className="text-gray-400">{t('employees.subtitle')}</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <Input
                        placeholder={t('employees.search')}
                        icon={<Search className="w-4 h-4" />}
                        className="md:w-64"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button icon={<UserPlus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>{t('employees.addNew')}</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                    <p className="text-white">{t('common.loading')}</p>
                ) : filteredEmployees.length === 0 ? (
                    <p className="text-gray-400 col-span-full text-center py-8">{searchQuery ? t('employees.noResults') : t('common.noData')}</p>
                ) : (
                    filteredEmployees.map((emp) => (
                        <GlassCard key={emp._id} className="group relative hover:border-indigo-500/50">
                            <div className="absolute top-4 right-4 text-gray-400 cursor-pointer hover:text-red-400 transition-colors" onClick={() => setDeleteId(emp._id)}>
                                <Trash2 size={20} />
                            </div>

                            <div className="flex flex-col items-center text-center pt-4">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[2px] mb-4">
                                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                                        <span className="text-2xl font-bold text-white">{emp.name.charAt(0)}</span>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-white mb-1">{emp.name}</h3>
                                <p className="text-primary text-sm mb-4">{emp.position}</p>

                                <div className="w-full bg-white/5 rounded-xl p-3 flex justify-between items-center text-sm mb-2">
                                    <div className="text-gray-400">ID: <span className="text-white font-mono">{emp.employeeId}</span></div>
                                    <div className={`px-2 py-1 rounded text-xs font-bold ${emp.status === 'Tetap' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                        {emp.status === 'Tetap' ? t('employees.permanent') : t('employees.contract')}
                                    </div>
                                </div>

                                {emp.shiftId && (
                                    <div className="w-full bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-2 text-xs text-indigo-300">
                                        Shift: {emp.shiftId.name} ({emp.shiftId.startTime} - {emp.shiftId.endTime})
                                    </div>
                                )}

                                {emp.isKeyPerson && (
                                    <div className="w-full bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-2 text-xs text-yellow-400 font-semibold flex items-center justify-center gap-1">
                                        ⭐ Key Person - Late Alerts Active
                                    </div>
                                )}

                                <div className="mt-4 w-full grid grid-cols-2 gap-2 text-center text-xs">
                                    <div className="p-2 rounded bg-white/5">
                                        <p className="text-gray-400">{t('employees.present')}</p>
                                        <p className="text-white font-bold text-lg">{emp.attendanceCount?.present || 0}</p>
                                    </div>
                                    <div className="p-2 rounded bg-white/5">
                                        <p className="text-gray-400">{t('employees.performance')}</p>
                                        <p className="text-white font-bold text-lg">{emp.performanceScore || 0}%</p>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    ))
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('employees.addTitle')}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        placeholder="Employee ID (8 Digits)"
                        value={formData.employeeId}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, ''); // Numbers only
                            if (val.length <= 8) {
                                setFormData({ ...formData, employeeId: val });
                            }
                        }}
                        required
                    />
                    <Input
                        placeholder={t('employees.fullName')}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <Input
                        placeholder={t('employees.position')}
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        required
                    />
                    <Input
                        placeholder={t('employees.email')}
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                    <Input
                        placeholder={t('employees.phone')}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                    />
                    <select
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary focus:outline-none"
                        required
                    >
                        <option value="" className="bg-slate-800 text-gray-400">Select Department</option>
                        {['Warehouse', 'R & D', 'WWT-P', 'Sausage', 'Further', 'Cut-Up', 'Defeathering', 'Evis', 'P & GA', 'Engineering', 'QC'].map(dept => (
                            <option key={dept} value={dept} className="bg-slate-800">{dept}</option>
                        ))}
                    </select>

                    <Input
                        placeholder={t('employees.salary') + " (Optional)"}
                        type="number"
                        value={formData.salary}
                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    />
                    <Input
                        placeholder="Fingerprint ID (Optional)"
                        type="number"
                        value={formData.fingerprintId}
                        onChange={(e) => setFormData({ ...formData, fingerprintId: e.target.value })}
                    />

                    <select
                        value={formData.shiftId}
                        onChange={(e) => setFormData({ ...formData, shiftId: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary focus:outline-none"
                    >
                        <option value="" className="bg-slate-800 text-gray-400">Select Shift (Optional)</option>
                        {shifts.map(shift => (
                            <option key={shift._id} value={shift._id} className="bg-slate-800">
                                {shift.name} ({shift.startTime} - {shift.endTime})
                            </option>
                        ))}
                    </select>

                    <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary focus:outline-none"
                        required
                    >
                        <option value="Harian Lepas" className="bg-slate-800">{t('employees.dailyWorker')}</option>
                        <option value="Outsourcing" className="bg-slate-800">{t('employees.outsourcing')}</option>
                        <option value="Borongan" className="bg-slate-800">{t('employees.freelance')}</option>
                        <option value="Kontrak" className="bg-slate-800">{t('employees.contract')}</option>
                        <option value="Tetap" className="bg-slate-800">{t('employees.permanent')}</option>
                    </select>
                    <Button type="submit" isLoading={formLoading} className="w-full">
                        {t('employees.addEmployee')}
                    </Button>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title={t('employees.confirmDelete')}>
                <div className="p-4">
                    <p className="text-gray-300 mb-6">Apakah Anda yakin ingin menghapus karyawan ini? Data yang dihapus tidak dapat dikembalikan.</p>
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
        </MainLayout >
    );
};

export default Employees;

