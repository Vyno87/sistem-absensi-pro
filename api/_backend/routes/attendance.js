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

// @route    GET api/attendance
// @desc     Get recent attendance records (for real-time feed)
// @access   Private
router.get('/', auth, async (req, res) => {
  try {
    // Get latest 10 attendance records with employee details
    const recentAttendance = await Attendance.find({}, { facePhoto: 0 }) // Exclude facePhoto
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Populate employee info
    const populatedRecords = await Promise.all(
      recentAttendance.map(async (record) => {
        const employee = await Employee.findOne({ employeeId: record.employeeId });
        return {
          ...record,
          employeeName: employee ? employee.name : 'Unknown',
          position: employee ? employee.position : 'N/A'
        };
      })
    );

    res.json(populatedRecords);
  } catch (err) {
    console.error('Error fetching recent attendance:', err.message);
    res.status(500).send('Server error');
  }
});

// @route    GET api/attendance/today
// @desc     Get ALL attendance records for today (for Live Map)
// @access   Private (Admin)
router.get('/today', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all records for today that have location data
    // We include facePhoto here? No, let's exclude it to keep map fast. 
    // Or maybe include a small version? For now exclude, use placeholder in map.
    const records = await Attendance.find({
      date: { $gte: today },
      latitude: { $ne: null },
      longitude: { $ne: null }
    }, { facePhoto: 0 })
      .sort({ createdAt: -1 })
      .lean();

    const populatedRecords = await Promise.all(
      records.map(async (record) => {
        const employee = await Employee.findOne({ employeeId: record.employeeId });
        return {
          ...record,
          employeeName: employee ? employee.name : 'Unknown',
          position: employee ? employee.position : 'N/A'
        };
      })
    );

    res.json(populatedRecords);
  } catch (err) {
    console.error('Error fetching map data:', err.message);
    res.status(500).send('Server error');
  }
});

