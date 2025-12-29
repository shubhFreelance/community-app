const express = require('express');
const router = express.Router();
const { getMyDocuments, getMyNotifications, markNotificationRead } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/documents', protect, getMyDocuments);
router.get('/notifications', protect, getMyNotifications);
router.put('/notifications/:id/read', protect, markNotificationRead);

module.exports = router;
