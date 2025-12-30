const rateLimit = require('express-rate-limit');

// Rate limiting for authentication routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: 'Too many login attempts, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting for attendance routes
const attendanceLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
    message: 'Too many attendance requests, please slow down',
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { authLimiter, attendanceLimiter };
