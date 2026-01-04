const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// @route    GET api/settings/:key
// @desc     Get a setting value (public for real-time sync)
// @access   Private
router.get('/:key', auth, async (req, res) => {
    try {
        const setting = await Settings.findOne({ key: req.params.key });
        if (!setting) {
            // Return default if not found
            const defaults = {
                'gpsEnabled': true
            };
            return res.json({ value: defaults[req.params.key] ?? null });
        }
        res.json({ value: setting.value });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route    POST api/settings/:key
// @desc     Update a setting value
// @access   Private (Admin only)
router.post('/:key', [auth, adminAuth], async (req, res) => {
    try {
        const { value } = req.body;

        let setting = await Settings.findOne({ key: req.params.key });

        if (setting) {
            setting.value = value;
            setting.updatedAt = Date.now();
            await setting.save();
        } else {
            setting = new Settings({
                key: req.params.key,
                value
            });
            await setting.save();
        }

        res.json({ value: setting.value, msg: 'Setting updated' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
