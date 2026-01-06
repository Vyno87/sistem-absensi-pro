const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const auth = require('../middleware/auth');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Middleware to check if user is admin
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }
    next();
};

// Helper function to get attendance data with employee details
const getAttendanceData = async (startDate, endDate) => {
    let query = {};
    if (startDate && endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        query.date = {
            $gte: new Date(startDate),
            $lte: end
        };
    }

    const attendanceRecords = await Attendance.find(query)
        .sort({ date: -1 })
        .lean();

    // Get all employees for mapping
    const employees = await Employee.find().lean();
    const employeeMap = {};
    employees.forEach(emp => {
        employeeMap[emp.employeeId] = emp;
    });

    // Format data
    const formattedData = attendanceRecords.map(record => {
        const emp = employeeMap[record.employeeId] || {};

        // Calculate Overtime
        let overtime = '-';
        if (record.checkIn && record.checkOut) {
            const start = new Date(record.checkIn);
            const end = new Date(record.checkOut);
            const diffMs = end - start;
            const diffHours = diffMs / (1000 * 60 * 60);

            // Assume 9 hours work day (8 work + 1 break)
            if (diffHours > 9) {
                const otHours = Math.floor(diffHours - 9);
                const otMinutes = Math.floor(((diffHours - 9) - otHours) * 60);
                overtime = `${otHours}j ${otMinutes}m`;
            }
        }

        return {
            _id: record._id, // Include ID for deletion
            employeeId: record.employeeId || 'N/A',
            name: emp.name || 'Unknown',
            position: emp.position || 'N/A',
            status: emp.status || 'N/A',
            performanceScore: emp.performanceScore || 0,
            date: record.date, // Send raw date for timezone handling on frontend
            checkIn: record.checkIn, // Send raw date
            checkOut: record.checkOut || null, // Send raw date or null
            overtime: overtime,
            attendanceStatus: record.status,
            latitude: record.latitude || '-',
            longitude: record.longitude || '-',
            facePhoto: record.facePhoto || null // Include face photo
        };
    });

    return { formattedData, employees, employeeMap };
};

// Helper function to calculate employee statistics
const calculateEmployeeStats = (attendanceData, employees) => {
    const statsMap = {};

    // Initialize stats for each employee
    employees.forEach(emp => {
        statsMap[emp.employeeId] = {
            employeeId: emp.employeeId,
            name: emp.name,
            position: emp.position,
            currentStatus: emp.status,
            performanceScore: emp.performanceScore || 0,
            present: 0,
            late: 0,
            absent: 0,
            onLeave: 0,
            totalDays: 0
        };
    });

    // Count attendance by status
    attendanceData.forEach(record => {
        if (statsMap[record.employeeId]) {
            statsMap[record.employeeId].totalDays++;
            if (record.attendanceStatus === 'present') statsMap[record.employeeId].present++;
            else if (record.attendanceStatus === 'late') statsMap[record.employeeId].late++;
            else if (record.attendanceStatus === 'absent') statsMap[record.employeeId].absent++;
            else if (record.attendanceStatus === 'on-leave') statsMap[record.employeeId].onLeave++;
        }
    });

    // Calculate percentages and promotion eligibility
    return Object.values(statsMap).map(stat => {
        const attendanceRate = stat.totalDays > 0 ? ((stat.present + stat.late) / stat.totalDays * 100).toFixed(1) : 0;
        const punctualityRate = stat.totalDays > 0 ? (stat.present / stat.totalDays * 100).toFixed(1) : 0;

        // Promotion eligibility: attendance >= 90%, performance >= 80%, not already permanent
        const isEligibleForPromotion =
            parseFloat(attendanceRate) >= 90 &&
            stat.performanceScore >= 80 &&
            stat.currentStatus !== 'Tetap';

        return {
            ...stat,
            attendanceRate: parseFloat(attendanceRate),
            punctualityRate: parseFloat(punctualityRate),
            isEligibleForPromotion,
            promotionScore: (parseFloat(attendanceRate) * 0.4 + stat.performanceScore * 0.6).toFixed(1)
        };
    }).filter(stat => stat.totalDays > 0);
};

