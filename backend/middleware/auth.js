const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if no token
    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded.user;

    // RBAC: Single Device Login for Admin
    if (req.user.role === 'admin') {
      const user = await User.findById(req.user.id);
      if (!user || user.currentSessionToken !== token) {
        return res.status(401).json({ msg: 'Admin account is online on another device', code: 'ADMIN_ONLINE_ELSEWHERE' });
      }
    }

    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

module.exports = auth;
