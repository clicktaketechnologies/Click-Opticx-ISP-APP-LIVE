import express from 'express';
import multer from 'multer';
import storageRouter from '../modules/storage/storage-router.js';
import logger from '../utils/logger.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/temp/' });

/**
 * Multi-Provider Upload
 */
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  const { userId, folder, publicId } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ success: false, message: 'No file provided' });

  try {
    const result = await storageRouter.uploadFile(file, { userId: userId || req.user.id, folder, publicId });
    res.json(result);
  } catch (error) {
    logger.error(`[STORAGE-API] Upload failed: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
