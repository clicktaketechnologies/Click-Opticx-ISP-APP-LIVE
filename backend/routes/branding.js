import express from 'express';
import multer from 'multer';
import cloudinary from 'cloudinary';
import { protect, restrictTo } from '../middleware/auth.js';
import configManager from '../services/config-manager.js';
import logger from '../utils/logger.js';
import { moveToTrash } from '../utils/trash-manager.js';
import fs from 'fs';


const router = express.Router();
const upload = multer({ 
  dest: 'uploads/temp/',
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit as requested
});
const cloudinaryV2 = cloudinary.v2;

// Configure Cloudinary
cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * GET /api/branding/media
 * Fetch all media assets for branding
 */
router.get('/media', protect, async (req, res) => {
  try {
    const supabase = configManager.getSupabaseClient();
    if (!supabase) return res.status(503).json({ success: false, message: 'Database offline' });

    const { data, error } = await supabase
      .from('branding_assets')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, assets: data || [] });
  } catch (error) {
    logger.error(`[BRANDING] List error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/branding/media
 * Upload a new branding asset to Cloudinary and record in DB
 */
router.post('/media', protect, restrictTo('SuperAdmin', 'Admin'), upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Protocol Error: No media payload detected.' });
  }

  // Check file type (PNG requirement check)
  if (req.file.mimetype !== 'image/png' && req.file.mimetype !== 'image/jpeg') {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(400).json({ success: false, message: 'Invalid Asset Format: Only PNG/JPEG blueprints allowed.' });
  }

  try {
    // Upload to Cloudinary
    const uploadResult = await cloudinaryV2.uploader.upload(req.file.path, {
      folder: 'branding_assets',
      resource_type: 'auto'
    });

    // Cleanup temp file
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    const supabase = configManager.getSupabaseClient();
    const assetData = {
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      file_name: req.file.originalname,
      file_size: req.file.size,
      file_type: req.file.mimetype,
      created_by: req.user.id,
      is_deleted: false
    };

    const { data, error } = await supabase
      .from('branding_assets')
      .insert(assetData)
      .select()
      .single();

    if (error) throw error;

    const io = req.app.get('socketio');
    if (io) io.emit('branding_media_updated', { action: 'upload', asset: data });

    logger.info(`[BRANDING] New asset uploaded: ${data.file_name} by ${req.user.id}`);
    res.json({ success: true, asset: data });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    logger.error(`[BRANDING] Upload error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/branding/media
 * Soft delete a branding asset
 */
router.delete('/media', protect, restrictTo('SuperAdmin', 'Admin'), async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ success: false, message: 'Asset ID required for decommissioning.' });

  try {
    // Perform Hard Move to Trash
    await moveToTrash('branding_assets', id, req.user.id);

    const io = req.app.get('socketio');
    if (io) io.emit('branding_media_updated', { action: 'delete', id });

    res.json({ success: true, message: 'Asset decommissioning successful (Moved to Trash).' });
  } catch (error) {


    logger.error(`[BRANDING] Delete error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
