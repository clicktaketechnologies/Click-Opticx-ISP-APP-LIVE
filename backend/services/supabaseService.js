import { createClient } from '@supabase/supabase-js';
import logger from '../utils/logger.js';
import fs from 'fs';

class SupabaseService {
    constructor() {
        this.client = null;
    }

    setCredentials(config) {
        this.client = createClient(config.endpoint, config.api_key);
    }

    async testConnection() {
        try {
            if (!this.client) throw new Error('Supabase client not initialized');
            // Test by trying to list buckets
            const { data, error } = await this.client.storage.listBuckets();
            if (error) throw error;
            return { success: true, status: 'VERIFIED' };
        } catch (error) {
            logger.error(`[Supabase Test] ${error.message}`);
            return { success: false, status: 'FAILED', message: error.message };
        }
    }

    async uploadFile(fileName, filePath, fileType) {
        try {
            if (!this.client) throw new Error('Supabase client not initialized');
            const fileData = fs.readFileSync(filePath);
            const { data, error } = await this.client.storage
                .from('kyc-artifacts') // Expect this bucket to exist
                .upload(`sync_${Date.now()}_${fileName}`, fileData, {
                    contentType: fileType,
                    upsert: true
                });

            if (error) throw error;

            // Get public URL
            const { data: publicUrlData } = this.client.storage
                .from('kyc-artifacts')
                .getPublicUrl(data.path);

            return {
                id: data.path,
                url: publicUrlData.publicUrl
            };
        } catch (error) {
            logger.error(`[Supabase Upload] ${error.message}`);
            throw error;
        }
    }
}

export default new SupabaseService();
