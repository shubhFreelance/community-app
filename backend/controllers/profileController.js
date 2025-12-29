const Profile = require('../models/Profile');
const User = require('../models/User');

// @desc    Submit community registration form
// @route   POST /api/profile
// @access  Private (USER)
exports.submitProfile = async (req, res) => {
    try {
        const { fullName, fatherName, dateOfBirth, age, gender, address, phone } = req.body;

        // Check if profile already exists for this user
        let profile = await Profile.findOne({ user: req.user.id });

        if (profile && req.user.status !== 'REJECTED') {
            return res.status(400).json({
                success: false,
                message: 'Profile already submitted. You can only edit if your application was rejected.',
            });
        }

        // File URLs (use new if uploaded, else fallback to existing if present)
        const aadhaarFileUrl = req.files?.aadhaarFile?.[0]?.filename
            ? `/uploads/aadhaar/${req.files.aadhaarFile[0].filename}`
            : (profile ? profile.aadhaarFileUrl : null);

        const profilePhotoUrl = req.files?.profilePhoto?.[0]?.filename
            ? `/uploads/photos/${req.files.profilePhoto[0].filename}`
            : (profile ? profile.profilePhotoUrl : null);

        if (!aadhaarFileUrl || !profilePhotoUrl) {
            return res.status(400).json({
                success: false,
                message: 'Please upload both Aadhaar card and profile photo',
            });
        }

        if (profile) {
            // Update existing profile (only if rejected)
            profile = await Profile.findOneAndUpdate(
                { user: req.user.id },
                {
                    fullName,
                    fatherName,
                    dateOfBirth,
                    age,
                    gender,
                    address,
                    phone,
                    aadhaarFileUrl,
                    profilePhotoUrl,
                    submittedAt: Date.now(),
                    rejectionReason: null,
                },
                { new: true }
            );
        } else {
            // Create new profile
            profile = await Profile.create({
                user: req.user.id,
                fullName,
                fatherName,
                dateOfBirth,
                age,
                gender,
                address,
                phone,
                aadhaarFileUrl,
                profilePhotoUrl,
            });
        }

        // Update user status
        await User.findByIdAndUpdate(req.user.id, { status: 'PENDING_VERIFICATION' });

        res.status(201).json({
            success: true,
            data: profile,
            message: 'Profile submitted successfully. Awaiting verification.',
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

// @desc    Get current user's profile
// @route   GET /api/profile
// @access  Private
exports.getMyProfile = async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found. Please complete community registration.',
            });
        }

        res.status(200).json({
            success: true,
            data: profile,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

// @desc    Get profile by user ID (Admin)
// @route   GET /api/profile/:userId
// @access  Private (Admin/Manager with permission)
exports.getProfileByUserId = async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.userId }).populate('user', 'email memberId status');

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found',
            });
        }

        res.status(200).json({
            success: true,
            data: profile,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};
