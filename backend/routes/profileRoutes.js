const express = require('express');
const router = express.Router();
const { submitProfile, getMyProfile, getProfileByUserId } = require('../controllers/profileController');
const { protect, authorize, hasPermission } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post(
    '/',
    protect,
    authorize('USER'),
    upload.fields([
        { name: 'aadhaarFile', maxCount: 1 },
        { name: 'profilePhoto', maxCount: 1 },
    ]),
    submitProfile
);

router.get('/', protect, getMyProfile);

router.get(
    '/:userId',
    protect,
    hasPermission('verify_users'),
    getProfileByUserId
);

module.exports = router;
