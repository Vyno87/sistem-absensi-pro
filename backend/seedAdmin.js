const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected...');

        const adminExists = await User.findOne({ username: 'admin' });
        if (adminExists) {
            console.log('Admin user already exists. Updating password to admin123...');
            const salt = await bcrypt.genSalt(10);
            adminExists.password = await bcrypt.hash('admin123', salt);
            adminExists.role = 'admin';
            await adminExists.save();
        } else {
            console.log('Creating admin user...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            const newAdmin = new User({
                username: 'admin',
                password: hashedPassword,
                role: 'admin'
            });
            await newAdmin.save();
        }
        console.log('Admin user ready! (admin / admin123)');
        process.exit();
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

seedAdmin();
