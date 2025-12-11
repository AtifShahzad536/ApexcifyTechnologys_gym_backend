const asyncHandler = require('express-async-handler');
const Class = require('../models/Class');

// @desc    Get all classes
// @route   GET /api/classes
// @access  Public
const getClasses = asyncHandler(async (req, res) => {
    // Only get classes with startTime greater than or equal to current time
    const classes = await Class.find({
        startTime: { $gte: new Date() }
    }).populate('trainer', 'name email').sort({ startTime: 1 });
    res.json(classes);
});

// @desc    Get ALL classes (including past) for Admin
// @route   GET /api/classes/admin-all
// @access  Private (Admin)
const getAllClassesAdmin = asyncHandler(async (req, res) => {
    const classes = await Class.find({})
        .populate('trainer', 'name email')
        .sort({ startTime: -1 }); // Newest first for admins
    res.json(classes);
});

// @desc    Get class by ID
// @route   GET /api/classes/:id
// @access  Public
const getClassById = asyncHandler(async (req, res) => {
    const gymClass = await Class.findById(req.params.id).populate(
        'trainer',
        'name email'
    );

    if (gymClass) {
        res.json(gymClass);
    } else {
        res.status(404);
        throw new Error('Class not found');
    }
});

// @desc    Get classes for a trainer (or all for admin in attendance view)
// @route   GET /api/classes/trainer-classes
// @access  Private (Trainer/Admin)
const getTrainerClasses = asyncHandler(async (req, res) => {
    let query = {};

    // If user is trainer, only show their classes
    // If admin, show all classes (query remains empty)
    if (req.user.role === 'trainer') {
        query = { trainer: req.user._id };
    }

    const classes = await Class.find(query)
        .populate('trainer', 'name email')
        .sort({ startTime: -1 });

    res.json(classes);
});

// @desc    Create a class
// @route   POST /api/classes
// @access  Private/Admin/Trainer
const createClass = asyncHandler(async (req, res) => {
    const { title, description, startTime, duration, capacity, trainerId } = req.body;

    let assignedTrainer = req.user._id;

    // If admin is creating the class and specifies a trainer, use that trainer's ID
    if (req.user.role === 'admin' && trainerId) {
        assignedTrainer = trainerId;
    }

    const gymClass = new Class({
        title,
        description,
        startTime,
        duration,
        capacity,
        trainer: assignedTrainer,
    });

    const createdClass = await gymClass.save();
    res.status(201).json(createdClass);
});

// @desc    Delete a class
// @route   DELETE /api/classes/:id
// @access  Private/Admin/Trainer
const deleteClass = asyncHandler(async (req, res) => {
    const gymClass = await Class.findById(req.params.id);

    if (gymClass) {
        if (
            gymClass.trainer.toString() !== req.user._id.toString() &&
            req.user.role !== 'admin'
        ) {
            res.status(401);
            throw new Error('Not authorized to delete this class');
        }
        await gymClass.deleteOne();
        res.json({ message: 'Class removed' });
    } else {
        res.status(404);
        throw new Error('Class not found');
    }
});

// @desc    Enroll in a class
// @route   POST /api/classes/:id/enroll
// @access  Private/Member
const enrollClass = asyncHandler(async (req, res) => {
    const gymClass = await Class.findById(req.params.id);

    if (gymClass) {
        if (gymClass.enrolledMembers.includes(req.user._id)) {
            res.status(400);
            throw new Error('Already enrolled');
        }

        if (gymClass.enrolledMembers.length >= gymClass.capacity) {
            res.status(400);
            throw new Error('Class is full');
        }

        gymClass.enrolledMembers.push(req.user._id);
        await gymClass.save();
        res.json({ message: 'Enrolled successfully' });
    } else {
        res.status(404);
        throw new Error('Class not found');
    }
});

module.exports = {
    getClasses,
    getAllClassesAdmin,
    getClassById,
    getTrainerClasses,
    createClass,
    deleteClass,
    enrollClass,
};
