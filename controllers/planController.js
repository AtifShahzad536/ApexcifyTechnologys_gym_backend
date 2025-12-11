const asyncHandler = require('express-async-handler');
const WorkoutPlan = require('../models/WorkoutPlan');
const DietPlan = require('../models/DietPlan');

// @desc    Create workout plan
// @route   POST /api/plans/workout
// @access  Private/Trainer
const createWorkoutPlan = asyncHandler(async (req, res) => {
    const { memberId, title, description, exercises, startDate, endDate } = req.body;

    const workoutPlan = await WorkoutPlan.create({
        member: memberId,
        trainer: req.user._id,
        title,
        description,
        exercises,
        startDate,
        endDate,
    });

    res.status(201).json(workoutPlan);
});

// @desc    Get my workout plans (Member)
// @route   GET /api/plans/workout/my
// @access  Private
const getMyWorkoutPlans = asyncHandler(async (req, res) => {
    // Only get plans where endDate is in the future
    const plans = await WorkoutPlan.find({
        member: req.user._id,
        endDate: { $gte: new Date() }
    }).populate(
        'trainer',
        'name'
    ).sort({ startDate: -1 });
    res.json(plans);
});

// @desc    Create diet plan
// @route   POST /api/plans/diet
// @access  Private/Trainer
const createDietPlan = asyncHandler(async (req, res) => {
    const { memberId, title, description, meals, startDate, endDate } = req.body;

    const dietPlan = await DietPlan.create({
        member: memberId,
        trainer: req.user._id,
        title,
        description,
        meals,
        startDate,
        endDate,
    });

    res.status(201).json(dietPlan);
});

// @desc    Get my diet plans (Member)
// @route   GET /api/plans/diet/my
// @access  Private
const getMyDietPlans = asyncHandler(async (req, res) => {
    // Only get plans where endDate is in the future
    const plans = await DietPlan.find({
        member: req.user._id,
        endDate: { $gte: new Date() }
    }).populate(
        'trainer',
        'name'
    ).sort({ startDate: -1 });
    res.json(plans);
});

// @desc    Get diet plans for a specific user
// @route   GET /api/plans/diet/user/:userId
// @access  Private/Trainer/Admin
const getUserDietPlans = asyncHandler(async (req, res) => {
    const plans = await DietPlan.find({
        member: req.params.userId
    }).populate(
        'trainer',
        'name'
    ).sort({ startDate: -1 });
    res.json(plans);
});

// @desc    Update diet plan
// @route   PUT /api/plans/diet/:id
// @access  Private/Trainer/Admin
const updateDietPlan = asyncHandler(async (req, res) => {
    const dietPlan = await DietPlan.findById(req.params.id);

    if (dietPlan) {
        dietPlan.title = req.body.title || dietPlan.title;
        dietPlan.description = req.body.description || dietPlan.description;
        dietPlan.meals = req.body.meals || dietPlan.meals;
        dietPlan.startDate = req.body.startDate || dietPlan.startDate;
        dietPlan.endDate = req.body.endDate || dietPlan.endDate;

        const updatedDietPlan = await dietPlan.save();
        res.json(updatedDietPlan);
    } else {
        res.status(404);
        throw new Error('Diet plan not found');
    }
});

// @desc    Delete diet plan
// @route   DELETE /api/plans/diet/:id
// @access  Private/Trainer/Admin
const deleteDietPlan = asyncHandler(async (req, res) => {
    const dietPlan = await DietPlan.findById(req.params.id);

    if (dietPlan) {
        await dietPlan.deleteOne();
        res.json({ message: 'Diet plan removed' });
    } else {
        res.status(404);
        throw new Error('Diet plan not found');
    }
});

module.exports = {
    createWorkoutPlan,
    getMyWorkoutPlans,
    createDietPlan,
    getMyDietPlans,
    getUserDietPlans,
    updateDietPlan,
    deleteDietPlan,
};
