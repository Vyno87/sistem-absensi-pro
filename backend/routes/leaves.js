const express = require('express');
const router = express.Router();
const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
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
    const { employeeId, type, startDate, endDate, reason } = req.body;

    try {
        const employee = await Employee.findOne({ employeeId });
        if (!employee) {
            return res.status(404).json({ msg: 'Employee not found' });
        }

        const newLeave = new Leave({
            employeeId,
            type,
            startDate,
            endDate,
            reason
        });

        const leave = await newLeave.save();
        res.json(leave);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    PUT api/leaves/:id/approve
// @desc     Approve a leave request
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
        res.json(leave);
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
