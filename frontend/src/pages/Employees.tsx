import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';
import GlassCard from '../components/UI/GlassCard';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { UserPlus, Search, Trash2, Shield, Smartphone, HardDrive, Camera, Upload, ArrowLeft } from 'lucide-react';
import Webcam from 'react-webcam';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Modal from '../components/UI/Modal';

const Employees = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
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
        profilePhoto: '',
        isKeyPerson: false
    });
    const [showCamera, setShowCamera] = useState(false);
    const webcamRef = React.useRef<any>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [selectedDeviceEmp, setSelectedDeviceEmp] = useState<any | null>(null);
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
                fingerprintId: '',
                profilePhoto: '',
                isKeyPerson: false
            });
            setIsModalOpen(false);
            setShowCamera(false);

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

    const handleToggleDeviceLock = async () => {
        if (!selectedDeviceEmp) return;
        try {
            const res = await api.put(`/employees/${selectedDeviceEmp._id}/device-lock`);
            setSelectedDeviceEmp({ ...selectedDeviceEmp, deviceLockEnabled: res.data.enabled });
            fetchEmployees();
        } catch (error: any) {
            setErrorMsg(error.response?.data?.msg || 'Gagal mengubah pengaturan kunci perangkat');
        }
    };

    const handleClearDevices = async () => {
        if (!selectedDeviceEmp) return;
        if (!window.confirm('Hapus semua perangkat terdaftar? Karyawan harus mendaftarkan ulang saat absen berikutnya.')) return;

        try {
            await api.delete(`/employees/${selectedDeviceEmp._id}/devices`);
            setSelectedDeviceEmp({ ...selectedDeviceEmp, registeredDevices: [] });
            fetchEmployees();
        } catch (error: any) {
            setErrorMsg(error.response?.data?.msg || 'Gagal menghapus daftar perangkat');
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
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 rounded-xl bg-[var(--glass-shine)] border border-[var(--glass-border)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-border)] transition-all group"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--text-main)] mb-2">{t('employees.title')}</h1>
                        <p className="text-[var(--text-muted)]">{t('employees.subtitle')}</p>
                    </div>
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
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[2px] mb-4 relative group/avatar">
                                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                                        {emp.profilePhoto ? (
                                            <img src={emp.profilePhoto} alt={emp.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-2xl font-bold text-white">{emp.name.charAt(0)}</span>
                                        )}
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-[var(--text-main)] mb-1">{emp.name}</h3>
                                <p className="text-primary text-sm mb-4">{emp.position}</p>

                                <div className="w-full bg-[var(--glass-shine)] rounded-xl p-3 flex justify-between items-center text-sm mb-2">
                                    <div className="text-[var(--text-muted)]">ID: <span className="text-[var(--text-main)] font-mono">{emp.employeeId}</span></div>
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
                                    <div className="p-2 rounded bg-[var(--glass-shine)]">
                                        <p className="text-[var(--text-muted)]">{t('employees.present')}</p>
                                        <p className="text-[var(--text-main)] font-bold text-lg">{emp.attendanceCount?.present || 0}</p>
                                    </div>
                                    <div className="p-2 rounded bg-[var(--glass-shine)]">
                                        <p className="text-[var(--text-muted)]">{t('employees.performance')}</p>
                                        <p className="text-[var(--text-main)] font-bold text-lg">{emp.performanceScore || 0}%</p>
                                    </div>
                                </div>

                                <div className="mt-4 w-full">
                                    <Button
                                        variant="secondary"
                                        className="w-full text-xs flex items-center justify-center gap-2 border-dashed border-indigo-500/30 hover:border-indigo-500"
                                        onClick={() => setSelectedDeviceEmp(emp)}
                                    >
                                        <Shield size={14} className={emp.deviceLockEnabled ? 'text-green-400' : 'text-gray-400'} />
                                        Device Security
                                    </Button>
                                </div>
                            </div>
                        </GlassCard>
                    ))
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setShowCamera(false); }} title={t('employees.addTitle')}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Profile Photo Upload Section */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden bg-white/5 mb-3 relative">
                            {showCamera ? (
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    className="w-full h-full object-cover"
                                    videoConstraints={{ facingMode: "user" }}
                                />
                            ) : formData.profilePhoto ? (
                                <img src={formData.profilePhoto} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <Camera className="w-8 h-8 text-gray-500" />
                            )}
                        </div>
                        <div className="flex gap-2">
                            {!showCamera ? (
                                <>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        icon={<Camera size={14} />}
                                        onClick={() => setShowCamera(true)}
                                    >
                                        Ambil Foto
                                    </Button>
                                    <label className="cursor-pointer">
                                        <div className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-xl hover:bg-white/5 transition-colors text-xs text-white">
                                            <Upload size={14} /> Pilih File
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setFormData({ ...formData, profilePhoto: reader.result as string });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </label>
                                </>
                            ) : (
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => {
                                        const imageSrc = webcamRef.current.getScreenshot();
                                        setFormData({ ...formData, profilePhoto: imageSrc });
                                        setShowCamera(false);
                                    }}
                                >
                                    Tangkap
                                </Button>
                            )}
                        </div>
                    </div>

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

                    {/* Key Person Toggle */}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:border-yellow-500/30 transition-colors">
                        <div>
                            <label className="text-white font-semibold block mb-1">⭐ {t('employees.keyPerson')}</label>
                            <p className="text-xs text-gray-400">{t('employees.enableLateAlerts')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isKeyPerson}
                                onChange={(e) => setFormData({ ...formData, isKeyPerson: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:ring-2 peer-focus:ring-yellow-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                        </label>
                    </div>

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

            {/* Device Management Modal */}
            <Modal isOpen={!!selectedDeviceEmp} onClose={() => setSelectedDeviceEmp(null)} title="Device Security Management">
                {selectedDeviceEmp && (
                    <div className="space-y-6 p-2">
                        <div className="flex items-center justify-between p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                            <div className="flex items-center gap-3">
                                <Shield className={selectedDeviceEmp.deviceLockEnabled ? 'text-green-400' : 'text-gray-400'} />
                                <div>
                                    <p className="text-white font-bold">{t('employees.deviceLock')}</p>
                                    <p className="text-xs text-gray-400">{t('employees.restrictToRegistered')}</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedDeviceEmp.deviceLockEnabled}
                                    onChange={handleToggleDeviceLock}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:ring-2 peer-focus:ring-green-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                            </label>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                                    <Smartphone size={16} /> {t('employees.registeredDevices')} ({selectedDeviceEmp.registeredDevices?.length || 0})
                                </h4>
                                {selectedDeviceEmp.registeredDevices?.length > 0 && (
                                    <button onClick={handleClearDevices} className="text-xs text-red-400 hover:text-red-300 font-medium">{t('employees.resetAll')}</button>
                                )}
                            </div>

                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {selectedDeviceEmp.registeredDevices?.length === 0 ? (
                                    <div className="text-center py-6 bg-white/5 rounded-xl border border-dashed border-white/10">
                                        <p className="text-xs text-gray-500 italic">Belum ada perangkat terdaftar</p>
                                    </div>
                                ) : (
                                    selectedDeviceEmp.registeredDevices.map((dev: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 text-xs">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-800 rounded-lg">
                                                    <HardDrive size={14} className="text-indigo-400" />
                                                </div>
                                                <div>
                                                    <p className="text-white font-mono">{dev.fingerprint}</p>
                                                    <p className="text-gray-500">{dev.name} • {new Date(dev.registeredAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">{dev.deviceType}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl">
                            <p className="text-[10px] text-yellow-500 leading-relaxed">
                                {t('employees.deviceLockNote')}
                            </p>
                        </div>

                        <Button onClick={() => setSelectedDeviceEmp(null)} className="w-full">{t('employees.close')}</Button>
                    </div>
                )}
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

