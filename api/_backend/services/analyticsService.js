const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

/**
 * AI Predictive Analytics Service
 * Provides intelligent insights for HR management
 */

/**
 * Detect late patterns by day of week
 * @param {string} employeeId - Employee ID to analyze
 * @param {number} daysBack - Number of days to look back (default: 90)
 */
const detectLatePattern = async (employeeId, daysBack = 90) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const attendanceRecords = await Attendance.find({
        employeeId,
        date: { $gte: cutoffDate }
    }).lean();

    // Group by day of week
    const dayStats = {
        0: { name: 'Minggu', total: 0, late: 0 },
        1: { name: 'Senin', total: 0, late: 0 },
        2: { name: 'Selasa', total: 0, late: 0 },
        3: { name: 'Rabu', total: 0, late: 0 },
        4: { name: 'Kamis', total: 0, late: 0 },
        5: { name: 'Jumat', total: 0, late: 0 },
        6: { name: 'Sabtu', total: 0, late: 0 }
    };

    attendanceRecords.forEach(record => {
        const dayOfWeek = new Date(record.date).getDay();
        dayStats[dayOfWeek].total++;
        if (record.status === 'late') {
            dayStats[dayOfWeek].late++;
        }
    });

    // Calculate rates and identify risk days
    const riskDays = [];
    Object.keys(dayStats).forEach(day => {
        const stat = dayStats[day];
        if (stat.total > 0) {
            stat.rate = (stat.late / stat.total) * 100;
            if (stat.rate >= 30 && stat.total >= 3) { // At least 30% late rate and 3+ occurrences
                riskDays.push(stat.name);
            }
        } else {
            stat.rate = 0;
        }
    });

    return {
        dayStats,
        riskDays,
        hasPattern: riskDays.length > 0
    };
};

/**
 * Calculate absence risk score for an employee
 * @param {string} employeeId - Employee ID
 */
const calculateAbsenceRisk = async (employeeId) => {
    const employee = await Employee.findOne({ employeeId }).lean();
    if (!employee) return { score: 0, level: 'low' };

    // Get last 90 days attendance
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const attendanceRecords = await Attendance.find({
        employeeId,
        date: { $gte: cutoffDate }
    }).lean();

    const totalDays = attendanceRecords.length;
    if (totalDays === 0) return { score: 0, level: 'low', reason: 'Insufficient data' };

    // 1. Historical absence rate (40%)
    const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
    const absenceRate = (absentCount / totalDays) * 100;
    const historicalScore = absenceRate * 0.4;

    // 2. Recent trend - last 30 days (30%)
    const recentCutoff = new Date();
    recentCutoff.setDate(recentCutoff.getDate() - 30);
    const recentRecords = attendanceRecords.filter(r => new Date(r.date) >= recentCutoff);
    const recentAbsent = recentRecords.filter(r => r.status === 'absent').length;
    const recentRate = recentRecords.length > 0 ? (recentAbsent / recentRecords.length) * 100 : 0;
    const trendScore = recentRate * 0.3;

    // 3. Leave balance usage (20%)
    const leaveUsageRate = employee.leaveBalance?.used
        ? (employee.leaveBalance.used / employee.leaveBalance.annual) * 100
        : 0;
    const leaveScore = leaveUsageRate > 80 ? 20 : leaveUsageRate * 0.2;

    // 4. Performance factor (10%) - inverse relationship
    const performanceScore = employee.performanceScore || 0;
    const performanceFactor = performanceScore < 70 ? 10 : (100 - performanceScore) * 0.1;

    // Total risk score
    const totalScore = historicalScore + trendScore + leaveScore + performanceFactor;

    let level = 'low';
    if (totalScore >= 60) level = 'high';
    else if (totalScore >= 30) level = 'medium';

    return {
        score: Math.round(totalScore),
        level,
        breakdown: {
            historical: Math.round(historicalScore),
            recent: Math.round(trendScore),
            leave: Math.round(leaveScore),
            performance: Math.round(performanceFactor)
        }
    };
};

/**
 * Calculate comprehensive performance score
 * @param {string} employeeId - Employee ID
 */
const calculatePerformanceScore = async (employeeId) => {
    const employee = await Employee.findOne({ employeeId }).lean();
    if (!employee) return 0;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const attendanceRecords = await Attendance.find({
        employeeId,
        date: { $gte: cutoffDate }
    }).lean();

    const totalDays = attendanceRecords.length;
    if (totalDays === 0) return 0;

    const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
    const lateCount = attendanceRecords.filter(r => r.status === 'late').length;

    // 1. Attendance Rate (40%)
    const attendanceRate = ((presentCount + lateCount) / totalDays) * 100;
    const attendanceScore = attendanceRate * 0.4;

    // 2. Punctuality Rate (30%)
    const punctualityRate = (presentCount / totalDays) * 100;
    const punctualityScore = punctualityRate * 0.3;

    // 3. Overtime Contribution (20%)
    const overtimeHours = attendanceRecords.reduce((total, record) => {
        if (record.checkIn && record.checkOut) {
            const start = new Date(record.checkIn);
            const end = new Date(record.checkOut);
            const hours = (end - start) / (1000 * 60 * 60);
            return total + Math.max(0, hours - 9); // Standard 9 hour day
        }
        return total;
    }, 0);
    const overtimeScore = Math.min(20, (overtimeHours / 10) * 20); // Max 20 points

    // 4. Leave Management (10%)
    const leaveBalance = employee.leaveBalance || { annual: 12, used: 0 };
    const leaveUsageRate = (leaveBalance.used / leaveBalance.annual) * 100;
    const leaveScore = leaveUsageRate < 50 ? 10 : Math.max(0, 10 - (leaveUsageRate - 50) * 0.2);

    const totalScore = attendanceScore + punctualityScore + overtimeScore + leaveScore;

    return Math.round(totalScore);
};

