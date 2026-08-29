import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import configManager from '../services/config-manager.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/trash
 * List all items in the trash
 */
router.get('/', protect, restrictTo('SuperAdmin', 'Admin'), async (req, res) => {
  try {
    const supabase = configManager.getSupabaseClient();
    const { data, error } = await supabase
      .from('trash')
      .select('*')
      .order('deleted_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, items: data || [] });
  } catch (error) {
    logger.error(`[TRASH] List error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/trash/:id/restore
 * Restore an item from the trash back to its original table
 */
router.post('/:id/restore', protect, restrictTo('SuperAdmin', 'Admin'), async (req, res) => {
  const { id } = req.params;

  try {
    const supabase = configManager.getSupabaseClient();
    
    // 1. Get the trash record
    const { data: trashItem, error: fetchError } = await supabase
      .from('trash')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !trashItem) throw new Error('Trash item not found');

    const { original_table, payload } = trashItem;

    // 2. Insert back into original table
    const { error: restoreError } = await supabase
      .from(original_table)
      .insert(payload);

    if (restoreError) throw restoreError;

    // 3. Remove from trash
    await supabase.from('trash').delete().eq('id', id);

    logger.info(`[TRASH] Item ${id} restored to ${original_table} by ${req.user.id}`);
    res.json({ success: true, message: `Item successfully restored to ${original_table}.` });
  } catch (error) {
    logger.error(`[TRASH] Restore error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/trash/:id
 * Permanently purge an item from the trash
 */
router.delete('/:id', protect, restrictTo('SuperAdmin', 'Admin'), async (req, res) => {
  const { id } = req.params;

  try {
    const supabase = configManager.getSupabaseClient();
    const { error } = await supabase.from('trash').delete().eq('id', id);

    if (error) throw error;

    logger.warn(`[TRASH] Item ${id} permanently purged by ${req.user.id}`);
    res.json({ success: true, message: 'Item permanently purged from system.' });
  } catch (error) {
    logger.error(`[TRASH] Purge error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
