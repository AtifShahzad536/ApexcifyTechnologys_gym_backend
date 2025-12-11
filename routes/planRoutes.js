const express = require('express');
const router = express.Router();
const {
    createWorkoutPlan,
    getMyWorkoutPlans,
    createDietPlan,
    getMyDietPlans,
    getUserDietPlans,
    updateDietPlan,
    deleteDietPlan,
} = require('../controllers/planController');
const { protect, trainer } = require('../middleware/authMiddleware');

router.post('/workout', protect, trainer, createWorkoutPlan);
router.get('/workout/my', protect, getMyWorkoutPlans);

router.post('/diet', protect, trainer, createDietPlan);
router.get('/diet/my', protect, getMyDietPlans);
router.get('/diet/user/:userId', protect, trainer, getUserDietPlans);
router.route('/diet/:id').put(protect, trainer, updateDietPlan).delete(protect, trainer, deleteDietPlan);

module.exports = router;
