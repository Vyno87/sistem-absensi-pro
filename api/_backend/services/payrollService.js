const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Payroll = require('../models/Payroll');

/**
 * Calculate payroll for a specific employee and period
 * @param {string} employeeId - Employee ID
 * @param {number} month - Month (1-12)
 * @param {number} year - Year (e.g., 2026)
 * @returns {Object} Payroll data
 */
async function calculatePayroll(employeeId, month, year) {
    try {
        const employee = await Employee.findOne({ employeeId });
        if (!employee) {
            throw new Error('Employee not found');
        }

        // Check if salary config exists
        if (!employee.salaryConfig || !employee.salaryConfig.amount) {
            throw new Error('Salary configuration not set for this employee');
        }

        // Get start and end of month
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

        // Fetch attendance records for the period
        const attendanceRecords = await Attendance.find({
            employeeId,
            checkIn: { $gte: startOfMonth, $lte: endOfMonth }
        });

        // Calculate working days in month (excluding Sundays typically)
        const workingDays = getWorkingDaysInMonth(month, year);

        // Count attendance stats
        const presentDays = attendanceRecords.filter(a =>
            a.status === 'present' || a.status === 'late'
        ).length;

        const lateDays = attendanceRecords.filter(a => a.status === 'late').length;
        const leaveDays = attendanceRecords.filter(a => a.status === 'leave').length;
        const absentDays = workingDays - presentDays - leaveDays;

        // Calculate base salary
        let baseSalary;
        const config = employee.salaryConfig;

        if (config.type === 'monthly') {
            // Monthly salary: fixed amount
            baseSalary = config.amount;
        } else {
            // Daily salary: multiply by present days + leave days
            baseSalary = (presentDays + leaveDays) * config.amount;
        }

        // Calculate deductions
        const lateDeduction = lateDays * (config.lateDeduction || 5000);
        const absentDeduction = config.type === 'monthly'
            ? absentDays * (config.amount / workingDays)
            : 0; // For daily workers, absence is already reflected in baseSalary

        const totalDeductions = lateDeduction + absentDeduction;

        // Calculate bonuses (overtime, etc.) - placeholder for now
        const bonuses = 0;

        // Net salary
        const netSalary = baseSalary - totalDeductions + bonuses;

        return {
            employeeId,
            employeeName: employee.name,
            period: { month, year },
            workingDays,
            presentDays,
            lateDays,
            absentDays,
            leaveDays,
            overtimeHours: 0, // Placeholder
            baseSalary,
            deductions: totalDeductions,
            lateDeduction,
            absentDeduction,
            bonuses,
            netSalary,
            salaryType: config.type
        };
    } catch (error) {
        console.error('Payroll calculation error:', error);
        throw error;
    }
}

/**
 * Generate and save payroll record
 */
async function generatePayroll(employeeId, month, year, generatedBy) {
    try {
        // Check if payroll already exists for this period
        const existingPayroll = await Payroll.findOne({
            employeeId,
            'period.month': month,
            'period.year': year
        });

        if (existingPayroll) {
            throw new Error('Payroll already generated for this period');
        }

        // Calculate payroll
        const payrollData = await calculatePayroll(employeeId, month, year);

        // Create payroll record
        const payroll = new Payroll({
            ...payrollData,
            generatedBy,
            generatedAt: new Date()
        });

        await payroll.save();
        return payroll;
    } catch (error) {
        console.error('Generate payroll error:', error);
        throw error;
    }
}

/**
 * Get working days in a month (excluding Sundays)
 */
function getWorkingDaysInMonth(month, year) {
    const daysInMonth = new Date(year, month, 0).getDate();
    let workingDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay();

        // Count all days except Sunday (0)
        if (dayOfWeek !== 0) {
            workingDays++;
        }
    }

    return workingDays;
}

/**
 * Get payroll history for an employee
 */
async function getPayrollHistory(employeeId, limit = 12) {
    try {
        const payrolls = await Payroll.find({ employeeId })
            .sort({ 'period.year': -1, 'period.month': -1 })
            .limit(limit)
            .populate('generatedBy', 'username');

        return payrolls;
    } catch (error) {
        console.error('Get payroll history error:', error);
        throw error;
    }
}

module.exports = {
    calculatePayroll,
    generatePayroll,
    getPayrollHistory,
    getWorkingDaysInMonth
};
