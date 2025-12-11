const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const email = process.argv[2];
        const password = 'atif903';
        const name = process.argv[4] || 'Admin User';

        if (!email || !password) {
            console.error('Usage: node createAdmin.js <email> <password> [name]');
            console.error('Example: node createAdmin.js admin@gym.com admin123 "John Admin"');
            process.exit(1);
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('User already exists. Updating role to admin...');
            existingUser.role = 'admin';
            await existingUser.save();
            console.log(`✅ User ${email} updated to admin role`);
        } else {
            // Create new admin user
            const hashedPassword = await bcrypt.hash(password, 10);
            const admin = await User.create({
                name,
                email,
                password: hashedPassword,
                role: 'admin'
            });
            console.log(`✅ Admin user created successfully!`);
            console.log(`Email: ${admin.email}`);
            console.log(`Name: ${admin.name}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

createAdmin();
