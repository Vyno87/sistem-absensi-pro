const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const users = [
    {
        username: 'admin',
        password: 'admin123',
        role: 'admin'
    },
    {
        username: 'user',
        password: 'user123',
        role: 'user'
    }
];

const seedUsers = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb+srv://vynothea7_db_user:Nyorean9@cluster0.nr0mnpe.mongodb.net/employee_attendance?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB for seeding...');

        for (const u of users) {
            let user = await User.findOne({ username: u.username });
            if (user) {
                console.log(`User ${u.username} already exists, updating password...`);
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(u.password, salt);
                await user.save();
            } else {
                console.log(`Creating user ${u.username}...`);
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(u.password, salt);
                user = new User({
                    username: u.username,
                    password: hashedPassword,
                    role: u.role
                });
                await user.save();
            }
        }

        console.log('Seeding completed successfully');
        process.exit();
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
};

seedUsers();