// @route    GET api/reports/attendance
// @desc     Export attendance records to JSON
// @access   Private (Admin only)
router.get('/attendance', auth, adminOnly, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const { formattedData } = await getAttendanceData(startDate, endDate);
        res.json(formattedData);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    GET api/reports/stats
// @desc     Get employee statistics for reports
// @access   Private (Admin only)
router.get('/stats', auth, adminOnly, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const { formattedData, employees } = await getAttendanceData(startDate, endDate);
        const stats = calculateEmployeeStats(formattedData, employees);
        res.json(stats);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    GET api/reports/excel
// @desc     Generate Excel report with summary and pivot table
// @access   Private (Admin only)
router.get('/excel', auth, adminOnly, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const { formattedData, employees } = await getAttendanceData(startDate, endDate);
        const employeeStats = calculateEmployeeStats(formattedData, employees);

        // Create workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Sistem Absensi PRO';
        workbook.created = new Date();

        const dateRange = startDate && endDate
            ? `${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`
            : 'Semua Data';

        // ========== SHEET 1: RINGKASAN & REKOMENDASI ==========
        const summarySheet = workbook.addWorksheet('Ringkasan & Rekomendasi');

        // Title
        summarySheet.mergeCells('A1:L1');
        summarySheet.getCell('A1').value = 'LAPORAN RINGKASAN ABSENSI & REKOMENDASI PENGANGKATAN';
        summarySheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
        summarySheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '6366F1' } };
        summarySheet.getCell('A1').alignment = { horizontal: 'center' };

        summarySheet.mergeCells('A2:L2');
        summarySheet.getCell('A2').value = `Periode: ${dateRange}`;
        summarySheet.getCell('A2').alignment = { horizontal: 'center' };

        // Summary Stats (General)
        summarySheet.addRow([]);
        summarySheet.addRow(['STATISTIK UMUM']);
        summarySheet.getRow(4).font = { bold: true };

        const totalRecords = formattedData.length;
        const presentCount = formattedData.filter(d => d.attendanceStatus === 'present').length;
        const lateCount = formattedData.filter(d => d.attendanceStatus === 'late').length;
        const absentCount = formattedData.filter(d => d.attendanceStatus === 'absent').length;

        summarySheet.addRow(['Total Data Absensi', totalRecords]);
        summarySheet.addRow(['Hadir Tepat Waktu', presentCount, totalRecords > 0 ? `${(presentCount / totalRecords * 100).toFixed(1)}%` : '0%']);
        summarySheet.addRow(['Terlambat', lateCount, totalRecords > 0 ? `${(lateCount / totalRecords * 100).toFixed(1)}%` : '0%']);
        summarySheet.addRow(['Tidak Hadir', absentCount, totalRecords > 0 ? `${(absentCount / totalRecords * 100).toFixed(1)}%` : '0%']);

        // Pivot Table - Employee Summary
        summarySheet.addRow([]);
        summarySheet.addRow([]);
        summarySheet.addRow(['TABEL RINGKASAN PER KARYAWAN (PIVOT TABLE)']);
        summarySheet.getRow(11).font = { bold: true, size: 12 };

        const pivotHeaders = ['ID', 'Nama', 'Jabatan', 'Status', 'Hadir', 'Terlambat', 'Tidak Hadir', '% Kehadiran', '% Tepat Waktu', 'Skor Performa', 'Skor Promosi', 'Rekomendasi'];
        const pivotHeaderRow = summarySheet.addRow(pivotHeaders);
        pivotHeaderRow.font = { bold: true };
        pivotHeaderRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } };
            cell.font = { bold: true, color: { argb: 'FFFFFF' } };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            cell.alignment = { horizontal: 'center' };
        });

        // Add employee stats rows
        employeeStats.forEach(stat => {
            const row = summarySheet.addRow([
                stat.employeeId,
                stat.name,
                stat.position,
                stat.currentStatus,
                stat.present,
                stat.late,
                stat.absent,
                `${stat.attendanceRate}%`,
                `${stat.punctualityRate}%`,
                `${stat.performanceScore}%`,
                stat.promotionScore,
                stat.isEligibleForPromotion ? '✓ LAYAK DIANGKAT' : '-'
            ]);
            row.eachCell((cell, colNumber) => {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                if (colNumber === 12 && stat.isEligibleForPromotion) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D1FAE5' } };
                    cell.font = { bold: true, color: { argb: '059669' } };
                }
            });
        });

        // Promotion Candidates Section
        const eligibleEmployees = employeeStats.filter(s => s.isEligibleForPromotion);
        summarySheet.addRow([]);
        summarySheet.addRow([]);
        const promoTitle = summarySheet.addRow(['DAFTAR KARYAWAN LAYAK DIANGKAT STATUS']);
        promoTitle.font = { bold: true, size: 12 };

        if (eligibleEmployees.length > 0) {
            summarySheet.addRow(['Kriteria: Kehadiran ≥ 90%, Skor Performa ≥ 80%, Status bukan Tetap']);
            summarySheet.addRow([]);
            eligibleEmployees.forEach((emp, i) => {
                const row = summarySheet.addRow([
                    `${i + 1}.`,
                    emp.name,
                    `(${emp.employeeId})`,
                    `Kehadiran: ${emp.attendanceRate}%`,
                    `Performa: ${emp.performanceScore}%`,
                    `Skor Promosi: ${emp.promotionScore}`,
                    `${emp.currentStatus} → Tetap`
                ]);
                row.getCell(7).font = { bold: true, color: { argb: '059669' } };
            });
        } else {
            summarySheet.addRow(['Tidak ada karyawan yang memenuhi kriteria pengangkatan saat ini.']);
        }

        // ========== ADD CHARTS ==========
        // Chart 1: Pie Chart - Distribusi Status Kehadiran
        summarySheet.addRow([]);
        summarySheet.addRow([]);
        const chartTitleRow = summarySheet.addRow(['VISUALISASI DATA']);
        chartTitleRow.font = { bold: true, size: 14 };
        summarySheet.addRow([]);

        // Prepare data for pie chart
        const chartDataStart = summarySheet.lastRow.number + 2;
        summarySheet.addRow(['Status', 'Jumlah', 'Persentase']);
        summarySheet.addRow(['Hadir Tepat Waktu', presentCount, totalRecords > 0 ? `${(presentCount / totalRecords * 100).toFixed(1)}%` : '0%']);
        summarySheet.addRow(['Terlambat', lateCount, totalRecords > 0 ? `${(lateCount / totalRecords * 100).toFixed(1)}%` : '0%']);
        summarySheet.addRow(['Tidak Hadir', absentCount, totalRecords > 0 ? `${(absentCount / totalRecords * 100).toFixed(1)}%` : '0%']);

        // Chart Title
        summarySheet.addRow([]);
        summarySheet.addRow([]);
        summarySheet.mergeCells(`A${chartDataStart + 5}:D${chartDataStart + 5}`);
        summarySheet.getCell(`A${chartDataStart + 5}`).value = '📊 GRAFIK PIE: Distribusi Status Kehadiran';
        summarySheet.getCell(`A${chartDataStart + 5}`).font = { bold: true, size: 12, color: { argb: '6366F1' } };
        summarySheet.getCell(`A${chartDataStart + 5}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EEF2FF' } };
        summarySheet.getCell(`A${chartDataStart + 5}`).alignment = { horizontal: 'center', vertical: 'middle' };
        summarySheet.getRow(chartDataStart + 5).height = 25;

        // Visual representation using colored cells
        summarySheet.addRow([]);
        const visualRow1 = summarySheet.addRow(['Hadir:', presentCount, `(${totalRecords > 0 ? (presentCount / totalRecords * 100).toFixed(1) : 0}%)`]);
        visualRow1.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4ADE80' } };
        visualRow1.getCell(1).font = { bold: true, color: { argb: 'FFFFFF' } };

        const visualRow2 = summarySheet.addRow(['Terlambat:', lateCount, `(${totalRecords > 0 ? (lateCount / totalRecords * 100).toFixed(1) : 0}%)`]);
        visualRow2.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FACC15' } };
        visualRow2.getCell(1).font = { bold: true };

        const visualRow3 = summarySheet.addRow(['Tidak Hadir:', absentCount, `(${totalRecords > 0 ? (absentCount / totalRecords * 100).toFixed(1) : 0}%)`]);
        visualRow3.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F87171' } };
        visualRow3.getCell(1).font = { bold: true, color: { argb: 'FFFFFF' } };

        // Chart 2: Bar Chart - Top 10 Performers
        summarySheet.addRow([]);
        summarySheet.addRow([]);
        const barChartTitle = summarySheet.addRow(['📊 GRAFIK BAR: Top 10 Karyawan Berdasarkan Kehadiran']);
        barChartTitle.font = { bold: true, size: 12, color: { argb: '6366F1' } };
        barChartTitle.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EEF2FF' } };
        summarySheet.mergeCells(`A${barChartTitle.number}:F${barChartTitle.number}`);
        summarySheet.getRow(barChartTitle.number).height = 25;

        // Top 10 performers
        const topPerformers = [...employeeStats]
            .sort((a, b) => b.attendanceRate - a.attendanceRate)
            .slice(0, 10);

        summarySheet.addRow([]);
        summarySheet.addRow(['Rank', 'Nama', 'ID', '% Kehadiran', 'Hadir', 'Total']);
        topPerformers.forEach((emp, idx) => {
            const row = summarySheet.addRow([
                idx + 1,
                emp.name,
                emp.employeeId,
                `${emp.attendanceRate}%`,
                emp.present,
                emp.totalDays
            ]);

            // Color coding based on rank
            if (idx === 0) {
                row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD700' } }; // Gold
            } else if (idx === 1) {
                row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C0C0C0' } }; // Silver
            } else if (idx === 2) {
                row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'CD7F32' } }; // Bronze
            }

            row.getCell(1).font = { bold: true };

            // Progress bar visualization in attendance rate
            const percentage = emp.attendanceRate;
            row.getCell(4).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: percentage >= 90 ? '4ADE80' : percentage >= 75 ? 'FACC15' : 'F87171' }
            };
            row.getCell(4).font = { bold: true, color: { argb: 'FFFFFF' } };
        });

        // Set column widths
        summarySheet.columns = [
            { width: 10 }, { width: 25 }, { width: 20 }, { width: 12 },
            { width: 8 }, { width: 10 }, { width: 10 }, { width: 12 },
            { width: 12 }, { width: 12 }, { width: 12 }, { width: 20 }
        ];

        // Configure print settings for A4
        summarySheet.pageSetup = {
            paperSize: 9, // A4
            orientation: 'landscape',
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            margins: {
                left: 0.5,
                right: 0.5,
                top: 0.5,
                bottom: 0.5,
                header: 0.3,
                footer: 0.3
            }
        };

        // ========== SHEET 2: DATA DETAIL ==========
        const detailSheet = workbook.addWorksheet('Data Absensi Detail');

        detailSheet.mergeCells('A1:J1');
        detailSheet.getCell('A1').value = 'DATA ABSENSI DETAIL';
        detailSheet.getCell('A1').font = { bold: true, size: 14 };
        detailSheet.getCell('A1').alignment = { horizontal: 'center' };

        detailSheet.mergeCells('A2:J2');
        detailSheet.getCell('A2').value = `Periode: ${dateRange}`;
        detailSheet.getCell('A2').alignment = { horizontal: 'center' };

        const detailHeaders = ['No', 'ID Karyawan', 'Nama', 'Jabatan', 'Tanggal', 'Jam Masuk', 'Jam Pulang', 'Status', 'Keterangan', 'Latitude', 'Longitude'];
        detailSheet.addRow([]);
        const detailHeaderRow = detailSheet.addRow(detailHeaders);
        detailHeaderRow.font = { bold: true };
        detailHeaderRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '6366F1' } };
            cell.font = { bold: true, color: { argb: 'FFFFFF' } };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            cell.alignment = { horizontal: 'center' };
        });

        formattedData.forEach((record, index) => {
            // Format times as HH:MM
            const checkInTime = record.checkIn ? new Date(record.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }) : '-';
            const checkOutTime = record.checkOut ? new Date(record.checkOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }) : '-';

            // Determine status description
            let keterangan = '';
            if (record.attendanceStatus === 'late') {
                keterangan = '⚠️ TERLAMBAT';
            } else if (record.attendanceStatus === 'absent') {
                keterangan = '❌ TIDAK HADIR';
            } else if (record.attendanceStatus === 'present') {
                keterangan = '✓ Tepat Waktu';
            }

            const row = detailSheet.addRow([
                index + 1,
                record.employeeId,
                record.name,
                record.position,
                new Date(record.date).toLocaleDateString('id-ID'),
                checkInTime,
                checkOutTime,
                record.attendanceStatus,
                keterangan,
                record.latitude || '-',
                record.longitude || '-'
            ]);

            row.eachCell((cell, colNumber) => {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

                // Color-code the status column
                if (colNumber === 9) { // Keterangan column
                    if (record.attendanceStatus === 'late') {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF3C7' } };
                        cell.font = { bold: true, color: { argb: 'D97706' } };
                    } else if (record.attendanceStatus === 'absent') {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
                        cell.font = { bold: true, color: { argb: 'DC2626' } };
                    } else if (record.attendanceStatus === 'present') {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D1FAE5' } };
                        cell.font = { color: { argb: '059669' } };
                    }
                }
            });
        });

        detailSheet.columns = [
            { width: 5 }, { width: 12 }, { width: 25 }, { width: 20 },
            { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 },
            { width: 18 }, { width: 12 }, { width: 12 }
        ];

        // Configure print settings for A4
        detailSheet.pageSetup = {
            paperSize: 9, // A4
            orientation: 'landscape',
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            margins: {
                left: 0.5,
                right: 0.5,
                top: 0.5,
                bottom: 0.5,
                header: 0.3,
                footer: 0.3
            }
        };

        // Generate file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Laporan_Absensi_${new Date().toISOString().split('T')[0]}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    GET api/reports/pdf
// @desc     Generate PDF report with summary
// @access   Private (Admin only)
router.get('/pdf', auth, adminOnly, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const { formattedData, employees } = await getAttendanceData(startDate, endDate);
        const employeeStats = calculateEmployeeStats(formattedData, employees);

        const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Laporan_Absensi_${new Date().toISOString().split('T')[0]}.pdf`);

        doc.pipe(res);

        const dateRange = startDate && endDate
            ? `${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`
            : 'Semua Data';

        // ========== PAGE 1: RINGKASAN ==========
        doc.fontSize(18).font('Helvetica-Bold').text('LAPORAN RINGKASAN ABSENSI', { align: 'center' });
        doc.fontSize(12).font('Helvetica').text(`Periode: ${dateRange}`, { align: 'center' });
        doc.text(`Dibuat: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`, { align: 'center' });
        doc.moveDown(1.5);

        // Summary Stats - Visual Boxes
        const totalRecords = formattedData.length;
        const presentCount = formattedData.filter(d => d.attendanceStatus === 'present').length;
        const lateCount = formattedData.filter(d => d.attendanceStatus === 'late').length;
        const absentCount = formattedData.filter(d => d.attendanceStatus === 'absent').length;

        doc.fontSize(14).font('Helvetica-Bold').text('STATISTIK UMUM', { underline: true });
        doc.moveDown(0.5);

        // Visual stat boxes
        const boxY = doc.y;
        const boxWidth = 180;
        const boxHeight = 60;
        const boxSpacing = 20;

        // Box 1: Total
        doc.rect(30, boxY, boxWidth, boxHeight).fill('#6366F1');
        doc.fillColor('white').fontSize(10).text('Total Absensi', 40, boxY + 10);
        doc.fontSize(24).font('Helvetica-Bold').text(totalRecords.toString(), 40, boxY + 25);
        doc.fontSize(8).font('Helvetica').text('records', 40, boxY + 48);

        // Box 2: Present
        const box2X = 30 + boxWidth + boxSpacing;
        doc.rect(box2X, boxY, boxWidth, boxHeight).fill('#4ADE80');
        doc.fillColor('white').fontSize(10).text('Hadir Tepat Waktu', box2X + 10, boxY + 10);
        doc.fontSize(24).font('Helvetica-Bold').text(presentCount.toString(), box2X + 10, boxY + 25);
        doc.fontSize(8).font('Helvetica').text(`${totalRecords > 0 ? (presentCount / totalRecords * 100).toFixed(1) : 0}%`, box2X + 10, boxY + 48);

        // Box 3: Late
        const box3X = box2X + boxWidth + boxSpacing;
        doc.rect(box3X, boxY, boxWidth, boxHeight).fill('#FACC15');
        doc.fillColor('black').fontSize(10).text('Terlambat', box3X + 10, boxY + 10);
        doc.fontSize(24).font('Helvetica-Bold').text(lateCount.toString(), box3X + 10, boxY + 25);
        doc.fontSize(8).font('Helvetica').text(`${totalRecords > 0 ? (lateCount / totalRecords * 100).toFixed(1) : 0}%`, box3X + 10, boxY + 48);

        // Box 4: Absent
        const box4X = box3X + boxWidth + boxSpacing;
        doc.rect(box4X, boxY, boxWidth, boxHeight).fill('#F87171');
        doc.fillColor('white').fontSize(10).text('Tidak Hadir', box4X + 10, boxY + 10);
        doc.fontSize(24).font('Helvetica-Bold').text(absentCount.toString(), box4X + 10, boxY + 25);
        doc.fontSize(8).font('Helvetica').text(`${totalRecords > 0 ? (absentCount / totalRecords * 100).toFixed(1) : 0}%`, box4X + 10, boxY + 48);

        doc.y = boxY + boxHeight + 30;
        doc.fillColor('black');

        // Visual Pie Chart using rectangles
        doc.fontSize(12).font('Helvetica-Bold').text('DISTRIBUSI STATUS KEHADIRAN (Visual)', { align: 'center', underline: true });
        doc.moveDown(0.5);

        const chartY = doc.y;
        const barWidth = 700;
        const barHeight = 40;

        // Calculate proportions
        const presentWidth = totalRecords > 0 ? (presentCount / totalRecords) * barWidth : 0;
        const lateWidth = totalRecords > 0 ? (lateCount / totalRecords) * barWidth : 0;
        const absentWidth = totalRecords > 0 ? (absentCount / totalRecords) * barWidth : 0;

        // Draw stacked bar chart
        doc.rect(30, chartY, presentWidth, barHeight).fill('#4ADE80');
        doc.rect(30 + presentWidth, chartY, lateWidth, barHeight).fill('#FACC15');
        doc.rect(30 + presentWidth + lateWidth, chartY, absentWidth, barHeight).fill('#F87171');

        // Add labels on bars
        doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
        if (presentWidth > 50) doc.text(`${(presentCount / totalRecords * 100).toFixed(1)}%`, 35, chartY + 12);
        if (lateWidth > 50) doc.text(`${(lateCount / totalRecords * 100).toFixed(1)}%`, 35 + presentWidth, chartY + 12);
        if (absentWidth > 50) doc.text(`${(absentCount / totalRecords * 100).toFixed(1)}%`, 35 + presentWidth + lateWidth, chartY + 12);

        doc.y = chartY + barHeight + 30;
        doc.fillColor('black');


        // Pivot Table
        doc.fontSize(12).font('Helvetica-Bold').text('TABEL RINGKASAN PER KARYAWAN');
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const pivotCols = [30, 60, 160, 260, 320, 370, 420, 480, 550, 630, 710];
        const pivotHeaders = ['No', 'ID', 'Nama', 'Jabatan', 'Hadir', 'Telat', 'Absen', '%Hadir', 'Performa', 'Skor', 'Rekomendasi'];

        doc.rect(30, tableTop - 5, 760, 20).fill('#6366F1');
        doc.fillColor('white').fontSize(8).font('Helvetica-Bold');
        pivotHeaders.forEach((h, i) => doc.text(h, pivotCols[i], tableTop, { width: 80 }));

        doc.fillColor('black').font('Helvetica').fontSize(7);
        let y = tableTop + 20;

        employeeStats.forEach((stat, idx) => {
            if (y > 520) {
                doc.addPage();
                y = 50;
                // Add header again if needed or handle page break
            }

            if (idx % 2 === 0) {
                doc.rect(30, y - 2, 760, 14).fill('#f3f4f6');
                doc.fillColor('black');
            }

            const rowData = [
                (idx + 1).toString(),
                stat.employeeId,
                stat.name.substring(0, 20),
                stat.position.substring(0, 15),
                stat.present.toString(),
                stat.late.toString(),
                stat.absent.toString(),
                `${stat.attendanceRate}%`,
                `${stat.performanceScore}%`,
                stat.promotionScore.toString(),
                stat.isEligibleForPromotion ? 'LAYAK' : '-'
            ];

            rowData.forEach((text, i) => {
                if (i === 10 && stat.isEligibleForPromotion) {
                    doc.fillColor('#059669').font('Helvetica-Bold');
                }
                doc.text(text, pivotCols[i], y, { width: 80 });
                doc.fillColor('black').font('Helvetica');
            });
            y += 14;
        });

        // Promotion Section
        doc.moveDown(2);
        y = doc.y;
        const eligibleEmployees = employeeStats.filter(s => s.isEligibleForPromotion);

        if (y > 450) {
            doc.addPage();
            y = 50;
        }

        doc.fontSize(12).font('Helvetica-Bold').text('DAFTAR KARYAWAN LAYAK DIANGKAT STATUS', 30, y);
        doc.fontSize(8).font('Helvetica').text('Kriteria: Kehadiran ≥ 90%, Skor Performa ≥ 80%, Status bukan Tetap', 30);
        doc.moveDown(0.5);

        if (eligibleEmployees.length > 0) {
            doc.rect(30, doc.y, 450, 18).fill('#D1FAE5');
            doc.fillColor('#059669').fontSize(10).font('Helvetica-Bold');
            doc.text(`${eligibleEmployees.length} Karyawan Memenuhi Syarat:`, 35, doc.y + 4);
            doc.moveDown(1);

            doc.fillColor('black').fontSize(9).font('Helvetica');
            eligibleEmployees.forEach((emp, i) => {
                doc.text(`${i + 1}. ${emp.name} (${emp.employeeId}) - Kehadiran: ${emp.attendanceRate}% | Performa: ${emp.performanceScore}% | ${emp.currentStatus} → Tetap`);
            });
        } else {
            doc.fontSize(9).text('Tidak ada karyawan yang memenuhi kriteria pengangkatan saat ini.');
        }

        // ========== PAGE 2: DETAIL ABSENSI DENGAN JAM ==========
        doc.addPage();

        doc.fontSize(18).font('Helvetica-Bold').text('DATA ABSENSI DETAIL', { align: 'center' });
        doc.fontSize(12).font('Helvetica').text(`Periode: ${dateRange}`, { align: 'center' });
        doc.moveDown(1.5);

        // Detail Table Headers
        const detailTableTop = doc.y;
        const detailCols = [30, 70, 180, 280, 350, 420, 490, 560, 650];
        const detailHeaders = ['No', 'ID', 'Nama', 'Jabatan', 'Tanggal', 'Jam Masuk', 'Jam Pulang', 'Status', 'Keterangan'];

        doc.rect(30, detailTableTop - 5, 750, 20).fill('#6366F1');
        doc.fillColor('white').fontSize(7).font('Helvetica-Bold');
        detailHeaders.forEach((h, i) => doc.text(h, detailCols[i], detailTableTop, { width: 60 }));

        doc.fillColor('black').font('Helvetica').fontSize(6);
        let detailY = detailTableTop + 20;

        formattedData.forEach((record, idx) => {
            if (detailY > 520) {
                doc.addPage();
                detailY = 50;
                // Re-draw header on new page
                doc.rect(30, detailY - 5, 750, 20).fill('#6366F1');
                doc.fillColor('white').fontSize(7).font('Helvetica-Bold');
                detailHeaders.forEach((h, i) => doc.text(h, detailCols[i], detailY, { width: 60 }));
                doc.fillColor('black').font('Helvetica').fontSize(6);
                detailY += 20;
            }

            // Zebra striping
            if (idx % 2 === 0) {
                doc.rect(30, detailY - 2, 750, 14).fill('#f3f4f6');
                doc.fillColor('black');
            }

            // Format times
            const checkInTime = record.checkIn ? new Date(record.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }) : '-';
            const checkOutTime = record.checkOut ? new Date(record.checkOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }) : '-';

            // Status description
            let keterangan = '';
            if (record.attendanceStatus === 'late') {
                keterangan = '⚠️ TERLAMBAT';
            } else if (record.attendanceStatus === 'absent') {
                keterangan = '❌ TIDAK HADIR';
            } else if (record.attendanceStatus === 'present') {
                keterangan = '✓ Tepat Waktu';
            }

            const rowData = [
                (idx + 1).toString(),
                record.employeeId,
                record.name.substring(0, 18),
                record.position.substring(0, 15),
                new Date(record.date).toLocaleDateString('id-ID'),
                checkInTime,
                checkOutTime,
                record.attendanceStatus,
                keterangan
            ];

            rowData.forEach((text, i) => {
                if (i === 8) { // Keterangan column with color
                    if (record.attendanceStatus === 'late') {
                        doc.fillColor('#D97706').font('Helvetica-Bold');
                    } else if (record.attendanceStatus === 'absent') {
                        doc.fillColor('#DC2626').font('Helvetica-Bold');
                    } else if (record.attendanceStatus === 'present') {
                        doc.fillColor('#059669').font('Helvetica');
                    }
                }
                doc.text(text, detailCols[i], detailY, { width: 60 });
                doc.fillColor('black').font('Helvetica');
            });
            detailY += 14;
        });

        doc.end();

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
