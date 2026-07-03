// server/controllers/uploadController.js
const path = require('path');
const fs = require('fs');
// No uuid import needed

// ---- Ensure upload directories exist (KEPT from OLD with additions) ----
const createUploadDirs = () => {
  const dirs = [
    'uploads/images', 
    'uploads/docs', 
    'uploads/audio', 
    'uploads/camera',
    'uploads/wallpapers',
    'uploads/videos',
    'uploads/avatars'
  ];
  dirs.forEach(dir => {
    const fullPath = path.join(__dirname, '../', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
};
createUploadDirs();

// ---- Helper function to generate file URL ----
const generateFileUrl = (filePath, req) => {
  const uploadsIndex = filePath.indexOf('uploads');
  const relativePath = filePath.substring(uploadsIndex);
  return `${req.protocol}://${req.get('host')}/${relativePath.replace(/\\/g, '/')}`;
};

// ---- Helper function to validate file ----
const validateFile = (file, maxSize = 5 * 1024 * 1024) => {
  if (!file) return { valid: false, error: 'No file uploaded' };
  
  // Check file size
  if (file.size > maxSize) {
    return { valid: false, error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit` };
  }
  
  // Check file type
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'audio/webm', 'audio/mpeg', 'audio/ogg', 'audio/wav',
    'video/mp4', 'video/webm', 'video/ogg',
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip', 'application/x-zip-compressed'
  ];
  
  if (!allowedTypes.includes(file.mimetype)) {
    return { valid: false, error: 'File type not allowed' };
  }
  
  return { valid: true };
};

// ---- Upload single file (KEPT from OLD with improvements) ----
exports.uploadFile = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const validation = validateFile(req.file);
    if (!validation.valid) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const file = req.file;
    const fileUrl = generateFileUrl(file.path, req);

    res.status(200).json({
      success: true,
      data: {
        url: fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: 'File upload failed'
    });
  }
};

// ---- Upload camera image (KEPT from OLD) ----
exports.uploadCameraImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image uploaded'
      });
    }

    const validation = validateFile(req.file);
    if (!validation.valid) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const file = req.file;
    const fileUrl = generateFileUrl(file.path, req);

    const imageData = {
      url: fileUrl,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      width: req.body.width || null,
      height: req.body.height || null,
      uploadedAt: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      data: imageData
    });
  } catch (error) {
    console.error('Camera upload error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: 'Failed to upload camera image'
    });
  }
};

// ---- Upload wallpaper (NEW FEATURE) ----
exports.uploadWallpaper = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No wallpaper uploaded'
      });
    }

    const validation = validateFile(req.file, 10 * 1024 * 1024);
    if (!validation.valid) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const file = req.file;
    const fileUrl = generateFileUrl(file.path, req);

    res.status(200).json({
      success: true,
      data: {
        url: fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Wallpaper upload error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: 'Failed to upload wallpaper'
    });
  }
};

// ---- Upload avatar (NEW FEATURE) ----
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No avatar uploaded'
      });
    }

    const validation = validateFile(req.file, 2 * 1024 * 1024);
    if (!validation.valid) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const file = req.file;
    const fileUrl = generateFileUrl(file.path, req);

    res.status(200).json({
      success: true,
      data: {
        url: fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: 'Failed to upload avatar'
    });
  }
};

// ---- Upload multiple files (NEW FEATURE) ----
exports.uploadMultipleFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadedFiles = [];
    const errors = [];

    for (const file of req.files) {
      const validation = validateFile(file);
      if (validation.valid) {
        const fileUrl = generateFileUrl(file.path, req);
        uploadedFiles.push({
          url: fileUrl,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          uploadedAt: new Date().toISOString()
        });
      } else {
        errors.push({
          fileName: file.originalname,
          error: validation.error
        });
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        uploaded: uploadedFiles,
        failed: errors,
        totalUploaded: uploadedFiles.length,
        totalFailed: errors.length
      }
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to upload files'
    });
  }
};

// ---- Delete file (UPDATED with security) ----
exports.deleteFile = (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename format'
      });
    }

    const uploadsDir = path.join(__dirname, '../uploads');
    const filePath = path.join(uploadsDir, filename);
    
    if (!path.resolve(filePath).startsWith(path.resolve(uploadsDir))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.status(200).json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file'
    });
  }
};

// ---- Get file info (NEW FEATURE) ----
exports.getFileInfo = (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename format'
      });
    }

    const uploadsDir = path.join(__dirname, '../uploads');
    const filePath = path.join(uploadsDir, filename);
    
    if (!path.resolve(filePath).startsWith(path.resolve(uploadsDir))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      res.status(200).json({
        success: true,
        data: {
          filename,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          isFile: stats.isFile()
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
  } catch (error) {
    console.error('Get file info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get file info'
    });
  }
};

// ---- List files in a directory (NEW FEATURE) ----
exports.listFiles = (req, res) => {
  try {
    const { directory = 'images' } = req.query;
    const uploadsDir = path.join(__dirname, '../uploads', directory);
    
    // Validate directory
    const allowedDirs = ['images', 'docs', 'audio', 'camera', 'wallpapers', 'videos', 'avatars'];
    if (!allowedDirs.includes(directory)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid directory'
      });
    }
    
    if (!fs.existsSync(uploadsDir)) {
      return res.status(200).json({
        success: true,
        data: {
          files: [],
          directory,
          total: 0
        }
      });
    }

    const files = fs.readdirSync(uploadsDir)
      .filter(filename => {
        const filePath = path.join(uploadsDir, filename);
        return fs.statSync(filePath).isFile();
      })
      .map(filename => {
        const filePath = path.join(uploadsDir, filename);
        const stats = fs.statSync(filePath);
        return {
          filename,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      });

    res.status(200).json({
      success: true,
      data: {
        files,
        directory,
        total: files.length
      }
    });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list files'
    });
  }
};

// ---- Clean up orphaned files (NEW FEATURE) ----
exports.cleanupOrphanedFiles = async (req, res) => {
  try {
    // This would typically be run as a scheduled job
    // For now, just return a message
    res.status(200).json({
      success: true,
      message: 'Cleanup functionality available',
      note: 'Run as scheduled job to remove orphaned files older than 7 days'
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup files'
    });
  }
};

// ---- Serve static files (NEW FEATURE) ----
exports.serveFile = (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename format'
      });
    }

    const uploadsDir = path.join(__dirname, '../uploads');
    const filePath = path.join(uploadsDir, filename);
    
    if (!path.resolve(filePath).startsWith(path.resolve(uploadsDir))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
  } catch (error) {
    console.error('Serve file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve file'
    });
  }
};