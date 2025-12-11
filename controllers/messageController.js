const Message = require('../models/Message');

// Get conversation history between two users
exports.getConversation = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        // Create conversation ID (sorted to ensure consistency)
        const conversationId = [currentUserId, userId].sort().join('_');

        const messages = await Message.find({ conversationId })
            .populate('sender', 'name email')
            .populate('receiver', 'name email')
            .sort({ createdAt: 1 })
            .limit(100);

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages', error: error.message });
    }
};

// Get all conversations for a user
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get unique conversation IDs
        const messages = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: userId },
                        { receiver: userId }
                    ]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: '$conversationId',
                    lastMessage: { $first: '$$ROOT' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                { $and: [{ $eq: ['$receiver', userId] }, { $eq: ['$read', false] }] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'lastMessage.sender',
                    foreignField: '_id',
                    as: 'senderInfo'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'lastMessage.receiver',
                    foreignField: '_id',
                    as: 'receiverInfo'
                }
            },
            {
                $project: {
                    _id: 1,
                    unreadCount: 1,
                    lastMessage: {
                        _id: '$lastMessage._id',
                        content: '$lastMessage.content',
                        createdAt: '$lastMessage.createdAt',
                        sender: { $arrayElemAt: ['$senderInfo', 0] },
                        receiver: { $arrayElemAt: ['$receiverInfo', 0] }
                    }
                }
            }
        ]);

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching conversations', error: error.message });
    }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        await Message.updateMany(
            { conversationId, receiver: userId, read: false },
            { read: true }
        );

        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Error marking messages as read', error: error.message });
    }
};

// Send message (fallback for non-socket)
exports.sendMessage = async (req, res) => {
    try {
        const { receiverId, content } = req.body;
        const senderId = req.user._id;

        const conversationId = [senderId, receiverId].sort().join('_');

        const message = await Message.create({
            sender: senderId,
            receiver: receiverId,
            content,
            conversationId,
        });

        await message.populate('sender receiver', 'name email');

        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ message: 'Error sending message', error: error.message });
    }
};
