const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const auth = require('../middleware/auth');

// @route    GET api/reports/attendance
// @desc     Export attendance records to JSON (for Excel conversion in frontend)
// @access   Private
router.get('/attendance', auth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let query = {};
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const attendanceRecords = await Attendance.find(query)
            .populate('employeeId', 'name position department')
            .sort({ date: -1 })
            .lean();

        // Format data for export
        const formattedData = attendanceRecords.map(record => ({
            'Employee ID': record.employeeId?.employeeId || 'N/A',
            'Name': record.employeeId?.name || 'Unknown',
            'Position': record.employeeId?.position || 'N/A',
            'Department': record.employeeId?.department || 'N/A',
            'Date': new Date(record.date).toLocaleDateString('id-ID'),
            'Check In': new Date(record.checkIn).toLocaleTimeString('id-ID'),
            'Check Out': record.checkOut ? new Date(record.checkOut).toLocaleTimeString('id-ID') : '-',
            'Status': record.status,
            'Latitude': record.latitude || '-',
            'Longitude': record.longitude || '-'
        }));

        res.json(formattedData);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
