const express = require('express');
const router = express.Router();
const multer = require('multer');
const storageRouter = require('../modules/storage/storage-router');
const logger = require('../utils/logger');

const upload = multer({ dest: 'uploads/temp/' });

/**
 * Multi-Provider Upload
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  const { userId, folder, publicId } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ success: false, message: 'No file provided' });

  try {
    const result = await storageRouter.uploadFile(file, { userId, folder, publicId });
    res.json(result);
  } catch (error) {
    logger.error(`[STORAGE-API] Upload failed: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
