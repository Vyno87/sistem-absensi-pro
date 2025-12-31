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

// Helper function to get attendance data
const getAttendanceData = async (startDate, endDate) => {
    let query = {};
    if (startDate && endDate) {
        query.date = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
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
    return attendanceRecords.map(record => {
        const emp = employeeMap[record.employeeId] || {};
        return {
            employeeId: record.employeeId || 'N/A',
            name: emp.name || 'Unknown',
            position: emp.position || 'N/A',
            department: emp.department || 'N/A',
            date: new Date(record.date).toLocaleDateString('id-ID'),
            checkIn: new Date(record.checkIn).toLocaleTimeString('id-ID'),
            checkOut: record.checkOut ? new Date(record.checkOut).toLocaleTimeString('id-ID') : '-',
            status: record.status,
            latitude: record.latitude || '-',
            longitude: record.longitude || '-'
        };
    });
};

// @route    GET api/reports/attendance
// @desc     Export attendance records to JSON
// @access   Private (Admin only)
router.get('/attendance', auth, adminOnly, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const data = await getAttendanceData(startDate, endDate);
        res.json(data);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    GET api/reports/excel
// @desc     Generate Excel report
// @access   Private (Admin only)
router.get('/excel', auth, adminOnly, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const data = await getAttendanceData(startDate, endDate);

        // Create workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Sistem Absensi PRO';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet('Laporan Absensi');

        // Add title
        worksheet.mergeCells('A1:J1');
        worksheet.getCell('A1').value = 'LAPORAN ABSENSI KARYAWAN';
        worksheet.getCell('A1').font = { bold: true, size: 16 };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };

        // Add date range
        worksheet.mergeCells('A2:J2');
        const dateRange = startDate && endDate
            ? `Periode: ${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`
            : 'Semua Data';
        worksheet.getCell('A2').value = dateRange;
        worksheet.getCell('A2').alignment = { horizontal: 'center' };

        // Add headers
        const headers = ['No', 'ID Karyawan', 'Nama', 'Jabatan', 'Tanggal', 'Check In', 'Check Out', 'Status', 'Latitude', 'Longitude'];
        worksheet.addRow([]);
        const headerRow = worksheet.addRow(headers);
        headerRow.font = { bold: true };
        headerRow.eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '6366F1' }
            };
            cell.font = { bold: true, color: { argb: 'FFFFFF' } };
            cell.alignment = { horizontal: 'center' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // Add data rows
        data.forEach((record, index) => {
            const row = worksheet.addRow([
                index + 1,
                record.employeeId,
                record.name,
                record.position,
                record.date,
                record.checkIn,
                record.checkOut,
                record.status,
                record.latitude,
                record.longitude
            ]);
            row.eachCell(cell => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });

        // Set column widths
        worksheet.columns = [
            { width: 5 },  // No
            { width: 15 }, // ID
            { width: 25 }, // Nama
            { width: 20 }, // Jabatan
            { width: 15 }, // Tanggal
            { width: 12 }, // Check In
            { width: 12 }, // Check Out
            { width: 12 }, // Status
            { width: 15 }, // Lat
            { width: 15 }, // Long
        ];

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
// @desc     Generate PDF report
// @access   Private (Admin only)
router.get('/pdf', auth, adminOnly, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const data = await getAttendanceData(startDate, endDate);

        // Create PDF document
        const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Laporan_Absensi_${new Date().toISOString().split('T')[0]}.pdf`);

        doc.pipe(res);

        // Title
        doc.fontSize(18).font('Helvetica-Bold').text('LAPORAN ABSENSI KARYAWAN', { align: 'center' });
        doc.moveDown(0.5);

        // Date range
        const dateRange = startDate && endDate
            ? `Periode: ${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`
            : 'Semua Data';
        doc.fontSize(10).font('Helvetica').text(dateRange, { align: 'center' });
        doc.fontSize(10).text(`Dibuat: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`, { align: 'center' });
        doc.moveDown(1);

        // Table headers
        const tableTop = 120;
        const colWidths = [30, 70, 120, 100, 80, 60, 60, 60, 80, 80];
        const headers = ['No', 'ID', 'Nama', 'Jabatan', 'Tanggal', 'Masuk', 'Keluar', 'Status', 'Lat', 'Long'];

        let x = 30;
        doc.fontSize(9).font('Helvetica-Bold');

        // Draw header background
        doc.rect(30, tableTop - 5, 740, 20).fill('#6366F1');
        doc.fillColor('white');

        headers.forEach((header, i) => {
            doc.text(header, x + 2, tableTop, { width: colWidths[i], align: 'left' });
            x += colWidths[i];
        });

        // Table rows
        doc.fillColor('black').font('Helvetica').fontSize(8);
        let y = tableTop + 20;

        data.forEach((record, index) => {
            // Check if we need a new page
            if (y > 520) {
                doc.addPage();
                y = 50;
            }

            // Alternate row colors
            if (index % 2 === 0) {
                doc.rect(30, y - 3, 740, 15).fill('#f3f4f6');
                doc.fillColor('black');
            }

            x = 30;
            const rowData = [
                (index + 1).toString(),
                record.employeeId,
                record.name,
                record.position,
                record.date,
                record.checkIn,
                record.checkOut,
                record.status,
                record.latitude.toString(),
                record.longitude.toString()
            ];

            rowData.forEach((text, i) => {
                doc.text(text, x + 2, y, { width: colWidths[i] - 4, align: 'left' });
                x += colWidths[i];
            });

            y += 15;
        });

        // Summary
        doc.moveDown(2);
        doc.fontSize(10).font('Helvetica-Bold').text(`Total Records: ${data.length}`, 30, y + 20);

        doc.end();

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

