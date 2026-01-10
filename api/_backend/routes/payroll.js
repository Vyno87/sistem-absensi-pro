const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Employee = require('../models/Employee');
const Payroll = require('../models/Payroll');
const { calculatePayroll, generatePayroll, getPayrollHistory } = require('../services/payrollService');

// @route    PUT api/payroll/config/:employeeId
// @desc     Update salary configuration for an employee
// @access   Private (Admin)
router.put('/config/:employeeId', auth, async (req, res) => {
    const { employeeId } = req.params;
    const { type, amount, lateDeduction, overtimeRate } = req.body;

    try {
        const employee = await Employee.findOne({ employeeId });
        if (!employee) {
            return res.status(404).json({ msg: 'Employee not found' });
        }

        // Update salary configuration
        employee.salaryConfig = {
            type: type || 'daily',
            amount: amount || 0,
            lateDeduction: lateDeduction || 5000,
            overtimeRate: overtimeRate || 1.5
        };

        await employee.save();
        res.json({ msg: 'Salary configuration updated', salaryConfig: employee.salaryConfig });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    GET api/payroll/config/:employeeId
// @desc     Get salary configuration for an employee
// @access   Private
router.get('/config/:employeeId', auth, async (req, res) => {
    try {
        const employee = await Employee.findOne({ employeeId: req.params.employeeId });
        if (!employee) {
            return res.status(404).json({ msg: 'Employee not found' });
        }

        res.json(employee.salaryConfig || { type: 'daily', amount: 0, lateDeduction: 5000, overtimeRate: 1.5 });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    POST api/payroll/calculate
// @desc     Calculate payroll for an employee (preview, no save)
// @access   Private (Admin)
router.post('/calculate', auth, async (req, res) => {
    const { employeeId, month, year } = req.body;

    try {
        const payrollData = await calculatePayroll(employeeId, month, year);
        res.json(payrollData);
    } catch (err) {
        console.error(err.message);
        res.status(400).json({ msg: err.message });
    }
});

// @route    POST api/payroll/generate
// @desc     Generate and save payroll record
// @access   Private (Admin)
router.post('/generate', auth, async (req, res) => {
    const { employeeId, month, year } = req.body;

    try {
        const payroll = await generatePayroll(employeeId, month, year, req.user.id);
        res.json(payroll);
    } catch (err) {
        console.error(err.message);
        res.status(400).json({ msg: err.message });
    }
});

// @route    GET api/payroll/history/:employeeId
// @desc     Get payroll history for an employee
// @access   Private
router.get('/history/:employeeId', auth, async (req, res) => {
    try {
        const payrolls = await getPayrollHistory(req.params.employeeId);
        res.json(payrolls);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    GET api/payroll/all
// @desc     Get all payroll records for a specific period
// @access   Private (Admin)
router.get('/all', auth, async (req, res) => {
    const { month, year } = req.query;

    try {
        const query = {};
        if (month && year) {
            query['period.month'] = parseInt(month);
            query['period.year'] = parseInt(year);
        }

        const payrolls = await Payroll.find(query)
            .sort({ 'period.year': -1, 'period.month': -1, employeeId: 1 })
            .populate('generatedBy', 'username');

        res.json(payrolls);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    DELETE api/payroll/:id
// @desc     Delete a payroll record
// @access   Private (Admin)
router.delete('/:id', auth, async (req, res) => {
    try {
        const payroll = await Payroll.findById(req.params.id);
        if (!payroll) {
            return res.status(404).json({ msg: 'Payroll record not found' });
        }

        await payroll.deleteOne();
        res.json({ msg: 'Payroll record deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
