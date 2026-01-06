const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const LateAlert = require('../models/LateAlert');

// Admin-only middleware
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }
    next();
};

// @route    GET /api/alerts
// @desc     Get active late alerts for admin
// @access   Private (Admin)
router.get('/', auth, adminOnly, async (req, res) => {
    try {
        const alerts = await LateAlert.find({ status: 'active' })
            .sort({ alertTime: -1 })
            .limit(50);

        res.json(alerts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    POST /api/alerts/:id/dismiss
// @desc     Dismiss an alert
// @access   Private (Admin)
router.post('/:id/dismiss', auth, adminOnly, async (req, res) => {
    try {
        const alert = await LateAlert.findById(req.params.id);
        if (!alert) {
            return res.status(404).json({ msg: 'Alert not found' });
        }

        alert.status = 'dismissed';
        alert.dismissedBy = req.user.username;
        alert.dismissedAt = new Date();
        await alert.save();

        res.json(alert);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    GET /api/alerts/count
// @desc     Get count of active alerts
// @access   Private (Admin)
router.get('/count', auth, adminOnly, async (req, res) => {
    try {
        const count = await LateAlert.countDocuments({ status: 'active' });
        res.json({ count });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
