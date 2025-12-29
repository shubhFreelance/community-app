const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['FUND_RECEIVED', 'EXPENSE'],
        required: [true, 'Please specify transaction type'],
    },
    amount: {
        type: Number,
        required: [true, 'Please add amount'],
    },
    description: {
        type: String,
        required: [true, 'Please add description'],
    },
    date: {
        type: Date,
        default: Date.now,
    },
    balanceAfterTransaction: {
        type: Number,
        required: [true, 'Please enter remaining balance after this transaction'],
    },
    screenshotUrl: {
        type: String,
        required: [true, 'Please upload proof screenshot'],
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Transaction', TransactionSchema);
