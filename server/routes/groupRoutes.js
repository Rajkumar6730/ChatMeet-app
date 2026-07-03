const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
    getGroups,
    getGroupById,
    createGroup,
    updateGroup,
    deleteGroup,
    addMember,
    removeMember,
    makeAdmin,
    removeAdmin,
    leaveGroup,
    getGroupMembers,
    getGroupRequests,
    acceptRequest,
    rejectRequest,
    updateGroupSettings,
    markGroupAsRead
} = require('../controllers/groupController');

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/groups
 * @desc    Get all groups for current user
 * @access  Private
 */
router.get('/', getGroups);

/**
 * @route   GET /api/groups/:id
 * @desc    Get group by ID
 * @access  Private
 */
router.get('/:id', getGroupById);

/**
 * @route   POST /api/groups
 * @desc    Create a new group
 * @access  Private
 */
router.post('/', createGroup);

/**
 * @route   PUT /api/groups/:id
 * @desc    Update group details
 * @access  Private
 */
router.put('/:id', updateGroup);

/**
 * @route   PUT /api/groups/:id/settings
 * @desc    Update group settings
 * @access  Private
 */
router.put('/:id/settings', updateGroupSettings);

/**
 * @route   PUT /api/groups/:id/read
 * @desc    Mark group as read
 * @access  Private
 */
router.put('/:id/read', markGroupAsRead);

/**
 * @route   POST /api/groups/:id/members
 * @desc    Add member to group
 * @access  Private
 */
router.post('/:id/members', addMember);

/**
 * @route   DELETE /api/groups/:id/members/:userId
 * @desc    Remove member from group
 * @access  Private
 */
router.delete('/:id/members/:userId', removeMember);

/**
 * @route   PUT /api/groups/:id/admins/:userId
 * @desc    Make user admin
 * @access  Private
 */
router.put('/:id/admins/:userId', makeAdmin);

/**
 * @route   DELETE /api/groups/:id/admins/:userId
 * @desc    Remove admin
 * @access  Private
 */
router.delete('/:id/admins/:userId', removeAdmin);

/**
 * @route   POST /api/groups/:id/leave
 * @desc    Leave group
 * @access  Private
 */
router.post('/:id/leave', leaveGroup);

/**
 * @route   GET /api/groups/:id/members
 * @desc    Get group members
 * @access  Private
 */
router.get('/:id/members', getGroupMembers);

/**
 * @route   GET /api/groups/:id/requests
 * @desc    Get join requests
 * @access  Private
 */
router.get('/:id/requests', getGroupRequests);

/**
 * @route   PUT /api/groups/:id/requests/:userId/accept
 * @desc    Accept join request
 * @access  Private
 */
router.put('/:id/requests/:userId/accept', acceptRequest);

/**
 * @route   DELETE /api/groups/:id/requests/:userId/reject
 * @desc    Reject join request
 * @access  Private
 */
router.delete('/:id/requests/:userId/reject', rejectRequest);

/**
 * @route   DELETE /api/groups/:id
 * @desc    Delete group
 * @access  Private
 */
router.delete('/:id', deleteGroup);

module.exports = router;