const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    ref: 'Employee'
  },
  date: {
    type: Date,
    default: Date.now
  },
  checkIn: {
    type: Date,
    required: true
  },
  checkOut: {
    type: Date
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'on-leave'],
    default: 'present'
  },
  latitude: {
    type: Number,
    required: false
  },
  longitude: {
    type: Number,
    required: false
  },
  facePhoto: {
    type: String,
    required: false
  },
  distanceFromOffice: {
    type: Number,
    required: false
  },
  geofenceStatus: {
    type: String,
    enum: ['in-range', 'out-of-range', 'disabled'],
    default: 'disabled'
  },
  deviceAuthToken: String,
  hardwareUid: Number,
  deviceId: String,
  accuracy: Number,
  isMocked: { type: Boolean, default: false },
  livenessScore: { type: Number, default: null },
  livenessVerified: { type: Boolean, default: false },
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Attendance', attendanceSchema); 
