const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

// Admin-only middleware
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }
    next();
};

// @route    GET /api/analytics/insights
// @desc     Generate attendance insights from last 30 days
// @access   Private (Admin)
router.get('/insights', auth, adminOnly, async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Fetch all attendance records from last 30 days
        const attendances = await Attendance.find({
            date: { $gte: thirtyDaysAgo }
        }).lean();

        const employees = await Employee.find().lean();

        const insights = [];

        // ===== INSIGHT 1: Late Patterns by Day of Week =====
        const latePatterns = {};
        attendances.forEach(record => {
            if (record.status === 'late') {
                const dayOfWeek = new Date(record.checkIn).toLocaleDateString('id-ID', { weekday: 'long' });
                if (!latePatterns[record.employeeId]) {
                    latePatterns[record.employeeId] = {};
                }
                latePatterns[record.employeeId][dayOfWeek] = (latePatterns[record.employeeId][dayOfWeek] || 0) + 1;
            }
        });

        // Find employees with >70% late on specific day
        Object.keys(latePatterns).forEach(employeeId => {
            const employee = employees.find(e => e.employeeId === employeeId);
            if (!employee) return;

            Object.keys(latePatterns[employeeId]).forEach(day => {
                const lateCount = latePatterns[employeeId][day];
                const totalDays = attendances.filter(a =>
                    a.employeeId === employeeId &&
                    new Date(a.checkIn).toLocaleDateString('id-ID', { weekday: 'long' }) === day
                ).length;

                const percentage = (lateCount / totalDays) * 100;
                if (percentage >= 70 && totalDays >= 3) {
                    insights.push({
                        type: 'late_pattern',
                        severity: percentage >= 80 ? 'critical' : 'warning',
                        title: `${employee.name} sering terlambat hari ${day}`,
                        description: `${Math.round(percentage)}% kehadiran di hari ${day} adalah terlambat (${lateCount}/${totalDays} hari)`,
                        employeeId: employee.employeeId,
                        employeeName: employee.name,
                        actionRequired: true,
                        metadata: { day, percentage: Math.round(percentage), lateCount, totalDays }
                    });
                }
            });
        });

        // ===== INSIGHT 2: Department Absence Trends =====
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const departments = [...new Set(employees.map(e => e.department))];
        departments.forEach(dept => {
            const deptEmployees = employees.filter(e => e.department === dept);
            const deptEmployeeIds = deptEmployees.map(e => e.employeeId);

            const lastWeekAbsences = attendances.filter(a =>
                deptEmployeeIds.includes(a.employeeId) &&
                a.status === 'absent' &&
                new Date(a.date) >= sevenDaysAgo
            ).length;

            const previousWeekAbsences = attendances.filter(a =>
                deptEmployeeIds.includes(a.employeeId) &&
                a.status === 'absent' &&
                new Date(a.date) >= fourteenDaysAgo &&
                new Date(a.date) < sevenDaysAgo
            ).length;

            if (previousWeekAbsences > 0) {
                const changePercent = ((lastWeekAbsences - previousWeekAbsences) / previousWeekAbsences) * 100;
                if (changePercent >= 30) {
                    insights.push({
                        type: 'absence_trend',
                        severity: changePercent >= 50 ? 'critical' : 'warning',
                        title: `Ketidakhadiran di ${dept} meningkat ${Math.round(changePercent)}%`,
                        description: `Dari ${previousWeekAbsences} kasus minggu lalu menjadi ${lastWeekAbsences} kasus minggu ini`,
                        department: dept,
                        actionRequired: true,
                        metadata: { changePercent: Math.round(changePercent), current: lastWeekAbsences, previous: previousWeekAbsences }
                    });
                }
            }
        });

        // ===== INSIGHT 3: Performance Stars (100% attendance) =====
        const employeeStats = employees.map(emp => {
            const empRecords = attendances.filter(a => a.employeeId === emp.employeeId);
            const presentCount = empRecords.filter(a => a.status === 'present').length;
            const attendanceRate = empRecords.length > 0 ? (presentCount / empRecords.length) * 100 : 0;

            return {
                employeeId: emp.employeeId,
                name: emp.name,
                position: emp.position,
                attendanceRate,
                totalDays: empRecords.length
            };
        }).filter(stat => stat.totalDays >= 10); // Minimum 10 days data

        const stars = employeeStats.filter(stat => stat.attendanceRate === 100).slice(0, 5);
        if (stars.length > 0) {
            insights.push({
                type: 'performance_star',
                severity: 'info',
                title: `${stars.length} karyawan dengan kehadiran sempurna`,
                description: stars.map(s => `${s.name} (${s.position})`).join(', '),
                actionRequired: false,
                metadata: { stars }
            });
        }

        // ===== INSIGHT 4: Risk Employees (<75% attendance) =====
        const riskEmployees = employeeStats.filter(stat => stat.attendanceRate < 75 && stat.totalDays >= 10);
        if (riskEmployees.length > 0) {
            riskEmployees.forEach(emp => {
                insights.push({
                    type: 'risk_employee',
                    severity: emp.attendanceRate < 60 ? 'critical' : 'warning',
                    title: `${emp.name} - Kehadiran rendah (${Math.round(emp.attendanceRate)}%)`,
                    description: `Hanya hadir ${Math.round(emp.attendanceRate)}% dari ${emp.totalDays} hari. Perlu tindak lanjut HR.`,
                    employeeId: emp.employeeId,
                    employeeName: emp.name,
                    actionRequired: true,
                    metadata: { attendanceRate: Math.round(emp.attendanceRate), totalDays: emp.totalDays }
                });
            });
        }

        // Sort by severity: critical > warning > info
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

        res.json({
            insights,
            summary: {
                total: insights.length,
                critical: insights.filter(i => i.severity === 'critical').length,
                warning: insights.filter(i => i.severity === 'warning').length,
                info: insights.filter(i => i.severity === 'info').length
            },
            generatedAt: new Date()
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
