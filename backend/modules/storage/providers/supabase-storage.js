import configManager from '../../../services/config-manager.js';
import fs from 'fs';

/**
 * Supabase Storage Provider
 */
export async function upload(file, options = {}) {
  const supabase = configManager.getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    const fileBuffer = fs.readFileSync(file.path);
    const fileName = `${options.folder || 'kyc'}/${file.userId}/${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from('isp-assets')
      .upload(fileName, fileBuffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('isp-assets')
      .getPublicUrl(fileName);

    return {
      success: true,
      url: publicUrl,
      provider: 'supabase_storage',
      providerData: data
    };
  } catch (error) {
    throw new Error(`Supabase Storage Error: ${error.message}`);
  }
}

export default { upload };
