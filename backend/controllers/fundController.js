const Transaction = require('../models/Transaction');

// @desc    Create fund entry (received)
// @route   POST /api/funds/receive
// @access  Private (Super Admin / Manager with view_funds permission)
exports.createFundEntry = async (req, res) => {
    try {
        const { amount, description, date, balanceAfterTransaction } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload screenshot proof',
            });
        }

        const screenshotUrl = `/uploads/proofs/${req.file.filename}`;

        const transaction = await Transaction.create({
            type: 'FUND_RECEIVED',
            amount,
            description,
            date: date || Date.now(),
            balanceAfterTransaction,
            screenshotUrl,
            createdBy: req.user.id,
        });

        res.status(201).json({
            success: true,
            data: transaction,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

// @desc    Create expense entry
// @route   POST /api/funds/expense
// @access  Private (Super Admin / Manager with upload_expenses permission)
exports.createExpenseEntry = async (req, res) => {
    try {
        const { amount, description, date, balanceAfterTransaction } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload screenshot proof',
            });
        }

        const screenshotUrl = `/uploads/proofs/${req.file.filename}`;

        const transaction = await Transaction.create({
            type: 'EXPENSE',
            amount,
            description,
            date: date || Date.now(),
            balanceAfterTransaction,
            screenshotUrl,
            createdBy: req.user.id,
        });

        res.status(201).json({
            success: true,
            data: transaction,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

// @desc    Get all transactions
// @route   GET /api/funds
// @access  Private (Super Admin / Manager with view_funds permission)
exports.getAllTransactions = async (req, res) => {
    try {
        const { type, month, year, page = 1, limit = 20 } = req.query;

        const query = {};
        if (type) query.type = type;

        if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);
            query.date = { $gte: startDate, $lte: endDate };
        }

        const transactions = await Transaction.find(query)
            .populate('createdBy', 'email memberId')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ date: -1 });

        const total = await Transaction.countDocuments(query);

        res.status(200).json({
            success: true,
            count: transactions.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            data: transactions,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

// @desc    Get fund dashboard stats
// @route   GET /api/funds/dashboard
// @access  Private (Super Admin)
exports.getFundDashboard = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // Monthly totals
        const monthlyFunds = await Transaction.aggregate([
            {
                $match: {
                    type: 'FUND_RECEIVED',
                    date: { $gte: startOfMonth, $lte: endOfMonth },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                },
            },
        ]);

        const monthlyExpenses = await Transaction.aggregate([
            {
                $match: {
                    type: 'EXPENSE',
                    date: { $gte: startOfMonth, $lte: endOfMonth },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                },
            },
        ]);

        // Latest balance (from most recent transaction)
        const latestTransaction = await Transaction.findOne()
            .sort({ date: -1, createdAt: -1 });

        // Recent transactions
        const recentTransactions = await Transaction.find()
            .populate('createdBy', 'email memberId')
            .sort({ date: -1 })
            .limit(10);

        res.status(200).json({
            success: true,
            data: {
                monthlyFundsReceived: monthlyFunds[0]?.total || 0,
                monthlyExpenses: monthlyExpenses[0]?.total || 0,
                latestBalance: latestTransaction?.balanceAfterTransaction || 0,
                recentTransactions,
            },
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};
