const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const GeofenceSettings = require('../models/GeofenceSettings');

// Middleware to check if user is admin
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }
    next();
};

// Haversine formula to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
};

// @route    GET /api/geofence
// @desc     Get geofence settings
// @access   Private
router.get('/', auth, async (req, res) => {
    try {
        const settings = await GeofenceSettings.getSettings();
        res.json(settings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    POST /api/geofence
// @desc     Update geofence settings
// @access   Private (Admin only)
router.post('/', auth, adminOnly, async (req, res) => {
    try {
        const { enabled, centerLat, centerLng, radiusMeters, blockOutOfRange } = req.body;

        const settings = await GeofenceSettings.getSettings();

        if (enabled !== undefined) settings.enabled = enabled;
        if (centerLat !== undefined) settings.centerLat = centerLat;
        if (centerLng !== undefined) settings.centerLng = centerLng;
        if (radiusMeters !== undefined) settings.radiusMeters = radiusMeters;
        if (blockOutOfRange !== undefined) settings.blockOutOfRange = blockOutOfRange;

        settings.updatedAt = Date.now();
        settings.updatedBy = req.user.username;

        await settings.save();
        res.json(settings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Export both router and helper function
module.exports = {
    router,
    calculateDistance
};