/**
 * Get promotion recommendations
 */
const getPromotionRecommendations = async () => {
    const employees = await Employee.find().lean();
    const recommendations = [];

    for (const employee of employees) {
        // Skip if already permanent
        if (employee.status === 'Tetap') continue;

        // Calculate metrics
        const performanceScore = await calculatePerformanceScore(employee.employeeId);

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 90);

        const attendanceRecords = await Attendance.find({
            employeeId: employee.employeeId,
            date: { $gte: cutoffDate }
        }).lean();

        const totalDays = attendanceRecords.length;
        if (totalDays < 20) continue; // Need at least 20 days of data

        const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
        const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
        const attendanceRate = ((presentCount + lateCount) / totalDays) * 100;

        // Check eligibility
        const isEligible = attendanceRate >= 90 && performanceScore >= 80;

        if (isEligible) {
            const promotionScore = (attendanceRate * 0.4 + performanceScore * 0.6).toFixed(1);
            recommendations.push({
                employeeId: employee.employeeId,
                name: employee.name,
                position: employee.position,
                currentStatus: employee.status,
                attendanceRate: attendanceRate.toFixed(1),
                performanceScore,
                promotionScore: parseFloat(promotionScore),
                recommendation: `${employee.status} → Tetap`
            });
        }
    }

    // Sort by promotion score
    return recommendations.sort((a, b) => b.promotionScore - a.promotionScore);
};

/**
 * Generate comprehensive insights for dashboard
 */
const generateInsights = async () => {
    const insights = [];
    const employees = await Employee.find().lean();

    for (const employee of employees) {
        // 1. Late Pattern Detection
        const latePattern = await detectLatePattern(employee.employeeId);
        if (latePattern.hasPattern) {
            insights.push({
                type: 'late_pattern',
                severity: 'warning',
                title: `Pola Terlambat Terdeteksi: ${employee.name}`,
                description: `Sering terlambat di hari: ${latePattern.riskDays.join(', ')}`,
                employeeId: employee.employeeId,
                employeeName: employee.name,
                department: employee.position,
                actionRequired: true,
                metadata: latePattern
            });
        }

        // 2. Absence Risk
        const absenceRisk = await calculateAbsenceRisk(employee.employeeId);
        if (absenceRisk.level === 'high') {
            insights.push({
                type: 'risk_employee',
                severity: 'critical',
                title: `Risiko Ketidakhadiran Tinggi: ${employee.name}`,
                description: `Skor risiko: ${absenceRisk.score}/100. Perlu tindak lanjut segera.`,
                employeeId: employee.employeeId,
                employeeName: employee.name,
                department: employee.position,
                actionRequired: true,
                metadata: absenceRisk
            });
        } else if (absenceRisk.level === 'medium') {
            insights.push({
                type: 'absence_trend',
                severity: 'warning',
                title: `Risiko Ketidakhadiran Sedang: ${employee.name}`,
                description: `Skor risiko: ${absenceRisk.score}/100. Monitoring diperlukan.`,
                employeeId: employee.employeeId,
                employeeName: employee.name,
                department: employee.position,
                actionRequired: false,
                metadata: absenceRisk
            });
        }

        // 3. Performance Stars
        const performanceScore = await calculatePerformanceScore(employee.employeeId);
        if (performanceScore >= 90) {
            insights.push({
                type: 'performance_star',
                severity: 'info',
                title: `Karyawan Berprestasi: ${employee.name}`,
                description: `Skor performa ${performanceScore}/100. Kandidat promosi potensial.`,
                employeeId: employee.employeeId,
                employeeName: employee.name,
                department: employee.position,
                actionRequired: false,
                metadata: { performanceScore }
            });
        }
    }

    // 4. Promotion Recommendations
    const promotionCandidates = await getPromotionRecommendations();
    promotionCandidates.slice(0, 5).forEach(candidate => {
        insights.push({
            type: 'promotion_ready',
            severity: 'info',
            title: `Layak Promosi: ${candidate.name}`,
            description: `Skor promosi: ${candidate.promotionScore}. Kehadiran ${candidate.attendanceRate}%, Performa ${candidate.performanceScore}%.`,
            employeeId: candidate.employeeId,
            employeeName: candidate.name,
            department: candidate.position,
            actionRequired: true,
            metadata: candidate
        });
    });

    // Calculate summary
    const summary = {
        total: insights.length,
        critical: insights.filter(i => i.severity === 'critical').length,
        warning: insights.filter(i => i.severity === 'warning').length,
        info: insights.filter(i => i.severity === 'info').length
    };

    return {
        insights,
        summary,
        generatedAt: new Date().toISOString()
    };
};

module.exports = {
    detectLatePattern,
    calculateAbsenceRisk,
    calculatePerformanceScore,
    getPromotionRecommendations,
    generateInsights
};
