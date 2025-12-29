const express = require('express');
const router = express.Router();
const {
    createFundEntry,
    createExpenseEntry,
    getAllTransactions,
    getFundDashboard,
} = require('../controllers/fundController');
const { protect, authorize, hasPermission } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Get all transactions
router.get('/', protect, hasPermission('view_funds'), getAllTransactions);

// Get fund dashboard (Super Admin only)
router.get('/dashboard', protect, authorize('SUPER_ADMIN'), getFundDashboard);

// Create fund received entry
router.post(
    '/receive',
    protect,
    hasPermission('view_funds'),
    upload.single('screenshot'),
    createFundEntry
);

// Create expense entry
router.post(
    '/expense',
    protect,
    hasPermission('upload_expenses'),
    upload.single('screenshot'),
    createExpenseEntry
);

module.exports = router;
