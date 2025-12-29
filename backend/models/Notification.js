const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        // If null, it's a broadcast notification
    },
    title: {
        type: String,
        required: [true, 'Please add title'],
    },
    message: {
        type: String,
        required: [true, 'Please add message'],
    },
    type: {
        type: String,
        enum: ['APPROVAL', 'REJECTION', 'BROADCAST', 'INFO'],
        default: 'INFO',
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Notification', NotificationSchema);
