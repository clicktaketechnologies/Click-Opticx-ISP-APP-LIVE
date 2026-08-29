import configManager from '../services/config-manager.js';
import logger from '../utils/logger.js';

/**
 * TrashManager
 * Handles moving records to the trash table before hard deletion.
 */
export async function moveToTrash(tableName, recordId, adminId) {
  const supabase = configManager.getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    // 1. Fetch the full record
    const { data: record, error: fetchError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', recordId)
      .single();

    if (fetchError || !record) throw new Error(`Record ${recordId} not found in ${tableName}`);

    // 2. Insert into Trash
    const { error: trashError } = await supabase
      .from('trash')
      .insert({
        original_table: tableName,
        original_id: String(recordId),
        payload: record,
        deleted_by: adminId,
        deleted_at: new Date().toISOString()
      });

    if (trashError) throw trashError;

    // 3. Hard Delete from Original Table
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .eq('id', recordId);

    if (deleteError) {
      // Rollback trash insertion if delete fails
      await supabase.from('trash').delete().eq('original_id', String(recordId)).eq('original_table', tableName);
      throw deleteError;
    }

    logger.info(`[TRASH-MGR] ${tableName} record ${recordId} moved to trash by ${adminId}`);
    return { success: true };
  } catch (error) {
    logger.error(`[TRASH-MGR] Error moving ${tableName} to trash: ${error.message}`);
    throw error;
  }
}

export default { moveToTrash };
