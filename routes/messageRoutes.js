const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getConversation,
    getConversations,
    markAsRead,
    sendMessage,
} = require('../controllers/messageController');

// All routes require authentication
router.use(protect);

router.get('/conversations', getConversations);
router.get('/conversation/:userId', getConversation);
router.patch('/conversation/:conversationId/read', markAsRead);
router.post('/', sendMessage);

module.exports = router;
