import React, { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import GlassCard from '../components/UI/GlassCard';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Modal from '../components/UI/Modal';
import api from '../services/api';
import { DollarSign, Calculator, Download, Settings, Calendar, TrendingUp } from 'lucide-react';
import jsPDF from 'jspdf';

interface PayrollData {
    _id?: string;
    employeeId: string;
    employeeName?: string;
    period: { month: number; year: number };
    workingDays: number;
    presentDays: number;
    lateDays: number;
    absentDays: number;
    leaveDays: number;
    baseSalary: number;
    deductions: number;
    lateDeduction?: number;
    absentDeduction?: number;
    bonuses: number;
    netSalary: number;
    salaryType?: string;
}

interface SalaryConfig {
    type: 'monthly' | 'daily';
    amount: number;
    lateDeduction: number;
    overtimeRate: number;
}

const Payroll = () => {
    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [payrollPreview, setPayrollPreview] = useState<PayrollData | null>(null);
    const [payrollHistory, setPayrollHistory] = useState<PayrollData[]>([]);
    const [loading, setLoading] = useState(false);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [salaryConfig, setSalaryConfig] = useState<SalaryConfig>({
        type: 'daily',
        amount: 0,
        lateDeduction: 5000,
        overtimeRate: 1.5
    });

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/employees');
            setEmployees(res.data);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const handleCalculatePayroll = async () => {
        if (!selectedEmployee) {
            alert('Pilih karyawan terlebih dahulu');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/payroll/calculate', {
                employeeId: selectedEmployee,
                month: selectedMonth,
                year: selectedYear
            });
            setPayrollPreview(res.data);
        } catch (error: any) {
            alert(error.response?.data?.msg || 'Gagal menghitung payroll');
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePayroll = async () => {
        if (!payrollPreview) return;

        setLoading(true);
        try {
            await api.post('/payroll/generate', {
                employeeId: selectedEmployee,
                month: selectedMonth,
                year: selectedYear
            });
            alert('Payroll berhasil di-generate!');
            setPayrollPreview(null);
            fetchPayrollHistory(selectedEmployee);
        } catch (error: any) {
            alert(error.response?.data?.msg || 'Gagal generate payroll');
        } finally {
            setLoading(false);
        }
    };

    const fetchPayrollHistory = async (employeeId: string) => {
        try {
            const res = await api.get(`/payroll/history/${employeeId}`);
            setPayrollHistory(res.data);
        } catch (error) {
            console.error('Error fetching payroll history:', error);
        }
    };

    const handleConfigureSalary = async (employeeId: string) => {
        setSelectedEmployee(employeeId);
        try {
            const res = await api.get(`/payroll/config/${employeeId}`);
            setSalaryConfig(res.data);
            setShowConfigModal(true);
        } catch (error) {
            console.error('Error fetching salary config:', error);
        }
    };

    const handleSaveConfig = async () => {
        setLoading(true);
        try {
            await api.put(`/payroll/config/${selectedEmployee}`, salaryConfig);
            alert('Konfigurasi gaji berhasil disimpan!');
            setShowConfigModal(false);
            fetchEmployees();
        } catch (error) {
            alert('Gagal menyimpan konfigurasi');
        } finally {
            setLoading(false);
        }
    };

    const generatePayslipPDF = (data: PayrollData) => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.text('SLIP GAJI', 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.text(`Periode: ${getMonthName(data.period.month)} ${data.period.year}`, 105, 30, { align: 'center' });

        // Employee Info
        doc.setFontSize(11);
        doc.text(`ID Karyawan: ${data.employeeId}`, 20, 50);
        doc.text(`Nama: ${data.employeeName || 'N/A'}`, 20, 60);
        doc.text(`Tipe Gaji: ${data.salaryType === 'monthly' ? 'Bulanan' : 'Harian'}`, 20, 70);

        // Attendance Summary
        doc.text('--- Ringkasan Kehadiran ---', 20, 90);
        doc.text(`Hari Kerja: ${data.workingDays}`, 30, 100);
        doc.text(`Hadir: ${data.presentDays}`, 30, 110);
        doc.text(`Terlambat: ${data.lateDays}`, 30, 120);
        doc.text(`Cuti: ${data.leaveDays}`, 30, 130);
        doc.text(`Absen: ${data.absentDays}`, 30, 140);

        // Salary Calculation
        doc.text('--- Rincian Gaji ---', 20, 160);
        doc.text(`Gaji Pokok: Rp ${data.baseSalary.toLocaleString('id-ID')}`, 30, 170);
        doc.text(`Potongan Keterlambatan: Rp ${(data.lateDeduction || 0).toLocaleString('id-ID')}`, 30, 180);
        doc.text(`Potongan Absen: Rp ${(data.absentDeduction || 0).toLocaleString('id-ID')}`, 30, 190);
        doc.text(`Total Potongan: Rp ${data.deductions.toLocaleString('id-ID')}`, 30, 200);
        doc.text(`Bonus: Rp ${data.bonuses.toLocaleString('id-ID')}`, 30, 210);

        // Net Salary
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`GAJI BERSIH: Rp ${data.netSalary.toLocaleString('id-ID')}`, 30, 230);

        // Footer
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Dokumen ini digenerate otomatis oleh sistem', 105, 270, { align: 'center' });
        doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 105, 280, { align: 'center' });

        doc.save(`Payslip_${data.employeeId}_${data.period.month}-${data.period.year}.pdf`);
    };

    const getMonthName = (month: number) => {
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return months[month - 1];
    };

    return (
        <MainLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">💰 Payroll Management</h1>
                <p className="text-gray-400">Kelola gaji dan slip gaji karyawan</p>
            </div>

            {/* Employee Salary Configuration */}
            <GlassCard className="mb-6">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                    <Settings className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-white">Konfigurasi Gaji Karyawan</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {employees.slice(0, 6).map((emp) => (
                        <div key={emp.employeeId} className="p-4 bg-white/5 rounded-xl border border-white/10">
                            <h3 className="text-white font-semibold mb-1">{emp.name}</h3>
                            <p className="text-sm text-gray-400 mb-2">{emp.employeeId}</p>
                            <p className="text-sm text-gray-300 mb-3">
                                <span className="font-semibold">{emp.salaryConfig?.type === 'monthly' ? 'Bulanan' : 'Harian'}:</span>
                                <span className="text-primary font-bold ml-1">
                                    Rp {(emp.salaryConfig?.amount || 0).toLocaleString('id-ID')}
                                </span>
                            </p>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleConfigureSalary(emp.employeeId)}
                                className="w-full"
                            >
                                Atur Gaji
                            </Button>
                        </div>
                    ))}
                </div>
            </GlassCard>

            {/* Payroll Calculator */}
            <GlassCard className="mb-6">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                    <Calculator className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-white">Hitung Gaji</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Pilih Karyawan</label>
                        <select
                            value={selectedEmployee}
                            onChange={(e) => {
                                setSelectedEmployee(e.target.value);
                                if (e.target.value) fetchPayrollHistory(e.target.value);
                            }}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary focus:outline-none"
                        >
                            <option value="" className="bg-gray-900 text-white">-- Pilih --</option>
                            {employees.map((emp) => (
                                <option key={emp.employeeId} value={emp.employeeId} className="bg-gray-900 text-white">
                                    {emp.name} ({emp.employeeId})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Bulan</label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary focus:outline-none"
                        >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                <option key={m} value={m} className="bg-gray-900 text-white">{getMonthName(m)}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Tahun</label>
                        <Input
                            type="number"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        />
                    </div>
                </div>

                <Button onClick={handleCalculatePayroll} isLoading={loading} icon={<Calculator className="w-4 h-4" />}>
                    Hitung Gaji
                </Button>
            </GlassCard>

            {/* Payroll Preview */}
            {payrollPreview && (
                <GlassCard className="mb-6">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <DollarSign className="w-6 h-6 text-green-400" />
                            <div>
                                <h2 className="text-xl font-bold text-white">Preview Slip Gaji</h2>
                                <p className="text-sm text-gray-400">{payrollPreview.employeeName} - {getMonthName(payrollPreview.period.month)} {payrollPreview.period.year}</p>
                            </div>
                        </div>
                        <Button onClick={() => generatePayslipPDF(payrollPreview)} icon={<Download className="w-4 h-4" />}>
                            Download PDF
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-white font-semibold mb-3">Kehadiran</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Hari Kerja:</span>
                                    <span className="text-white font-semibold">{payrollPreview.workingDays}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Hadir:</span>
                                    <span className="text-green-400 font-semibold">{payrollPreview.presentDays}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Terlambat:</span>
                                    <span className="text-yellow-400 font-semibold">{payrollPreview.lateDays}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Cuti:</span>
                                    <span className="text-blue-400 font-semibold">{payrollPreview.leaveDays}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Absen:</span>
                                    <span className="text-red-400 font-semibold">{payrollPreview.absentDays}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-white font-semibold mb-3">Rincian Gaji</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Gaji Pokok:</span>
                                    <span className="text-white font-semibold">Rp {payrollPreview.baseSalary.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Potongan:</span>
                                    <span className="text-red-400 font-semibold">- Rp {payrollPreview.deductions.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Bonus:</span>
                                    <span className="text-green-400 font-semibold">+ Rp {payrollPreview.bonuses.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="h-px bg-white/10 my-2"></div>
                                <div className="flex justify-between">
                                    <span className="text-white font-bold">GAJI BERSIH:</span>
                                    <span className="text-primary font-bold text-lg">Rp {payrollPreview.netSalary.toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                        <Button onClick={handleGeneratePayroll} isLoading={loading} className="flex-1">
                            Generate & Simpan Payroll
                        </Button>
                        <Button variant="secondary" onClick={() => setPayrollPreview(null)}>
                            Batal
                        </Button>
                    </div>
                </GlassCard>
            )}

            {/* Payroll History */}
            {payrollHistory.length > 0 && (
                <GlassCard>
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                        <TrendingUp className="w-6 h-6 text-primary" />
                        <h2 className="text-xl font-bold text-white">Riwayat Payroll</h2>
                    </div>

                    <div className="space-y-3">
                        {payrollHistory.map((payroll) => (
                            <div key={payroll._id} className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                                <div>
                                    <h3 className="text-white font-semibold">{getMonthName(payroll.period.month)} {payroll.period.year}</h3>
                                    <p className="text-sm text-gray-400">Gaji Bersih: <span className="text-primary font-bold">Rp {payroll.netSalary.toLocaleString('id-ID')}</span></p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    icon={<Download className="w-4 h-4" />}
                                    onClick={() => generatePayslipPDF(payroll)}
                                >
                                    Download
                                </Button>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            )}

            {/* Salary Configuration Modal */}
            <Modal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} title="Konfigurasi Gaji">
                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Tipe Gaji</label>
                        <select
                            value={salaryConfig.type}
                            onChange={(e) => setSalaryConfig({ ...salaryConfig, type: e.target.value as 'monthly' | 'daily' })}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary focus:outline-none"
                        >
                            <option value="daily" className="bg-gray-900 text-white">Harian</option>
                            <option value="monthly" className="bg-gray-900 text-white">Bulanan</option>
                        </select>
                    </div>

                    <Input
                        label={salaryConfig.type === 'monthly' ? 'Gaji Bulanan (Rp)' : 'Upah Harian (Rp)'}
                        type="number"
                        value={salaryConfig.amount}
                        onChange={(e) => setSalaryConfig({ ...salaryConfig, amount: parseInt(e.target.value) || 0 })}
                    />

                    <Input
                        label="Potongan per Keterlambatan (Rp)"
                        type="number"
                        value={salaryConfig.lateDeduction}
                        onChange={(e) => setSalaryConfig({ ...salaryConfig, lateDeduction: parseInt(e.target.value) || 0 })}
                    />

                    <Input
                        label="Rate Lembur (Multiplier)"
                        type="number"
                        step="0.1"
                        value={salaryConfig.overtimeRate}
                        onChange={(e) => setSalaryConfig({ ...salaryConfig, overtimeRate: parseFloat(e.target.value) || 1.5 })}
                    />

                    <div className="flex gap-3 mt-6">
                        <Button onClick={handleSaveConfig} isLoading={loading} className="flex-1">
                            Simpan Konfigurasi
                        </Button>
                        <Button variant="secondary" onClick={() => setShowConfigModal(false)}>
                            Batal
                        </Button>
                    </div>
                </div>
            </Modal>
        </MainLayout>
    );
};

export default Payroll;
