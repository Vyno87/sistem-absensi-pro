const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const auth = require('../middleware/auth');

// @route    POST api/attendance  
// @desc     Record attendance  
// @access   Private  
router.post('/', auth, async (req, res) => {
  const { employeeId, checkIn, status } = req.body;

  try {
    // Check if employee exists  
    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ msg: 'Employee not found' });
    }

    // Create new attendance record  
    const newAttendance = new Attendance({
      employeeId,
      checkIn,
      status
    });

    const attendance = await newAttendance.save();

    // Update employee's attendance count  
    if (status === 'present') {
      employee.attendanceCount.present += 1;
    } else if (status === 'absent') {
      employee.attendanceCount.absent += 1;
    } else if (status === 'late') {
      employee.attendanceCount.late += 1;
    }

    await employee.save();

    res.json(attendance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 
