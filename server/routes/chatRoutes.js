const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
    getChats,
    getChatById,
    createChat,
    deleteChat,
    archiveChat,
    unarchiveChat,
    muteChat,
    unmuteChat,
    pinChat,
    unpinChat,
    getUnreadCount,
    markChatAsRead,
    markChatAsUnread,
    clearChat
} = require('../controllers/chatController');

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/chats
 * @desc    Get all chats for current user
 * @access  Private
 */
router.get('/', getChats);

/**
 * @route   GET /api/chats/unread
 * @desc    Get total unread count
 * @access  Private
 */
router.get('/unread', getUnreadCount);

/**
 * @route   GET /api/chats/:id
 * @desc    Get chat by ID
 * @access  Private
 */
router.get('/:id', getChatById);

/**
 * @route   POST /api/chats
 * @desc    Create a new chat
 * @access  Private
 */
router.post('/', createChat);

/**
 * @route   PUT /api/chats/:id/read
 * @desc    Mark chat as read
 * @access  Private
 */
router.put('/:id/read', markChatAsRead);

/**
 * @route   PUT /api/chats/:id/archive
 * @desc    Archive chat
 * @access  Private
 */
router.put('/:id/archive', archiveChat);

/**
 * @route   PUT /api/chats/:id/unarchive
 * @desc    Unarchive chat
 * @access  Private
 */
router.put('/:id/unarchive', unarchiveChat);

/**
 * @route   PUT /api/chats/:id/mute
 * @desc    Mute chat
 * @access  Private
 */
router.put('/:id/mute', muteChat);

/**
 * @route   PUT /api/chats/:id/unmute
 * @desc    Unmute chat
 * @access  Private
 */
router.put('/:id/unmute', unmuteChat);

/**
 * @route   PUT /api/chats/:id/pin
 * @desc    Pin chat
 * @access  Private
 */
router.put('/:id/pin', pinChat);

/**
 * @route   PUT /api/chats/:id/unpin
 * @desc    Unpin chat
 * @access  Private
 */
router.put('/:id/unpin', unpinChat);

/**
 * @route   DELETE /api/chats/:id
 * @desc    Delete chat
 * @access  Private
 */
router.delete('/:id', deleteChat);

module.exports = router;

/**
 * @route   PUT /api/chats/:id/unread
 * @desc    Mark chat as unread
 * @access  Private
 */
router.put('/:id/unread', markChatAsUnread);

/**
 * @route   POST /api/chats/:id/clear
 * @desc    Clear chat for current user
 * @access  Private
 */
router.post('/:id/clear', clearChat);