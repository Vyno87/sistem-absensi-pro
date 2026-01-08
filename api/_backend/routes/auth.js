const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @route    GET api/auth
// @desc     Get user by token
// @access   Private
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    POST api/auth
// @desc     Authenticate user & get token
// @access   Public
router.post('/', async (req, res) => {
    const { username, password } = req.body;

    try {
        // See if user exists
        let user = await User.findOne({ username });

        if (!user) {
            return res
                .status(400)
                .json({ errors: [{ msg: 'Invalid Credentials' }] });
        }

        // Match password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res
                .status(400)
                .json({ errors: [{ msg: 'Invalid Credentials' }] });
        }

        // Return jsonwebtoken
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret',
            { expiresIn: 360000 },
            async (err, token) => {
                if (err) throw err;

                // If user is admin, save this token as the current active session
                if (user.role === 'admin') {
                    user.currentSessionToken = token;
                    await user.save();
                }

                res.json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    POST api/auth/biometric/register
// @desc     Store biometric credential for current user
// @access   Private
router.post('/biometric/register', auth, async (req, res) => {
    const { credentialId, publicKey } = req.body;
    try {
        let user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user.biometricCredentialId = credentialId;
        user.biometricPublicKey = publicKey;
        await user.save();

        res.json({ msg: 'Biometric registration successful' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    POST api/auth/biometric/login
// @desc     Authenticate user with biometric credential
// @access   Public
router.post('/biometric/login', async (req, res) => {
    const { credentialId } = req.body;

    try {
        let user = await User.findOne({ biometricCredentialId: credentialId });

        if (!user) {
            return res.status(400).json({ errors: [{ msg: 'Biometric Identity Not Found' }] });
        }

        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret',
            { expiresIn: 360000 },
            async (err, token) => {
                if (err) throw err;
                if (user.role === 'admin') {
                    user.currentSessionToken = token;
                    await user.save();
                }
                res.json({ token, user: { name: user.username, role: user.role } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
