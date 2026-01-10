const express = require('express');
const router = express.Router();
const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const auth = require('../middleware/auth');

// @route    GET api/leaves
// @desc     Get all leave requests (Admin) or own requests (Employee)
// @access   Private
router.get('/', auth, async (req, res) => {
    try {
        const leaves = await Leave.find()
            .populate('approvedBy', 'username')
            .sort({ createdAt: -1 });
        res.json(leaves);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    POST api/leaves
// @desc     Create leave request
// @access   Private
router.post('/', auth, async (req, res) => {
    const { employeeId, type, startDate, endDate, reason, attachmentUrl } = req.body;

    try {
        const employee = await Employee.findOne({ employeeId });
        if (!employee) {
            return res.status(404).json({ msg: 'Employee not found' });
        }

        // Calculate days count
        const start = new Date(startDate);
        const end = new Date(endDate);
        const daysCount = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        const newLeave = new Leave({
            employeeId,
            type,
            startDate,
            endDate,
            reason,
            attachmentUrl: attachmentUrl || null,
            daysCount
        });

        const leave = await newLeave.save();
        res.json(leave);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    PUT api/leaves/:id/approve
// @desc     Approve a leave request and auto-create attendance records
// @access   Private (Admin)
router.put('/:id/approve', auth, async (req, res) => {
    const { approvalNotes } = req.body;

    try {
        let leave = await Leave.findById(req.params.id);
        if (!leave) {
            return res.status(404).json({ msg: 'Leave request not found' });
        }

        leave.status = 'approved';
        leave.approvedBy = req.user.id;
        leave.approvalNotes = approvalNotes || '';
        await leave.save();

        // Auto-create attendance records for leave period
        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);
        const employee = await Employee.findOne({ employeeId: leave.employeeId });

        // Create attendance record for each day in the leave period
        const attendanceRecords = [];
        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            const existingAttendance = await Attendance.findOne({
                employeeId: leave.employeeId,
                checkIn: {
                    $gte: new Date(date.setHours(0, 0, 0, 0)),
                    $lt: new Date(date.setHours(23, 59, 59, 999))
                }
            });

            if (!existingAttendance) {
                const attendanceRecord = new Attendance({
                    employeeId: leave.employeeId,
                    employeeName: employee.name,
                    position: employee.position,
                    checkIn: new Date(date.setHours(8, 0, 0, 0)),
                    status: 'leave',
                    type: 'Leave',
                    notes: `Approved ${leave.type} leave: ${leave.reason}`,
                    location: { latitude: 0, longitude: 0 },
                    distance: 0
                });
                attendanceRecords.push(attendanceRecord);
            }
        }

        if (attendanceRecords.length > 0) {
            await Attendance.insertMany(attendanceRecords);
        }

        // Deduct leave balance
        if (leave.type === 'annual' && employee.leaveBalance) {
            employee.leaveBalance.used += leave.daysCount;
            await employee.save();
        }

        res.json({ leave, attendanceCreated: attendanceRecords.length });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    PUT api/leaves/:id/reject
// @desc     Reject a leave request
// @access   Private (Admin)
router.put('/:id/reject', auth, async (req, res) => {
    const { approvalNotes } = req.body;

    try {
        let leave = await Leave.findById(req.params.id);
        if (!leave) {
            return res.status(404).json({ msg: 'Leave request not found' });
        }

        leave.status = 'rejected';
        leave.approvedBy = req.user.id;
        leave.approvalNotes = approvalNotes || '';

        await leave.save();
        res.json(leave);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    DELETE api/leaves/:id
// @desc     Delete a leave request
// @access   Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);
        if (!leave) {
            return res.status(404).json({ msg: 'Leave request not found' });
        }

        await leave.deleteOne();
        res.json({ msg: 'Leave request removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
