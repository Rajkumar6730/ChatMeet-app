// server/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { uploadFile, uploadCameraImage, deleteFile } = require('../controllers/uploadController');
const { authMiddleware } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Upload single file
router.post('/', upload.single('file'), uploadFile);

// Upload camera image
router.post('/camera', upload.single('file'), uploadCameraImage);

// Delete file
router.delete('/:filename', deleteFile);

module.exports = router;