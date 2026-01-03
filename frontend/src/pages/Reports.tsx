import React, { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import GlassCard from '../components/UI/GlassCard';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { FileSpreadsheet, FileText, Download, Calendar, Users, Clock, RefreshCw, Trash2, X, User } from 'lucide-react';

const Reports = () => {
    const { t } = useLanguage();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState({ excel: false, pdf: false });
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [statsData, setStatsData] = useState<any[]>([]);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; record: any }>({ show: false, record: null });
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Set default date range (current month)
    useEffect(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        setStartDate(firstDay.toISOString().split('T')[0]);
        setEndDate(lastDay.toISOString().split('T')[0]);
    }, []);

    const fetchData = async (isBackground = false) => {
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
    };

    useEffect(() => {
        if (startDate && endDate) {
            fetchData(); // Initial load (shows spinner)
            const interval = setInterval(() => fetchData(true), 3000); // Silent refresh
            return () => clearInterval(interval);
        }
    }, [startDate, endDate]);

    const downloadExcel = async () => {
        setLoading({ ...loading, excel: true });
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
            alert(t('reports.downloadFailed'));
        } finally {
            setLoading({ ...loading, excel: false });
        }
    };

    const downloadPDF = async () => {
        setLoading({ ...loading, pdf: true });
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
            alert(t('reports.downloadFailed'));
        } finally {
            setLoading({ ...loading, pdf: false });
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

    const handleDelete = async (record: any) => {
        try {
            await api.delete(`/attendance/${record._id}`);
            setDeleteConfirm({ show: false, record: null });
            fetchData(false); // Refresh data after delete
        } catch (error) {
            console.error('Error deleting attendance:', error);
            alert('Gagal menghapus data absensi');
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

    const handleBulkDelete = async () => {
        if (!window.confirm(`Hapus ${selectedIds.length} data absensi?`)) return;

        try {
            await Promise.all(selectedIds.map(id => api.delete(`/attendance/${id}`)));
            setSelectedIds([]);
            fetchData(false);
        } catch (error) {
            console.error('Error bulk deleting:', error);
            alert('Gagal menghapus beberapa data');
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
                    <h1 className="text-3xl font-bold text-white mb-2">{t('reports.title')}</h1>
                    <p className="text-gray-400">{t('reports.subtitle')}</p>
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
                    <p className="text-2xl font-bold text-white">{previewData.length}</p>
                    <p className="text-gray-400 text-[10px] uppercase font-bold">{t('reports.totalRecords')}</p>
                </GlassCard>
                <GlassCard className="text-center py-4 border-l-4 border-l-green-500">
                    <p className="text-2xl font-bold text-white">
                        {previewData.filter(d => d.attendanceStatus === 'present').length}
                    </p>
                    <p className="text-gray-400 text-[10px] uppercase font-bold">{t('reports.present')}</p>
                </GlassCard>
                <GlassCard className="text-center py-4 border-l-4 border-l-yellow-500">
                    <p className="text-2xl font-bold text-white">
                        {previewData.filter(d => d.attendanceStatus === 'late').length}
                    </p>
                    <p className="text-gray-400 text-[10px] uppercase font-bold">{t('reports.late')}</p>
                </GlassCard>
                <GlassCard className="text-center py-4 border-l-4 border-l-indigo-500">
                    <p className="text-2xl font-bold text-white">{eligibleForPromotion.length}</p>
                    <p className="text-indigo-400 text-[10px] uppercase font-bold">{t('reports.eligible')}</p>
                </GlassCard>
            </div>

            {/* Pivot Table Section */}
            <GlassCard className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-lg font-bold text-white">{t('reports.summaryTable')}</h3>
                </div>
                {previewLoading ? (
                    <p className="text-gray-400">{t('common.loading')}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-white/10 text-gray-400 uppercase">
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
                                    <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="py-3 px-2">
                                            <p className="text-white font-medium">{stat.name}</p>
                                            <p className="text-gray-500 text-[10px]">{stat.position}</p>
                                        </td>
                                        <td className="py-3 px-2 text-center font-bold text-white">{stat.attendanceRate}%</td>
                                        <td className="py-3 px-2 text-center text-gray-300">{stat.punctualityRate}%</td>
                                        <td className="py-3 px-2 text-center text-gray-300">{stat.performanceScore}%</td>
                                        <td className="py-3 px-2 text-center text-indigo-400 font-bold">{stat.promotionScore}</td>
                                        <td className="py-3 px-2 text-center text-gray-500 font-mono text-[10px]">{stat.currentStatus}</td>
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
                            <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-indigo-500/50 transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-white font-bold">{emp.name}</h4>
                                    <span className="text-indigo-400 font-bold text-xs">#{emp.promotionScore}</span>
                                </div>
                                <p className="text-gray-400 text-[10px] mb-3">{emp.position}</p>
                                <div className="space-y-1 text-[10px]">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">{t('reports.attendanceRate')}</span>
                                        <span className="text-white">{emp.attendanceRate}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">{t('reports.performanceScore')}</span>
                                        <span className="text-white">{emp.performanceScore}%</span>
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

            {/* Detailed Data Preview - Collapsible or simpler */}
            <GlassCard>
                <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-bold text-white">{t('reports.preview')} (10 {t('reports.records')})</h3>
                </div>
                {previewLoading ? (
                    <p className="text-gray-400">{t('common.loading')}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-[11px]">
                            <thead>
                                <tr className="border-b border-white/10 text-gray-500 uppercase">
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
                                            <p className="text-white">{record.name}</p>
                                        </td>
                                        <td className="py-2 px-2 text-gray-400">{record.date}</td>
                                        <td className="py-2 px-2 text-center text-green-400 font-mono">{record.checkIn}</td>
                                        <td className="py-2 px-2 text-center text-red-400 font-mono">{record.checkOut}</td>
                                        <td className="py-2 px-2 text-center text-yellow-400 font-bold">{record.overtime}</td>
                                        <td className={`py-2 px-2 font-bold ${getStatusColor(record.attendanceStatus)}`}>
                                            {record.attendanceStatus.toUpperCase()}
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                            <button
                                                onClick={() => setDeleteConfirm({ show: true, record })}
                                                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
                                                title="Hapus"
                                            >
                                                <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
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
                            alt="Face Photo"
                            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {deleteConfirm.show && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <GlassCard className="max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Konfirmasi Hapus</h3>
                        <p className="text-gray-300 mb-6">
                            Yakin hapus data absensi <span className="font-bold text-white">{deleteConfirm.record?.name}</span> pada tanggal <span className="font-bold text-white">{deleteConfirm.record?.date}</span>?
                        </p>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => handleDelete(deleteConfirm.record)}
                                className="flex-1 bg-red-500 hover:bg-red-600 border-none"
                            >
                                Hapus
                            </Button>
                            <Button
                                onClick={() => setDeleteConfirm({ show: false, record: null })}
                                variant="secondary"
                                className="flex-1"
                            >
                                Batal
                            </Button>
                        </div>
                    </GlassCard>
                </div>
            )}
        </MainLayout>
    );
};

export default Reports;
