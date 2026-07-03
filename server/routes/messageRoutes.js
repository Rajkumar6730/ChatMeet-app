const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
    getMessages,
    sendMessage,
    deleteMessage,
    markMessageAsRead,
    markMessageAsDelivered,
    reactToMessage,
    removeReaction,
    getMessageReactions,
    forwardMessage,
    replyToMessage,
    getMediaMessages,
    starMessage,
    forwardMessages,
    editMessage,
    getMessageEditHistory
} = require('../controllers/messageController');

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/messages/chat/:chatId
 * @desc    Get messages for a chat
 * @access  Private
 */
router.get('/chat/:chatId', getMessages);

/**
 * @route   GET /api/messages/group/:groupId
 * @desc    Get messages for a group
 * @access  Private
 */
router.get('/group/:groupId', getMessages);

/**
 * @route   POST /api/messages
 * @desc    Send a new message
 * @access  Private
 */
router.post('/', sendMessage);

/**
 * @route   PUT /api/messages/:id
 * @desc    Edit a message
 * @access  Private
 */
router.put('/:id', editMessage);

/**
 * @route   PUT /api/messages/:id/read
 * @desc    Mark message as read
 * @access  Private
 */
router.put('/:id/read', markMessageAsRead);

/**
 * @route   PUT /api/messages/:id/delivered
 * @desc    Mark message as delivered
 * @access  Private
 */
router.put('/:id/delivered', markMessageAsDelivered);

/**
 * @route   POST /api/messages/:id/react
 * @desc    Add reaction to message
 * @access  Private
 */
router.post('/:id/react', reactToMessage);

/**
 * @route   DELETE /api/messages/:id/react
 * @desc    Remove reaction from message
 * @access  Private
 */
router.delete('/:id/react', removeReaction);

/**
 * @route   GET /api/messages/:id/reactions
 * @desc    Get message reactions
 * @access  Private
 */
router.get('/:id/reactions', getMessageReactions);

/**
 * @route   POST /api/messages/:id/forward
 * @desc    Forward a message
 * @access  Private
 */
router.post('/:id/forward', forwardMessage);

/**
 * @route   POST /api/messages/:id/reply
 * @desc    Reply to a message
 * @access  Private
 */
router.post('/:id/reply', replyToMessage);

/**
 * @route   GET /api/messages/media/:chatId
 * @desc    Get media messages
 * @access  Private
 */
router.get('/media/:chatId', getMediaMessages);

/**
 * @route   DELETE /api/messages/:id
 * @desc    Delete a message
 * @access  Private
 */
router.delete('/:id', deleteMessage);

/**
 * @route   POST /api/messages/:id/star
 * @desc    Star/Unstar a message
 * @access  Private
 */
router.post('/:id/star', authMiddleware, starMessage);

/**
 * @route   POST /api/messages/forward
 * @desc    Forward messages to multiple chats
 * @access  Private
 */
router.post('/forward', forwardMessages);

/**
 * @route   PUT /api/messages/:id/edit
 * @desc    Edit a message
 * @access  Private
 */
router.put('/:id/edit', editMessage);

/**
 * @route   GET /api/messages/:id/history
 * @desc    Get message edit history
 * @access  Private
 */
router.get('/:id/history', getMessageEditHistory);

module.exports = router;