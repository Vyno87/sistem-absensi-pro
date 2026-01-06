const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const LateAlert = require('../models/LateAlert');

// Track alerts sent today to prevent duplicates
const alertsSentToday = new Set();

// Reset daily at midnight
setInterval(() => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
        alertsSentToday.clear();
    }
}, 60000); // Check every minute

const checkLateEmployees = async () => {
    try {
        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get all key employees
        const keyEmployees = await Employee.find({ isKeyPerson: true }).populate('shiftId');

        for (const employee of keyEmployees) {
            // Skip if no shift assigned
            if (!employee.shiftId) continue;

            // Check if already alerted today
            const alertKey = `${employee.employeeId}-${today.toDateString()}`;
            if (alertsSentToday.has(alertKey)) continue;

            // Check if employee has checked in today
            const todayAttendance = await Attendance.findOne({
                employeeId: employee.employeeId,
                date: { $gte: today }
            });

            if (todayAttendance) continue; // Already checked in

            // Calculate grace period (shift start + 15 minutes)
            const [startHour, startMinute] = employee.shiftId.startTime.split(':').map(Number);
            const graceTime = new Date(now);
            graceTime.setHours(startHour, startMinute + 15, 0, 0);

            // If current time is past grace period, create alert
            if (now >= graceTime) {
                // Check if alert already exists
                const existingAlert = await LateAlert.findOne({
                    employeeId: employee.employeeId,
                    alertTime: { $gte: today },
                    status: 'active'
                });

                if (!existingAlert) {
                    // Create new alert
                    await LateAlert.create({
                        employeeId: employee.employeeId,
                        employeeName: employee.name,
                        position: employee.position,
                        expectedTime: employee.shiftId.startTime
                    });

                    alertsSentToday.add(alertKey);
                    console.log(`⚠️ Late alert created for ${employee.name} (${employee.employeeId})`);
                }
            }
        }
    } catch (error) {
        console.error('Error in late employee check:', error);
    }
};

module.exports = checkLateEmployees;
