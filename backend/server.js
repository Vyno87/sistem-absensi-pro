const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { authLimiter, attendanceLimiter } = require('./middleware/rateLimiter');

dotenv.config();

const app = express();

// CORS Configuration - Restrict to frontend domain
const allowedOrigins = [
  'https://safiranet.my.id',
  'https://www.safiranet.my.id',
  'https://sistem-absensi-pro.vercel.app',
  'https://sistem-absensi-pro-rrn1.vercel.app',
  'http://localhost:3000'
];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ extended: false }));

// Define Routes with Rate Limiting
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/attendance', attendanceLimiter, require('./routes/attendance'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/shifts', require('./routes/shifts'));
app.use('/api/leaves', require('./routes/leaves'));

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB  
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/employee_attendance');

    app.listen(PORT, function () {
      console.log('Server started on port ' + PORT);
    });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

startServer(); 
