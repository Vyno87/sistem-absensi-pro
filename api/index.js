const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { authLimiter, attendanceLimiter } = require('./_backend/middleware/rateLimiter');

dotenv.config();

const app = express();
app.set('trust proxy', 1); // Trust first proxy (Vercel)

app.use((req, res, next) => {
  console.log(`[BACKEND] Request: ${req.method} ${req.url}`);
  next();
});

console.log('=> Starting API Server...');
console.log('=> NODE_ENV:', process.env.NODE_ENV);
console.log('=> JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('=> MONGODB_URI exists:', !!process.env.MONGODB_URI);

// CORS Configuration - Restrict to frontend domain
const allowedOrigins = [
  'https://safiranet.my.id',
  'https://www.safiranet.my.id',
  'https://sistem-absensi-pro.vercel.app',
  'https://sistem-absensi-pro-rrn1.vercel.app',
  'https://sistem-absensi-pro-final.vercel.app',
  'http://localhost:3000'
];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Database Connection - MUST BE BEFORE ROUTES
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/employee_attendance';
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }
  console.log('=> Connecting to MongoDB...');
  console.log('=> URI prefix:', MONGODB_URI.substring(0, 30) + '...');
  cachedDb = await mongoose.connect(MONGODB_URI);
  console.log('=> MongoDB Connected');
  return cachedDb;
}

// Middleware to ensure DB connection for ALL requests
app.use(async (req, res, next) => {
  try {
    const start = Date.now();
    await connectToDatabase();
    const duration = Date.now() - start;
    if (duration > 100) {
      console.log(`=> DB Connection took ${duration}ms for ${req.url}`);
    }
    next();
  } catch (err) {
    console.error('CRITICAL DB CONNECTION ERROR:', err.message);
    res.status(500).json({
      error: 'Database connection failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Define Routes with Rate Limiting
app.use('/api/auth', authLimiter, require('./_backend/routes/auth'));
app.use('/api/employees', require('./_backend/routes/employees'));
app.use('/api/attendance', attendanceLimiter, require('./_backend/routes/attendance'));
app.use('/api/dashboard', require('./_backend/routes/dashboard'));
app.use('/api/reports', require('./_backend/routes/reports'));
app.use('/api/shifts', require('./_backend/routes/shifts'));
app.use('/api/leaves', require('./_backend/routes/leaves'));

app.get('/api/health', (req, res) => {
  console.log('=> Health check requested. MONGODB_URI exists:', !!process.env.MONGODB_URI);
  res.json({
    status: 'ok',
    timestamp: new Date(),
    dbStatus: mongoose.connection.readyState,
    dbStatusText: mongoose.connection.readyState === 1 ? 'connected' :
      mongoose.connection.readyState === 2 ? 'connecting' :
        mongoose.connection.readyState === 3 ? 'disconnecting' : 'disconnected',
    env: process.env.NODE_ENV,
    receivedUrl: req.url,
    receivedPath: req.path
  });
});

app.get('/api/test', (req, res) => {
  res.send('API is working');
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[UNHANDLED ERROR]:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

module.exports = app;

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}
