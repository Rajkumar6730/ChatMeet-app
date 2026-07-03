// server/routes/contactRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
    sendRequest,
    acceptRequest,
    rejectRequest,
    getRequests,
    getContacts,
    removeContact
} = require('../controllers/contactController');

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   POST /api/contacts/request
 * @desc    Send contact request
 * @access  Private
 */
router.post('/request', sendRequest);

/**
 * @route   PUT /api/contacts/request/:id/accept
 * @desc    Accept contact request
 * @access  Private
 */
router.put('/request/:id/accept', acceptRequest);

/**
 * @route   PUT /api/contacts/request/:id/reject
 * @desc    Reject contact request
 * @access  Private
 */
router.put('/request/:id/reject', rejectRequest);

/**
 * @route   GET /api/contacts/requests
 * @desc    Get pending contact requests
 * @access  Private
 */
router.get('/requests', getRequests);

/**
 * @route   GET /api/contacts
 * @desc    Get contacts list
 * @access  Private
 */
router.get('/', getContacts);

/**
 * @route   DELETE /api/contacts/:userId
 * @desc    Remove contact
 * @access  Private
 */
router.delete('/:userId', removeContact);

module.exports = router;