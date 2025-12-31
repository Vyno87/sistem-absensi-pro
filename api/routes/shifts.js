const express = require('express');
const router = express.Router();
const Shift = require('../models/Shift');
const auth = require('../middleware/auth');

// @route    GET api/shifts
// @desc     Get all shifts
// @access   Private
router.get('/', auth, async (req, res) => {
    try {
        const shifts = await Shift.find().sort({ name: 1 });
        res.json(shifts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    POST api/shifts
// @desc     Create a shift
// @access   Private (Admin)
router.post('/', auth, async (req, res) => {
    const { name, startTime, endTime, description } = req.body;

    try {
        const existingShift = await Shift.findOne({ name });
        if (existingShift) {
            return res.status(400).json({ msg: 'Shift name already exists' });
        }

        const newShift = new Shift({
            name,
            startTime,
            endTime,
            description
        });

        const shift = await newShift.save();
        res.json(shift);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    PUT api/shifts/:id
// @desc     Update a shift
// @access   Private (Admin)
router.put('/:id', auth, async (req, res) => {
    const { name, startTime, endTime, description, isActive } = req.body;

    try {
        let shift = await Shift.findById(req.params.id);
        if (!shift) {
            return res.status(404).json({ msg: 'Shift not found' });
        }

        shift.name = name || shift.name;
        shift.startTime = startTime || shift.startTime;
        shift.endTime = endTime || shift.endTime;
        shift.description = description !== undefined ? description : shift.description;
        shift.isActive = isActive !== undefined ? isActive : shift.isActive;

        await shift.save();
        res.json(shift);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    DELETE api/shifts/:id
// @desc     Delete a shift
// @access   Private (Admin)
router.delete('/:id', auth, async (req, res) => {
    try {
        const shift = await Shift.findById(req.params.id);
        if (!shift) {
            return res.status(404).json({ msg: 'Shift not found' });
        }

        await shift.deleteOne();
        res.json({ msg: 'Shift removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
