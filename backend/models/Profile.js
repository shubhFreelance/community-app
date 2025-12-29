const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    fullName: {
        type: String,
        required: [true, 'Please add full name'],
    },
    fatherName: {
        type: String,
        required: [true, 'Please add father\'s name'],
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Please add date of birth'],
    },
    age: {
        type: Number,
        required: [true, 'Please add age'],
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: [true, 'Please select gender'],
    },
    address: {
        type: String,
        required: [true, 'Please add address'],
    },
    phone: {
        type: String,
        required: [true, 'Please add phone number'],
    },
    aadhaarFileUrl: {
        type: String,
        required: [true, 'Please upload Aadhaar card'],
    },
    profilePhotoUrl: {
        type: String,
        required: [true, 'Please upload profile photo'],
    },
    submittedAt: {
        type: Date,
        default: Date.now,
    },
    rejectionReason: {
        type: String,
    },
});

module.exports = mongoose.model('Profile', ProfileSchema);
