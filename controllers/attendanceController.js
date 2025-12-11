const Attendance = require('../models/Attendance');

// @desc    Mark attendance (Upsert: Create or Update)
// @route   POST /api/attendance
// @access  Private (Trainer)
exports.markAttendance = async (req, res) => {
    try {
        const { classId, memberId, status, date } = req.body;

        // Parse date to start/end of day to match entry ignoring time
        const queryDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

        let attendance = await Attendance.findOne({
            classId,
            member: memberId,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });

        if (attendance) {
            attendance.status = status;
            attendance = await attendance.save();
        } else {
            attendance = await Attendance.create({
                classId,
                member: memberId,
                status,
                date: date || new Date(),
            });
        }

        res.status(201).json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Error marking attendance', error: error.message });
    }
};

// @desc    Get attendance for a class (Optional: ?date=YYYY-MM-DD)
// @route   GET /api/attendance/class/:classId
// @access  Private
exports.getClassAttendance = async (req, res) => {
    try {
        let query = { classId: req.params.classId };

        if (req.query.date) {
            const queryDate = new Date(req.query.date);
            const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));
            query.date = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        }

        const attendance = await Attendance.find(query)
            .populate('member', 'name email')
            .sort('-date');

        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attendance', error: error.message });
    }
};

// @desc    Get my attendance (for members)
// @route   GET /api/attendance/my-attendance
// @access  Private (Member)
exports.getMyAttendance = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const attendance = await Attendance.find({ member: req.user._id })
            .populate('classId', 'title startTime')
            .sort('-date')
            .limit(50);

        // Calculate statistics
        const totalClasses = attendance.length;
        const presentCount = attendance.filter(a => a.status === 'present').length;
        const absentCount = attendance.filter(a => a.status === 'absent').length;
        const attendanceRate = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(1) : 0;

        res.json({
            attendance,
            stats: {
                total: totalClasses,
                present: presentCount,
                absent: absentCount,
                rate: attendanceRate
            }
        });
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ message: 'Error fetching attendance', error: error.message });
    }
};

// @desc    Get attendance for any user
// @route   GET /api/attendance/user/:memberId
// @access  Private (Admin)
exports.getUserAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.find({ member: req.params.memberId })
            .populate('classId', 'title startTime')
            .sort('-date')
            .limit(50);

        // Calculate statistics
        const totalClasses = attendance.length;
        const presentCount = attendance.filter(a => a.status === 'present').length;
        const absentCount = attendance.filter(a => a.status === 'absent').length;
        const attendanceRate = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(1) : 0;

        res.json({
            attendance,
            stats: {
                total: totalClasses,
                present: presentCount,
                absent: absentCount,
                rate: attendanceRate
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user attendance', error: error.message });
    }
};
