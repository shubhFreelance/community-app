const User = require('../models/User');
const Profile = require('../models/Profile');
const Document = require('../models/Document');
const Notification = require('../models/Notification');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Super Admin)
exports.getAllUsers = async (req, res) => {
    try {
        const { status, role, page = 1, limit = 20, search } = req.query;

        const query = {};
        if (status) query.status = status;
        if (role) query.role = role;

        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { memberId: { $regex: search, $options: 'i' } },
            ];
        }

        const users = await User.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            count: users.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            data: users,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

// @desc    Get pending verification users
// @route   GET /api/admin/pending
// @access  Private (Super Admin / Manager with verify_users permission)
exports.getPendingUsers = async (req, res) => {
    try {
        const users = await User.find({ status: 'PENDING_VERIFICATION' })
            .sort({ createdAt: -1 });

        const usersWithProfiles = await Promise.all(
            users.map(async (user) => {
                const profile = await Profile.findOne({ user: user._id });
                return {
                    user: user.toObject(),
                    profile: profile ? profile.toObject() : null,
                };
            })
        );

        res.status(200).json({
            success: true,
            count: usersWithProfiles.length,
            data: usersWithProfiles,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

// @desc    Approve user
// @route   PUT /api/admin/approve/:userId
// @access  Private (Super Admin / Manager with verify_users permission)
exports.approveUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        if (user.status !== 'PENDING_VERIFICATION') {
            return res.status(400).json({
                success: false,
                message: 'User is not pending verification',
            });
        }

        user.status = 'APPROVED';
        await user.save();

        // Create notification
        await Notification.create({
            user: user._id,
            title: 'Registration Approved',
            message: 'Your community registration has been approved. You can now access all member features.',
            type: 'APPROVAL',
        });

        // Create placeholder documents (can be replaced with actual document generation later)
        await Document.findOneAndUpdate(
            { user: user._id },
            {
                user: user._id,
                membershipApprovalUrl: '/uploads/documents/membership_template.pdf',
                idCardUrl: '/uploads/documents/id_card_template.pdf',
                casteCertificateUrl: '/uploads/documents/caste_certificate_template.pdf',
                generatedAt: Date.now(),
            },
            { upsert: true, new: true }
        );

        res.status(200).json({
            success: true,
            message: 'User approved successfully',
            data: user,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

// @desc    Reject user
// @route   PUT /api/admin/reject/:userId
// @access  Private (Super Admin / Manager with verify_users permission)
exports.rejectUser = async (req, res) => {
    try {
        const { reason } = req.body;
        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        user.status = 'REJECTED';
        await user.save();

        // Update profile with rejection reason
        await Profile.findOneAndUpdate(
            { user: user._id },
            { rejectionReason: reason || 'Application rejected by admin' }
        );

        // Create notification
        await Notification.create({
            user: user._id,
            title: 'Registration Rejected',
            message: reason || 'Your community registration has been rejected. Please update your details and resubmit.',
            type: 'REJECTION',
        });

        res.status(200).json({
            success: true,
            message: 'User rejected',
            data: user,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

// @desc    Create manager
// @route   POST /api/admin/managers
// @access  Private (Super Admin)
exports.createManager = async (req, res) => {
    try {
        const { email, phone, password, permissions } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email',
            });
        }

        const manager = await User.create({
            email,
            phone,
            password,
            role: 'MANAGER',
            permissions: permissions || [],
            status: 'APPROVED', // Managers are auto-approved
        });

        res.status(201).json({
            success: true,
            data: {
                id: manager._id,
                memberId: manager.memberId,
                email: manager.email,
                role: manager.role,
                permissions: manager.permissions,
            },
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

// @desc    Update manager permissions
// @route   PUT /api/admin/managers/:managerId/permissions
// @access  Private (Super Admin)
exports.updateManagerPermissions = async (req, res) => {
    try {
        const { permissions } = req.body;

        const manager = await User.findById(req.params.managerId);

        if (!manager || manager.role !== 'MANAGER') {
            return res.status(404).json({
                success: false,
                message: 'Manager not found',
            });
        }

        manager.permissions = permissions;
        await manager.save();

        res.status(200).json({
            success: true,
            data: manager,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

// @desc    Get all managers
// @route   GET /api/admin/managers
// @access  Private (Super Admin)
exports.getAllManagers = async (req, res) => {
    try {
        const managers = await User.find({ role: 'MANAGER' });

        res.status(200).json({
            success: true,
            count: managers.length,
            data: managers,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

// @desc    Send broadcast notification
// @route   POST /api/admin/broadcast
// @access  Private (Super Admin)
exports.sendBroadcast = async (req, res) => {
    try {
        const { title, message } = req.body;

        const notification = await Notification.create({
            user: null, // Broadcast
            title,
            message,
            type: 'BROADCAST',
        });

        res.status(201).json({
            success: true,
            message: 'Broadcast sent successfully',
            data: notification,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

// @desc    Get analytics
// @route   GET /api/admin/analytics
// @access  Private (Super Admin)
exports.getAnalytics = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'USER' });
        const pendingUsers = await User.countDocuments({ status: 'PENDING_VERIFICATION' });
        const approvedUsers = await User.countDocuments({ status: 'APPROVED' });
        const rejectedUsers = await User.countDocuments({ status: 'REJECTED' });
        const totalManagers = await User.countDocuments({ role: 'MANAGER' });

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                pendingUsers,
                approvedUsers,
                rejectedUsers,
                totalManagers,
            },
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};
