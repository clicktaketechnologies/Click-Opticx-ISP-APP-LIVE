import crypto from 'crypto';
import configManager from '../services/config-manager.js';
import logger from '../utils/logger.js';

export const listPackages = async (req, res) => {
    try {
        const supabase = configManager.getSupabaseClient();
        const { data: packages, error } = await supabase
            .from('packages')
            .select('*')
            .is('deleted', false)
            .order('price', { ascending: true });

        if (error) throw error;
        res.json({ success: true, packages });
    } catch (error) {
        logger.error(`[PACKAGE-LIST] Error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createPackage = async (req, res) => {
    try {
        const supabase = configManager.getSupabaseClient();
        const packageData = req.body;
        
        // Validation
        if (!packageData.id || !packageData.name || !packageData.price) {
            return res.status(400).json({ success: false, message: 'ID, Name, and Price are required' });
        }

        const { data, error } = await supabase
            .from('packages')
            .insert({
                ...packageData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        
        // Audit Log
        await supabase.from('audit_logs').insert({
            id: crypto.randomUUID(),
            action: 'PACKAGE_CREATE',
            admin_id: req.user.id,
            details: `Created package: ${data.name} (${data.id}) at price ${data.price}`,
            type: 'CONFIG_CHANGE'
        });

        res.json({ success: true, package: data });
    } catch (error) {
        logger.error(`[PACKAGE-CREATE] Error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updatePackage = async (req, res) => {
    try {
        const supabase = configManager.getSupabaseClient();
        const { id } = req.params;
        const packageData = req.body;

        const { data, error } = await supabase
            .from('packages')
            .update({
                ...packageData,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Audit Log
        await supabase.from('audit_logs').insert({
            id: crypto.randomUUID(),
            action: 'PACKAGE_UPDATE',
            admin_id: req.user.id,
            details: `Updated package: ${id}`,
            type: 'CONFIG_CHANGE'
        });

        res.json({ success: true, package: data });
    } catch (error) {
        logger.error(`[PACKAGE-UPDATE] Error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deletePackage = async (req, res) => {
    try {
        const supabase = configManager.getSupabaseClient();
        const { id } = req.params;

        const { error } = await supabase
            .from('packages')
            .update({ deleted: true, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;

        // Audit Log
        await supabase.from('audit_logs').insert({
            id: crypto.randomUUID(),
            action: 'PACKAGE_DELETE',
            admin_id: req.user.id,
            details: `Deleted package: ${id}`,
            type: 'CONFIG_CHANGE'
        });

        res.json({ success: true, message: 'Package marked as deleted' });
    } catch (error) {
        logger.error(`[PACKAGE-DELETE] Error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

export default {
    listPackages,
    createPackage,
    updatePackage,
    deletePackage
};
