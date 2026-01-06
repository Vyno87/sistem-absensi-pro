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

// @route    GET /api/cron/weekly-report
// @desc     Generate and send weekly attendance report
router.get('/weekly-report', verifyCronSecret, async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const now = new Date();

        // Fetch attendance records for the last 7 days
        const attendances = await Attendance.find({
            date: { $gte: sevenDaysAgo, $lt: now }
        });

        // Calculate statistics
        const totalAttendance = attendances.length;
        const daysPresent = new Set(attendances.map(a => a.date.toISOString().split('T')[0])).size || 1;
        const avgDaily = Math.round(totalAttendance / daysPresent);

        const lateCount = attendances.filter(a => a.status === 'late').length;
        const lateRate = totalAttendance > 0 ? Math.round((lateCount / totalAttendance) * 100) : 0;

        // Simple Insight: Top Late Employees
        const lateEmployees = {};
        attendances.filter(a => a.status === 'late').forEach(a => {
            lateEmployees[a.employeeId] = (lateEmployees[a.employeeId] || 0) + 1;
        });

        // Get employee names for insights (simplified)
        const insights = [];
        const topLateIds = Object.keys(lateEmployees)
            .sort((a, b) => lateEmployees[b] - lateEmployees[a])
            .slice(0, 3);

        if (topLateIds.length > 0) {
            insights.push({
                title: `${topLateIds.length} karyawan terpantau sering terlambat minggu ini.`
            });
        }

        if (lateRate > 20) {
            insights.push({
                title: `Tingkat keterlambatan keseluruhan (${lateRate}%) cukup tinggi.`
            });
        }

        const stats = {
            totalAttendance,
            avgDaily,
            lateRate,
            insights
        };

        const recipient = process.env.REPORT_RECIPIENTS || process.env.SMTP_USER;

        if (!recipient) {
            return res.status(400).json({ msg: 'No recipient configured' });
        }

        const result = await sendEmail(recipient, 'weeklyReport', stats);

        res.json({ success: true, stats, emailResult: result });
    } catch (err) {
        console.error('Cron Weekly Error:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
