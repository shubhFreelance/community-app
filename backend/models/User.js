const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
    memberId: {
        type: String,
        unique: true,
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email',
        ],
    },
    phone: {
        type: String,
        required: [true, 'Please add a phone number'],
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false,
    },
    role: {
        type: String,
        enum: ['USER', 'MANAGER', 'SUPER_ADMIN'],
        default: 'USER',
    },
    permissions: {
        type: [String],
        default: [],
        // Only relevant for MANAGER role
        // Examples: 'verify_users', 'view_funds', 'upload_expenses'
    },
    status: {
        type: String,
        enum: ['NEW', 'FORM_SUBMITTED', 'PENDING_VERIFICATION', 'APPROVED', 'REJECTED'],
        default: 'NEW',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Generate member ID before saving
UserSchema.pre('save', async function (next) {
    if (!this.memberId) {
        const count = await mongoose.model('User').countDocuments();
        this.memberId = `member_${count + 1}`;
    }
    next();
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
