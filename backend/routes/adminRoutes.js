const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    getPendingUsers,
    approveUser,
    rejectUser,
    createManager,
    updateManagerPermissions,
    getAllManagers,
    sendBroadcast,
    getAnalytics,
    updateUser,
    deleteUser,
} = require('../controllers/adminController');
const { protect, authorize, hasPermission } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Super Admin only routes
router.get('/users', protect, authorize('SUPER_ADMIN'), getAllUsers);
router.get('/analytics', protect, authorize('SUPER_ADMIN'), getAnalytics);
router.post('/managers', protect, authorize('SUPER_ADMIN'), createManager);
router.get('/managers', protect, authorize('SUPER_ADMIN'), getAllManagers);
router.put('/managers/:managerId/permissions', protect, authorize('SUPER_ADMIN'), updateManagerPermissions);
router.post('/broadcast', protect, authorize('SUPER_ADMIN'), sendBroadcast);

// New User CRUD routes
router.put(
    '/users/:userId',
    protect,
    authorize('SUPER_ADMIN'),
    upload.fields([
        { name: 'aadhaarFile', maxCount: 1 },
        { name: 'profilePhoto', maxCount: 1 },
    ]),
    updateUser
);
router.delete('/users/:userId', protect, authorize('SUPER_ADMIN'), deleteUser);

// Routes accessible by Super Admin or Manager with verify_users permission
router.get('/pending', protect, hasPermission('verify_users'), getPendingUsers);
router.put('/approve/:userId', protect, hasPermission('verify_users'), approveUser);
router.put('/reject/:userId', protect, hasPermission('verify_users'), rejectUser);

module.exports = router;
