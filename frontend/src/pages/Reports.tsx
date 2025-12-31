import React, { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import GlassCard from '../components/UI/GlassCard';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { FileSpreadsheet, FileText, Download, Calendar, Users, Clock, RefreshCw } from 'lucide-react';

const Reports = () => {
    const { t } = useLanguage();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState({ excel: false, pdf: false });
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [previewLoading, setPreviewLoading] = useState(false);

    // Set default date range (current month)
    useEffect(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        setStartDate(firstDay.toISOString().split('T')[0]);
        setEndDate(lastDay.toISOString().split('T')[0]);
    }, []);

    const fetchPreview = async () => {
        setPreviewLoading(true);
        try {
            const res = await api.get('/reports/attendance', {
                params: { startDate, endDate }
            });
            setPreviewData(res.data);
        } catch (error) {
            console.error('Error fetching preview:', error);
        } finally {
            setPreviewLoading(false);
        }
    };

    useEffect(() => {
        if (startDate && endDate) {
            fetchPreview();
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
                        onClick={fetchPreview}
                        icon={<RefreshCw className="w-4 h-4" />}
                        variant="secondary"
                    >
                        {t('reports.refresh')}
                    </Button>
                </div>
            </GlassCard>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <GlassCard className="text-center">
                    <div className="flex items-center justify-center mb-2">
                        <Users className="w-8 h-8 text-indigo-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">{previewData.length}</p>
                    <p className="text-gray-400 text-sm">{t('reports.totalRecords')}</p>
                </GlassCard>
                <GlassCard className="text-center">
                    <div className="flex items-center justify-center mb-2">
                        <Clock className="w-8 h-8 text-green-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">
                        {previewData.filter(d => d.status === 'present').length}
                    </p>
                    <p className="text-gray-400 text-sm">{t('reports.present')}</p>
                </GlassCard>
                <GlassCard className="text-center">
                    <div className="flex items-center justify-center mb-2">
                        <Clock className="w-8 h-8 text-yellow-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">
                        {previewData.filter(d => d.status === 'late').length}
                    </p>
                    <p className="text-gray-400 text-sm">{t('reports.late')}</p>
                </GlassCard>
            </div>

            {/* Download Buttons */}
            <GlassCard className="mb-6">
                <h3 className="text-lg font-bold text-white mb-4">{t('reports.downloadReport')}</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                        onClick={downloadExcel}
                        isLoading={loading.excel}
                        icon={<FileSpreadsheet className="w-5 h-5" />}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-none"
                    >
                        {t('reports.downloadExcel')}
                    </Button>
                    <Button
                        onClick={downloadPDF}
                        isLoading={loading.pdf}
                        icon={<FileText className="w-5 h-5" />}
                        className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 border-none"
                    >
                        {t('reports.downloadPDF')}
                    </Button>
                </div>
            </GlassCard>

            {/* Preview Table */}
            <GlassCard>
                <h3 className="text-lg font-bold text-white mb-4">{t('reports.preview')}</h3>
                {previewLoading ? (
                    <p className="text-gray-400">{t('common.loading')}</p>
                ) : previewData.length === 0 ? (
                    <p className="text-gray-400">{t('reports.noData')}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="py-3 px-2 text-left text-gray-400">No</th>
                                    <th className="py-3 px-2 text-left text-gray-400">ID</th>
                                    <th className="py-3 px-2 text-left text-gray-400">{t('reports.name')}</th>
                                    <th className="py-3 px-2 text-left text-gray-400">{t('reports.date')}</th>
                                    <th className="py-3 px-2 text-left text-gray-400">{t('reports.checkIn')}</th>
                                    <th className="py-3 px-2 text-left text-gray-400">{t('reports.checkOut')}</th>
                                    <th className="py-3 px-2 text-left text-gray-400">{t('reports.status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.slice(0, 10).map((record, index) => (
                                    <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="py-3 px-2 text-white">{index + 1}</td>
                                        <td className="py-3 px-2 text-white font-mono">{record.employeeId}</td>
                                        <td className="py-3 px-2 text-white">{record.name}</td>
                                        <td className="py-3 px-2 text-gray-400">{record.date}</td>
                                        <td className="py-3 px-2 text-green-400">{record.checkIn}</td>
                                        <td className="py-3 px-2 text-red-400">{record.checkOut}</td>
                                        <td className={`py-3 px-2 font-bold ${getStatusColor(record.status)}`}>
                                            {record.status.toUpperCase()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {previewData.length > 10 && (
                            <p className="text-center text-gray-400 mt-4">
                                {t('reports.showingFirst')} 10 {t('reports.of')} {previewData.length} {t('reports.records')}
                            </p>
                        )}
                    </div>
                )}
            </GlassCard>
        </MainLayout>
    );
};

export default Reports;
