const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const connectionString = process.env.MONGODB_URI;

if (!connectionString) {
    console.error('❌ MONGODB_URI is undefined. Check your .env file.');
    process.exit(1);
}

const seedAdmin = async () => {
    try {
        await mongoose.connect(connectionString);
        console.log('✅ Connected to MongoDB');

        // Check if admin exists
        let admin = await User.findOne({ username: 'admin' });

        if (admin) {
            console.log('⚠️ Admin user already exists.');
        } else {
            // Create new admin
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);

            admin = new User({
                username: 'admin',
                password: hashedPassword,
                role: 'admin'
            });

            await admin.save();
            console.log('🎉 Admin user created successfully!');
            console.log('👤 Username: admin | Password: admin123');
        }

        // Check if user exists
        let standardUser = await User.findOne({ username: 'user' });

        if (standardUser) {
            console.log('⚠️ Standard user already exists.');
        } else {
            // Create new standard user
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('user123', salt);

            standardUser = new User({
                username: 'user',
                password: hashedPassword,
                role: 'user'
            });

            await standardUser.save();
            console.log('🎉 Standard user created successfully!');
            console.log('👤 Username: user | Password: user123');
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedAdmin();
