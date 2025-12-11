const express = require('express');
const router = express.Router();
const {
    markAttendance,
    getClassAttendance,
    getMyAttendance,
    getUserAttendance
} = require('../controllers/attendanceController');
const { protect, trainer, admin } = require('../middleware/authMiddleware');

router.post('/', protect, trainer, markAttendance);
router.get('/class/:classId', protect, trainer, getClassAttendance);
router.get('/my', protect, getMyAttendance);
router.get('/user/:memberId', protect, admin, getUserAttendance);

module.exports = router;
