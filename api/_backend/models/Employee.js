const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  fingerprintId: {
    type: Number,
    unique: true,
    sparse: true
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    enum: ['Warehouse', 'R & D', 'WWT-P', 'Sausage', 'Further', 'Cut-Up', 'Defeathering', 'Evis', 'P & GA', 'Engineering', 'QC'],
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  salary: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Harian Lepas', 'Outsourcing', 'Borongan', 'Kontrak', 'Tetap'],
    default: 'Harian Lepas'
  },
  hireDate: {
    type: Date,
    default: Date.now
  },
  attendanceCount: {
    present: {
      type: Number,
      default: 0
    },
    absent: {
      type: Number,
      default: 0
    },
    late: {
      type: Number,
      default: 0
    }
  },
  isKeyPerson: {
    type: Boolean,
    default: false
  },
  performanceScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  evaluationHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    notes: String
  }],
  recommendedPromotion: {
    type: Boolean,
    default: false
  },
  shiftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift'
  },
  registeredDevices: [{
    fingerprint: String,
    name: String,
    deviceType: String,
    registeredAt: { type: Date, default: Date.now }
  }],
  deviceLockEnabled: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Employee', employeeSchema); 
