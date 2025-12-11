const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Class = require('../models/Class');

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getDashboardStats = asyncHandler(async (req, res) => {
    // 1. Total Users
    const totalUsers = await User.countDocuments();

    // 2. Active Trainers
    const activeTrainers = await User.countDocuments({ role: 'trainer' });

    // 3. Total Revenue (MRR estimate from active subscriptions)
    const subscriptions = await Subscription.find({ status: 'active' });
    const totalRevenue = subscriptions.reduce((acc, sub) => {
        let amount = 0;
        const plan = sub.plan ? sub.plan.toLowerCase() : '';
        if (plan === 'basic') amount = 29;
        if (plan === 'pro') amount = 59;
        if (plan === 'elite') amount = 99;
        return acc + amount;
    }, 0);

    // 4. System Health (Mock for now, or check DB connection)
    const systemHealth = '99.9%';

    res.json({
        totalUsers,
        activeTrainers,
        totalRevenue: totalRevenue * 1000, // Formatting to match previous "k" scale or just return raw
        systemHealth
    });
});

// @desc    Get revenue data for chart
// @route   GET /api/admin/revenue
// @access  Private (Admin)
const getRevenueData = asyncHandler(async (req, res) => {
    // Aggregate subscriptions by day for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const revenue = await Subscription.aggregate([
        {
            $match: {
                createdAt: { $gte: sevenDaysAgo }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                // Estimate revenue based on plan type roughly
                total: {
                    $sum: {
                        $switch: {
                            branches: [
                                { case: { $regexMatch: { input: "$plan", regex: /basic/i } }, then: 29 },
                                { case: { $regexMatch: { input: "$plan", regex: /pro/i } }, then: 59 },
                                { case: { $regexMatch: { input: "$plan", regex: /elite/i } }, then: 99 }
                            ],
                            default: 0
                        }
                    }
                }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // Format for frontend (Mon, Tue, etc.)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const formattedData = revenue.map(item => {
        const date = new Date(item._id);
        return {
            name: days[date.getDay()],
            revenue: item.total
        };
    });

    res.json(formattedData);
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = asyncHandler(async (req, res) => {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;

    // Search functionality
    const keyword = req.query.keyword ? {
        name: {
            $regex: req.query.keyword,
            $options: 'i',
        },
    } : {};

    const count = await User.countDocuments({ ...keyword });
    const users = await User.find({ ...keyword })
        .select('-password')
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort({ createdAt: -1 });

    res.json({ users, page, pages: Math.ceil(count / pageSize) });
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin)
const updateUserRole = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        user.role = req.body.role || user.role;
        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        await user.deleteOne();
        res.json({ message: 'User removed' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

module.exports = {
    getDashboardStats,
    getRevenueData,
    getAllUsers,
    updateUserRole,
    deleteUser
};
