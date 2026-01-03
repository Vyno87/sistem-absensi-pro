const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const auth = require('../middleware/auth');

// Haversine formula to calculate distance between two GPS coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// @route    POST api/attendance  
// @desc     Record attendance  
// @access   Private  
router.post('/', auth, async (req, res) => {
  const { employeeId, checkIn, status, latitude, longitude, facePhoto } = req.body;

  try {
    // GPS Validation
    if (process.env.DISABLE_GPS_CHECK === 'true') {
      console.log('GPS check disabled via environment variable');
    } else if (latitude && longitude) {
      const officeLatitude = parseFloat(process.env.OFFICE_LATITUDE) || -6.188696059432105;
      const officeLongitude = parseFloat(process.env.OFFICE_LONGITUDE) || 106.33081285722146;
      const maxRadius = parseFloat(process.env.OFFICE_RADIUS_METERS) || 100;

      const distance = calculateDistance(
        officeLatitude,
        officeLongitude,
        latitude,
        longitude
      );

      if (distance > maxRadius) {
        return res.status(403).json({
          msg: 'You are outside the office area',
          distance: Math.round(distance),
          maxRadius
        });
      }
    } else {
      // If GPS is required but not provided
      return res.status(400).json({ msg: 'GPS coordinates are required for attendance' });
    }

    // Check if employee exists  
    // Check if employee exists  
    const employee = await Employee.findOne({ employeeId }).populate('shiftId');
    if (!employee) {
      return res.status(404).json({ msg: 'Employee not found' });
    }

    // Automatic Late Detection Logic
    let finalStatus = status; // Default to client sent status (usually 'present')

    if (employee.shiftId && checkIn) {
      const checkInTime = new Date(checkIn);
      // Get shift start time (e.g., "08:00")
      const [startHour, startMinute] = employee.shiftId.startTime.split(':').map(Number);

      // Create a Date object for the shift start time on the same day as checkIn
      const shiftStart = new Date(checkInTime);
      shiftStart.setHours(startHour, startMinute, 0, 0);

      // Add tolerance (e.g., 15 minutes)
      const toleranceMinutes = 15;
      const lateThreshold = new Date(shiftStart.getTime() + toleranceMinutes * 60000);

      if (checkInTime > lateThreshold) {
        finalStatus = 'late';
      } else {
        finalStatus = 'present';
      }
    }

    // Create new attendance record  
    const newAttendance = new Attendance({
      employeeId,
      checkIn,
      status: finalStatus,
      latitude: latitude || null,
      longitude: longitude || null,
      facePhoto: facePhoto || null
    });

    const attendance = await newAttendance.save();

    // Update employee's attendance count  
    if (finalStatus === 'present') {
      employee.attendanceCount.present += 1;
    } else if (finalStatus === 'absent') {
      employee.attendanceCount.absent += 1;
    } else if (finalStatus === 'late') {
      employee.attendanceCount.late += 1;
    }

    await employee.save();

    res.json(attendance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    POST api/attendance/ingest
// @desc     Record attendance from hardware (ESP32)
// @access   Public (API Key Required)
router.post('/ingest', async (req, res) => {
  const { uid, timestamp, deviceAuthToken } = req.body;
  const apiKey = req.headers['x-api-key'];

  try {
    // 1. API Key Validation
    if (apiKey !== process.env.HARDWARE_API_KEY) {
      return res.status(401).json({ msg: 'Unauthorized hardware access' });
    }

    if (!uid) {
      return res.status(400).json({ msg: 'Missing UID' });
    }

    // 2. Find Employee by fingerprintId/UID
    const employee = await Employee.findOne({ fingerprintId: uid }).populate('shiftId');
    if (!employee) {
      return res.status(404).json({ msg: 'Employee not found', uid });
    }

    // 3. Simple toggle logic for In/Out if not strictly defined
    const lastRecord = await Attendance.findOne({ employeeId: employee.employeeId }).sort({ createdAt: -1 });

    // In our simplified model, we'll just create a new record. 
    // If it's a new day or no record exists, it's a Check In.
    // If a record exists today with no checkOut, it's a Check Out.

    const now = timestamp ? new Date(timestamp) : new Date();
    const today = new Date(now).setHours(0, 0, 0, 0);

    let attendance;

    if (lastRecord && new Date(lastRecord.checkIn).setHours(0, 0, 0, 0) === today && !lastRecord.checkOut) {
      // It's a Check Out
      lastRecord.checkOut = now;
      attendance = await lastRecord.save();
    } else {
      // It's a Check In
      // Automatic Late Detection
      let finalStatus = 'present';
      if (employee.shiftId) {
        const [startHour, startMinute] = employee.shiftId.startTime.split(':').map(Number);
        const shiftStart = new Date(now);
        shiftStart.setHours(startHour, startMinute, 0, 0);
        const toleranceMinutes = 15;
        const lateThreshold = new Date(shiftStart.getTime() + toleranceMinutes * 60000);
        if (now > lateThreshold) {
          finalStatus = 'late';
        }
      }

      const newAttendance = new Attendance({
        employeeId: employee.employeeId,
        checkIn: now,
        status: finalStatus,
        deviceAuthToken: deviceAuthToken || 'ESP32_UNKNOWN',
        hardwareUid: uid
      });

      attendance = await newAttendance.save();

      // Update employee stats
      if (finalStatus === 'present') employee.attendanceCount.present += 1;
      else if (finalStatus === 'late') employee.attendanceCount.late += 1;
      await employee.save();
    }

    res.json({
      success: true,
      employee: employee.name,
      status: attendance.status,
      time: now
    });

  } catch (err) {
    console.error('Hardware Ingest Error:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 
