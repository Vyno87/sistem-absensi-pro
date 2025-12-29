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
  notes: String  
}, {  
  timestamps: true  
});  
  
module.exports = mongoose.model('Attendance', attendanceSchema); 