// @route    POST api/attendance  
// @desc     Record attendance  
// @access   Private  
router.post('/', auth, async (req, res) => {
  let { type, employeeId, checkIn, status, latitude, longitude, facePhoto } = req.body;

  // Default checkIn to now if not provided
  if (!checkIn) {
    checkIn = new Date();
  }

  const today = new Date(checkIn);
  today.setHours(0, 0, 0, 0);

  try {
    // Check if employee exists  
    const employee = await Employee.findOne({ employeeId }).populate('shiftId');
    if (!employee) {
      return res.status(404).json({ msg: 'Employee not found' });
    }

    // ==== DEVICE LOCK VALIDATION ====
    const deviceFingerprint = req.body.deviceFingerprint;
    if (deviceFingerprint) {
      const isRegistered = employee.registeredDevices.some(d => d.fingerprint === deviceFingerprint);

      if (!isRegistered) {
        // If device lock is active, block unregistered devices
        if (employee.deviceLockEnabled) {
          return res.status(403).json({
            msg: 'Perangkat tidak terdaftar. Hubungi Admin untuk aktivasi perangkat baru.',
            code: 'DEVICE_LOCKED'
          });
        }

        // Auto-register first device or if lock is disabled
        employee.registeredDevices.push({
          fingerprint: deviceFingerprint,
          name: req.body.deviceName || 'Browser',
          deviceType: req.body.deviceType || 'Web'
        });
        await employee.save();
      }
    }
    // ================================

    // CHECK OUT LOGIC
    if (type === 'Check Out') {
      const lastRecord = await Attendance.findOne({
        employeeId,
        date: { $gte: today }
      }).sort({ createdAt: -1 });

      if (!lastRecord) {
        return res.status(400).json({ msg: 'No Check In record found for today' });
      }

      if (lastRecord.checkOut) {
        return res.status(400).json({ msg: 'You have already checked out today' });
      }

      lastRecord.checkOut = new Date();
      await lastRecord.save();
      return res.json(lastRecord);
    }

    // CHECK IN LOGIC (Default)

    // Prevent double check-in
    const existingRecord = await Attendance.findOne({
      employeeId,
      date: { $gte: today }
    });

    if (existingRecord) {
      // If they already have a record today, don't allow another Check In.
      // User should use Check Out.
      return res.status(400).json({ msg: 'You have already checked in today' });
    }

    // Automatic Late Detection Logic
    let finalStatus = status;

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

    // ==== GEOFENCE VALIDATION ====
    const GeofenceSettings = require('../models/GeofenceSettings');
    const geofenceSettings = await GeofenceSettings.getSettings();

    let distanceFromOffice = null;
    let geofenceStatus = 'disabled';

    if (geofenceSettings.enabled && latitude && longitude) {
      // Calculate distance from office
      distanceFromOffice = calculateDistance(
        geofenceSettings.centerLat,
        geofenceSettings.centerLng,
        latitude,
        longitude
      );

      // Check if within radius
      if (distanceFromOffice <= geofenceSettings.radiusMeters) {
        geofenceStatus = 'in-range';
      } else {
        geofenceStatus = 'out-of-range';

        // Block check-in if configured
        if (geofenceSettings.blockOutOfRange) {
          return res.status(403).json({
            msg: 'Anda berada di luar radius kantor',
            distance: Math.round(distanceFromOffice),
            maxDistance: geofenceSettings.radiusMeters,
            officeLocation: {
              lat: geofenceSettings.centerLat,
              lng: geofenceSettings.centerLng
            }
          });
        }
      }
    }
    // ==== END GEOFENCE VALIDATION ====

    // ==== ENHANCED ANTI-FAKE GPS DETECTION ====
    let isMocked = false;
    let mockReason = null;
    const { accuracy, speed, heading, altitude, gpsTimestamp } = req.body;

    // Layer 1: Accuracy anomaly (< 0.5m is very rare for mobile GPS)
    if (accuracy !== undefined && (accuracy === 0 || (accuracy > 0 && accuracy < 0.5))) {
      isMocked = true;
      mockReason = 'Extreme accuracy anomaly';
    }

    // Layer 2: Speed Anomaly (Calculate speed from last check-in)
    const lastRecord = await Attendance.findOne({ employeeId }).sort({ createdAt: -1 });
    if (lastRecord && lastRecord.latitude && latitude) {
      const dist = calculateDistance(lastRecord.latitude, lastRecord.longitude, latitude, longitude);
      const timeDiff = (new Date() - new Date(lastRecord.createdAt)) / 1000; // in seconds

      if (timeDiff > 0) {
        const calculatedSpeed = dist / timeDiff; // m/s
        // If speed > 300 m/s (approx 1000 km/h) - Humanly impossible for normal travel
        if (calculatedSpeed > 300 && dist > 1000) {
          isMocked = true;
          mockReason = 'Impossible travel speed detected';
        }
      }
    }

    // Layer 3: Metadata Check
    // Most mock apps don't provide altitude, heading, or speed correctly
    if (latitude && longitude && altitude === null && speed === null) {
      // This is common for many simple mock apps, but could be false positive on some devices.
      // We'll flag it for review but not always block unless accuracy is also suspicious.
      console.log(`ℹ️ Missing GPS metadata for ${employeeId}`);
    }

    if (isMocked) {
      console.warn(`⚠️ Fake GPS detected for ${employeeId}: ${mockReason}`);
    }
    // ==========================================

    // Create new attendance record  
    const newAttendance = new Attendance({
      employeeId,
      checkIn,
      status: finalStatus,
      latitude: latitude || null,
      longitude: longitude || null,
      facePhoto: facePhoto || null,
      distanceFromOffice,
      geofenceStatus,
      accuracy,
      deviceId: req.body.deviceId,
      isMocked,
      mockReason,
      livenessScore: req.body.livenessScore || null,
      livenessVerified: req.body.livenessScore ? req.body.livenessScore > 30 : false,
      speed,
      altitude,
      heading,
      gpsTimestamp
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
    console.error('Attendance Error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route    DELETE api/attendance/:id
// @desc     Delete attendance record (Admin only)
// @access   Private (Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }

    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({ msg: 'Attendance record not found' });
    }

    // Find employee to update their attendance count
    const employee = await Employee.findOne({ employeeId: attendance.employeeId });

    if (employee) {
      const updateFields = {};

      // Decrement the attendance count based on status
      if (attendance.status === 'present' && employee.attendanceCount.present > 0) {
        updateFields['attendanceCount.present'] = -1;
      } else if (attendance.status === 'late' && employee.attendanceCount.late > 0) {
        updateFields['attendanceCount.late'] = -1;
      } else if (attendance.status === 'absent' && employee.attendanceCount.absent > 0) {
        updateFields['attendanceCount.absent'] = -1;
      }

      if (Object.keys(updateFields).length > 0) {
        await Employee.updateOne(
          { employeeId: attendance.employeeId },
          { $inc: updateFields }
        );
      }
    }

    // Delete the attendance record
    await Attendance.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Attendance record deleted successfully' });
  } catch (err) {
    console.error('Delete Attendance Error:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Attendance record not found' });
    }
    res.status(500).json({ msg: 'Server Error: ' + err.message });
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
