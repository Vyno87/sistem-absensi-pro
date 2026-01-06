const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const LateAlert = require('../models/LateAlert');
const { sendEmail } = require('../services/emailService');

// Verify Cron Secret to prevent unauthorized access
const verifyCronSecret = (req, res, next) => {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.authorization;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ msg: 'Unauthorized' });
    }
    next();
};

// @route    GET /api/cron/daily-report
// @desc     Generate and send yesterday's attendance report
router.get('/daily-report', verifyCronSecret, async (req, res) => {
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Fetch attendance stats for yesterday
        const attendances = await Attendance.find({
            date: { $gte: yesterday, $lt: today }
        });

        const stats = {
            total: attendances.length,
            present: attendances.filter(a => a.status === 'present').length,
            late: attendances.filter(a => a.status === 'late').length,
            absent: attendances.filter(a => a.status === 'absent').length
        };

        // Fetch late alerts for yesterday
        const lateAlerts = await LateAlert.find({
            alertTime: { $gte: yesterday, $lt: today }
        });

        stats.lateAlerts = lateAlerts.map(alert => ({
            employeeName: alert.employeeName,
            position: alert.position,
            expectedTime: alert.expectedTime
        }));

        // Get recipient from env
        const recipient = process.env.REPORT_RECIPIENTS || process.env.SMTP_USER;

        if (!recipient) {
            return res.status(400).json({ msg: 'No recipient configured' });
        }

        const result = await sendEmail(recipient, 'dailyReport', stats);

        res.json({ success: true, stats, emailResult: result });
    } catch (err) {
        console.error('Cron Error:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
