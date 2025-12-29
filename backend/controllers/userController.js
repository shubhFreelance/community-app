const Document = require('../models/Document');
const Notification = require('../models/Notification');

// @desc    Get user documents
// @route   GET /api/users/documents
// @access  Private (Approved users only)
exports.getMyDocuments = async (req, res) => {
    try {
        if (req.user.status !== 'APPROVED') {
            return res.status(403).json({
                success: false,
                message: 'Documents are only available for approved members',
            });
        }

        const documents = await Document.findOne({ user: req.user.id });

        if (!documents) {
            return res.status(404).json({
                success: false,
                message: 'Documents not found',
            });
        }

        res.status(200).json({
            success: true,
            data: documents,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

// @desc    Get user notifications
// @route   GET /api/users/notifications
// @access  Private
exports.getMyNotifications = async (req, res) => {
    try {
        // Get personal notifications and broadcasts
        const notifications = await Notification.find({
            $or: [
                { user: req.user.id },
                { user: null }, // Broadcasts
            ],
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: notifications.length,
            data: notifications,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/users/notifications/:id/read
// @access  Private
exports.markNotificationRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found',
            });
        }

        notification.isRead = true;
        await notification.save();

        res.status(200).json({
            success: true,
            data: notification,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};
