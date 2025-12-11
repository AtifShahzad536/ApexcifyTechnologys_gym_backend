const express = require('express');
const router = express.Router();
const {
    getClasses,
    getClassById,
    createClass,
    deleteClass,
    enrollClass,
    getTrainerClasses,
    getAllClassesAdmin
} = require('../controllers/classController');
const { protect, trainer, admin } = require('../middleware/authMiddleware');

router.get('/trainer-classes', protect, getTrainerClasses);
router.get('/admin-all', protect, admin, getAllClassesAdmin);
router.route('/').get(getClasses).post(protect, trainer, createClass);
router
    .route('/:id')
    .get(getClassById)
    .delete(protect, trainer, deleteClass);
router.route('/:id/enroll').post(protect, enrollClass);

module.exports = router;
