const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    membershipApprovalUrl: {
        type: String,
    },
    idCardUrl: {
        type: String,
    },
    casteCertificateUrl: {
        type: String,
    },
    generatedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Document', DocumentSchema);
