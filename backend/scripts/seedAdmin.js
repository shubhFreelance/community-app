const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Import the actual User model
const User = require('../models/User');

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Check if admin exists
        const existingAdmin = await User.findOne({ role: 'SUPER_ADMIN' });

        if (existingAdmin) {
            console.log('Super Admin already exists:', existingAdmin.email);
            console.log('Deleting and recreating...');
            await User.deleteOne({ _id: existingAdmin._id });
        }

        // Create Super Admin - password will be hashed by the pre-save hook
        const admin = await User.create({
            memberId: 'admin_1',
            email: 'admin@community.com',
            phone: '9999999999',
            password: 'admin123', // Will be hashed by pre-save hook
            role: 'SUPER_ADMIN',
            status: 'APPROVED',
        });

        console.log('✅ Super Admin created successfully!');
        console.log('   Email:', admin.email);
        console.log('   Password: admin123');
        console.log('\n⚠️  Please change the password after first login!');

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

seedAdmin();
