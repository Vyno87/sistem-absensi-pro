import React, { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import GlassCard from '../components/UI/GlassCard';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { FileSpreadsheet, FileText, Calendar, Users, RefreshCw, Trash2, X, User, Check } from 'lucide-react';
import Modal from '../components/UI/Modal';

const Reports = () => {
    const { t } = useLanguage();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState({ excel: false, pdf: false });
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [statsData, setStatsData] = useState<any[]>([]);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; record: any; type: 'single' | 'bulk' }>({ show: false, record: null, type: 'single' });
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [errorMsg, setErrorMsg] = useState('');

    // Set default date range (current month)
    useEffect(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        setStartDate(firstDay.toISOString().split('T')[0]);
        setEndDate(lastDay.toISOString().split('T')[0]);
    }, []);

    const fetchData = React.useCallback(async (isBackground = false) => {
        if (!isBackground) setPreviewLoading(true);
        try {
            // Fetch detailed attendance
            const resPreview = await api.get('/reports/attendance', {
                params: { startDate, endDate }
            });
            setPreviewData(resPreview.data);

            // Fetch summary stats
            const resStats = await api.get('/reports/stats', {
                params: { startDate, endDate }
            });
            setStatsData(resStats.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            if (!isBackground) setPreviewLoading(false);
        }
    }, [startDate, endDate]);

    // Auto-refresh untuk Live Reports (Admin)
    useEffect(() => {
        if (startDate && endDate) {
            fetchData(); // Initial load
            // Live refresh setiap 3 detik
            const interval = setInterval(() => fetchData(true), 3000);
            return () => clearInterval(interval);
        }
    }, [startDate, endDate, fetchData]);

    const downloadExcel = async () => {
        setLoading(prev => ({ ...prev, excel: true }));
        try {
            const response = await api.get('/reports/excel', {
                params: { startDate, endDate },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Laporan_Absensi_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading Excel:', error);
            setErrorMsg(t('reports.downloadFailed'));
        } finally {
            setLoading(prev => ({ ...prev, excel: false }));
        }
    };

    const downloadPDF = async () => {
        setLoading(prev => ({ ...prev, pdf: true }));
        try {
            const response = await api.get('/reports/pdf', {
                params: { startDate, endDate },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Laporan_Absensi_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            setErrorMsg(t('reports.downloadFailed'));
        } finally {
            setLoading(prev => ({ ...prev, pdf: false }));
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'present': return 'text-green-400';
            case 'late': return 'text-yellow-400';
            case 'absent': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    const handleDeleteClick = (record: any) => {
        setDeleteConfirm({ show: true, record, type: 'single' });
    };

    const executeDelete = async (record: any) => {
        try {
            await api.delete(`/attendance/${record._id}`);
            setDeleteConfirm({ show: false, record: null, type: 'single' });
            fetchData(false); // Refresh data after delete
        } catch (error: any) {
            console.error('Error deleting attendance:', error);
            setDeleteConfirm({ show: false, record: null, type: 'single' });
            setErrorMsg(error.response?.data?.msg || 'Gagal menghapus data absensi');
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === previewData.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(previewData.map(r => r._id));
        }
    };

    const handleBulkDeleteClick = () => {
        setDeleteConfirm({ show: true, record: null, type: 'bulk' });
    };

    const executeBulkDelete = async () => {
        try {
            await Promise.all(selectedIds.map(id => api.delete(`/attendance/${id}`)));
            setSelectedIds([]);
            setDeleteConfirm({ show: false, record: null, type: 'single' });
            fetchData(false);
        } catch (error: any) {
            console.error('Error bulk deleting:', error);
            setDeleteConfirm({ show: false, record: null, type: 'single' });
            setErrorMsg(error.response?.data?.msg || 'Gagal menghapus beberapa data');
        }
    };

    const formatDate = (date: any) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('id-ID', {
            timeZone: 'Asia/Jakarta',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatTime = (date: any) => {
        if (!date) return '-';
        return new Date(date).toLocaleTimeString('id-ID', {
            timeZone: 'Asia/Jakarta',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    const eligibleForPromotion = statsData.filter(s => s.isEligibleForPromotion);

    return (
        <MainLayout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-main)] mb-2">{t('reports.title')}</h1>
                    <p className="text-[var(--text-muted)]">{t('reports.subtitle')}</p>
                </div>
            </div>

            {/* Filter Section */}
            <GlassCard className="mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm text-gray-400 mb-2">{t('reports.startDate')}</label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            icon={<Calendar className="w-4 h-4" />}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm text-gray-400 mb-2">{t('reports.endDate')}</label>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            icon={<Calendar className="w-4 h-4" />}
                        />
                    </div>
                    <Button
                        onClick={() => fetchData(false)}
                        icon={<RefreshCw className="w-4 h-4" />}
                        variant="secondary"
                    >
                        {t('reports.refresh')}
                    </Button>
                </div>
            </GlassCard>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <GlassCard className="text-center py-4">
                    <p className="text-2xl font-bold text-[var(--text-main)]">{previewData.length}</p>
                    <p className="text-[var(--text-muted)] text-[10px] uppercase font-bold">{t('reports.totalRecords')}</p>
                </GlassCard>
                <GlassCard className="text-center py-4 border-l-4 border-l-green-500">
                    <p className="text-2xl font-bold text-[var(--text-main)]">
                        {previewData.filter(d => d.attendanceStatus === 'present').length}
                    </p>
                    <p className="text-[var(--text-muted)] text-[10px] uppercase font-bold">{t('reports.present')}</p>
                </GlassCard>
                <GlassCard className="text-center py-4 border-l-4 border-l-yellow-500">
                    <p className="text-2xl font-bold text-[var(--text-main)]">
                        {previewData.filter(d => d.attendanceStatus === 'late').length}
                    </p>
                    <p className="text-[var(--text-muted)] text-[10px] uppercase font-bold">{t('reports.late')}</p>
                </GlassCard>
                <GlassCard className="text-center py-4 border-l-4 border-l-indigo-500">
                    <p className="text-2xl font-bold text-[var(--text-main)]">{eligibleForPromotion.length}</p>
                    <p className="text-indigo-400 text-[10px] uppercase font-bold">{t('reports.eligible')}</p>
                </GlassCard>
            </div>

            {/* Pivot Table Section */}
            <GlassCard className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-lg font-bold text-[var(--text-main)]">{t('reports.summaryTable')}</h3>
                </div>
                {previewLoading ? (
                    <p className="text-[var(--text-muted)]">{t('common.loading')}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-[var(--glass-border)] text-[var(--text-muted)] uppercase">
                                    <th className="py-3 px-2 text-left font-semibold">{t('reports.name')}</th>
                                    <th className="py-3 px-2 text-center font-semibold">{t('reports.attendanceRate')}</th>
                                    <th className="py-3 px-2 text-center font-semibold">{t('reports.punctualityRate')}</th>
                                    <th className="py-3 px-2 text-center font-semibold">{t('reports.performanceScore')}</th>
                                    <th className="py-3 px-2 text-center font-semibold">{t('reports.promotionScore')}</th>
                                    <th className="py-3 px-2 text-center font-semibold">{t('reports.status')}</th>
                                    <th className="py-3 px-2 text-right font-semibold">{t('reports.recommendation')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {statsData.map((stat, index) => (
                                    <tr key={index} className="border-b border-[var(--glass-border)] hover:bg-[var(--glass-shine)] transition-colors">
                                        <td className="py-3 px-2">
                                            <p className="text-[var(--text-main)] font-medium">{stat.name}</p>
                                            <p className="text-[var(--text-muted)] text-[10px]">{stat.position}</p>
                                        </td>
                                        <td className="py-3 px-2 text-center font-bold text-[var(--text-main)]">{stat.attendanceRate}%</td>
                                        <td className="py-3 px-2 text-center text-[var(--text-muted)]">{stat.punctualityRate}%</td>
                                        <td className="py-3 px-2 text-center text-[var(--text-muted)]">{stat.performanceScore}%</td>
                                        <td className="py-3 px-2 text-center text-indigo-400 font-bold">{stat.promotionScore}</td>
                                        <td className="py-3 px-2 text-center text-[var(--text-muted)] font-mono text-[10px]">{stat.currentStatus}</td>
                                        <td className="py-3 px-2 text-right">
                                            {stat.isEligibleForPromotion ? (
                                                <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-[9px] font-bold border border-green-500/30">
                                                    {t('reports.eligible')}
                                                </span>
                                            ) : (
                                                <span className="text-gray-600">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </GlassCard>

            {/* Promotion Recommendations */}
            {eligibleForPromotion.length > 0 && (
                <GlassCard className="mb-6 border-indigo-500/30 bg-indigo-500/5">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-green-400" />
                        <h3 className="text-lg font-bold text-white">{t('reports.promotionRecommendation')}</h3>
                    </div>
                    <p className="text-xs text-gray-400 mb-4">{t('reports.promotionCriteria')}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {eligibleForPromotion.map((emp, i) => (
                            <div key={i} className="bg-[var(--glass-shine)] rounded-xl p-4 border border-[var(--glass-border)] hover:border-indigo-500/50 transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-[var(--text-main)] font-bold">{emp.name}</h4>
                                    <span className="text-indigo-400 font-bold text-xs">#{emp.promotionScore}</span>
                                </div>
                                <p className="text-[var(--text-muted)] text-[10px] mb-3">{emp.position}</p>
                                <div className="space-y-1 text-[10px]">
                                    <div className="flex justify-between">
                                        <span className="text-[var(--text-muted)]">{t('reports.attendanceRate')}</span>
                                        <span className="text-[var(--text-main)]">{emp.attendanceRate}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--text-muted)]">{t('reports.performanceScore')}</span>
                                        <span className="text-[var(--text-main)]">{emp.performanceScore}%</span>
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">{emp.currentStatus} → TERAP</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            )}

            {/* Download Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Button
                    onClick={downloadExcel}
                    isLoading={loading.excel}
                    icon={<FileSpreadsheet className="w-5 h-5" />}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none h-14"
                >
                    {t('reports.downloadExcel')}
                </Button>
                <Button
                    onClick={downloadPDF}
                    isLoading={loading.pdf}
                    icon={<FileText className="w-5 h-5" />}
                    className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 border-none h-14"
                >
                    {t('reports.downloadPDF')}
                </Button>
            </div>

            {/* Bulk Action Toolbar */}
            {selectedIds.length > 0 && (
                <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-lg mb-4 flex justify-between items-center shadow-lg">
                    <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-white" />
                        <span className="text-white font-bold">{selectedIds.length} data dipilih</span>
                    </div>
                    <Button
                        onClick={handleBulkDeleteClick}
                        className="bg-red-500 hover:bg-red-600 border-none"
                        icon={<Trash2 className="w-4 h-4" />}
                    >
                        Hapus Semua
                    </Button>
                </div>
            )}

            {/* Detailed Data Preview - Collapsible or simpler */}
            <GlassCard>
                <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-[var(--text-muted)]" />
                    <h3 className="text-lg font-bold text-[var(--text-main)]">{t('reports.preview')} (10 {t('reports.records')})</h3>
                </div>
                {previewLoading ? (
                    <p className="text-gray-400">{t('common.loading')}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-[11px]">
                            <thead>
                                <tr className="border-b border-white/10 text-gray-500 uppercase">
                                    <th className="py-2 px-2 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.length === previewData.length && previewData.length > 0}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 cursor-pointer"
                                        />
                                    </th>
                                    <th className="py-2 px-2 text-left">No</th>
                                    <th className="py-2 px-2 text-center">Foto</th>
                                    <th className="py-2 px-2 text-left">{t('reports.name')}</th>
                                    <th className="py-2 px-2 text-left">{t('reports.date')}</th>
                                    <th className="py-2 px-2 text-center">Masuk</th>
                                    <th className="py-2 px-2 text-center">Keluar</th>
                                    <th className="py-2 px-2 text-center text-yellow-500">Lembur</th>
                                    <th className="py-2 px-2 text-left">{t('reports.status')}</th>
                                    <th className="py-2 px-2 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.slice(0, 10).map((record, index) => (
                                    <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="py-2 px-2 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(record._id)}
                                                onChange={() => toggleSelect(record._id)}
                                                className="w-4 h-4 cursor-pointer"
                                            />
                                        </td>
                                        <td className="py-2 px-2 text-gray-500">{index + 1}</td>
                                        <td className="py-2 px-2 text-center">
                                            {record.facePhoto ? (
                                                <img
                                                    src={record.facePhoto}
                                                    alt={record.name}
                                                    className="w-10 h-10 rounded-full object-cover mx-auto cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
                                                    onClick={() => setSelectedPhoto(record.facePhoto)}
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mx-auto">
                                                    <User className="w-5 h-5 text-gray-500" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-2 px-2">
                                            <p className="text-[var(--text-main)]">{record.name}</p>
                                        </td>
                                        <td className="py-2 px-2 text-[var(--text-muted)]">{formatDate(record.date)}</td>
                                        <td className="py-2 px-2 text-center text-green-400 font-mono">{formatTime(record.checkIn)}</td>
                                        <td className="py-2 px-2 text-center text-red-400 font-mono">{formatTime(record.checkOut)}</td>
                                        <td className="py-2 px-2 text-center text-yellow-400 font-bold">{record.overtime}</td>
                                        <td className={`py-2 px-2 font-bold ${getStatusColor(record.attendanceStatus)}`}>
                                            {record.attendanceStatus.toUpperCase()}
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                            <button
                                                onClick={() => handleDeleteClick(record)}
                                                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
                                                title="Hapus"
                                            >
                                                <Trash2 className="w-4 h-4 text-[var(--text-muted)] group-hover:text-red-400" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </GlassCard>

            {/* Photo Modal */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <div className="relative max-w-2xl max-h-[90vh]">
                        <button
                            onClick={() => setSelectedPhoto(null)}
                            className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                        <img
                            src={selectedPhoto}
                            alt="Employee View"
                            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}

            {/* Bulk Delete Confirmation Dialog */}
            {deleteConfirm.show && deleteConfirm.type === 'bulk' && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <GlassCard className="max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Konfirmasi Hapus Massal</h3>
                        <p className="text-gray-300 mb-6">
                            Yakin hapus <span className="font-bold text-white">{selectedIds.length} data</span> absensi yang dipilih?
                            <br />
                            <span className="text-red-400 text-xs italic">Tindakan ini tidak dapat dibatalkan.</span>
                        </p>
                        <div className="flex gap-3">
                            <Button
                                onClick={executeBulkDelete}
                                className="flex-1 bg-red-500 hover:bg-red-600 border-none"
                            >
                                Ya, Hapus Semua
                            </Button>
                            <Button
                                onClick={() => setDeleteConfirm({ show: false, record: null, type: 'single' })}
                                variant="secondary"
                                className="flex-1"
                            >
                                Batal
                            </Button>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Single Delete Confirmation Dialog */}
            {deleteConfirm.show && deleteConfirm.type === 'single' && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <GlassCard className="max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Konfirmasi Hapus</h3>
                        <p className="text-gray-300 mb-6">
                            Yakin hapus data absensi <span className="font-bold text-white">{deleteConfirm.record?.name}</span> pada tanggal <span className="font-bold text-white">{deleteConfirm.record && formatDate(deleteConfirm.record.date)}</span>?
                        </p>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => executeDelete(deleteConfirm.record)}
                                className="flex-1 bg-red-500 hover:bg-red-600 border-none"
                            >
                                Hapus
                            </Button>
                            <Button
                                onClick={() => setDeleteConfirm({ show: false, record: null, type: 'single' })}
                                variant="secondary"
                                className="flex-1"
                            >
                                Batal
                            </Button>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Error/Access Denied Modal */}
            <Modal isOpen={!!errorMsg} onClose={() => setErrorMsg('')} title="Gagal">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="w-8 h-8 text-red-500" />
                    </div>
                    <p className="text-gray-300 mb-6">{errorMsg}</p>
                    <Button onClick={() => setErrorMsg('')} className="w-full">
                        Tutup
                    </Button>
                </div>
            </Modal>
        </MainLayout>
    );
};

export default Reports;
