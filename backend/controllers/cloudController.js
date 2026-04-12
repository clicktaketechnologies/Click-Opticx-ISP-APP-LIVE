const CloudAccount = require('../models/CloudAccount');
const KYC = require('../models/KYC');
const googleDriveService = require('../services/googleDriveService');
const cloudinaryService = require('../services/cloudinaryService');
const supabaseService = require('../services/supabaseService');
const logger = require('../utils/logger');
const fs = require('fs');

exports.connectGoogle = (req, res) => {
    const url = googleDriveService.getAuthUrl();
    res.json({ url });
};

exports.googleCallback = async (req, res) => {
    try {
        const { code } = req.query;
        const tokens = await googleDriveService.getTokens(code);
        
        const email = 'admin@clickopticx.com'; 

        const account = await CloudAccount.findOneAndUpdate(
            { provider: 'Google Drive', email },
            { 
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expiry_date: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                status: 'VERIFIED',
                loginMethod: 'OAuth',
                last_tested: new Date()
            },
            { upsert: true, new: true }
        );

        const io = req.app.get('socketio');
        io.emit('account_updated', account);

        res.send('<h1>Authentication Successful! You can close this window.</h1><script>window.close();</script>');
    } catch (error) {
        logger.error(`[Google Callback] Error: ${error.message}`);
        res.status(500).send('Authentication Failed');
    }
};

exports.saveAccount = async (req, res) => {
    try {
        const { provider, loginMethod, email, api_key, secret, endpoint } = req.body;
        
        const account = new CloudAccount({
            provider,
            loginMethod,
            email,
            api_key,
            secret,
            endpoint,
            status: 'Connected'
        });

        await account.save();
        
        const io = req.app.get('socketio');
        io.emit('account_updated', account);

        res.json({ success: true, account });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const account = await CloudAccount.findByIdAndUpdate(id, updates, { new: true });
        
        const io = req.app.get('socketio');
        io.emit('account_updated', account);

        res.json({ success: true, account });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        const { id } = req.params;
        await CloudAccount.findByIdAndDelete(id);
        
        const io = req.app.get('socketio');
        io.emit('account_deleted', { id });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.testConnection = async (req, res) => {
    try {
        const { id } = req.body;
        const account = await CloudAccount.findById(id);
        if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

        let testResult = { success: false, status: 'FAILED' };

        if (account.provider === 'Google Drive') {
            googleDriveService.setCredentials({
                access_token: account.access_token,
                refresh_token: account.refresh_token
            });
            // Try list files
            try {
                const drive = googleDriveService.getDrive();
                await drive.files.list({ pageSize: 1 });
                testResult = { success: true, status: 'VERIFIED' };
            } catch (e) {
                testResult = { success: false, status: 'FAILED', message: e.message };
            }
        } else if (account.provider === 'Cloudinary') {
            cloudinaryService.setCredentials(account);
            testResult = await cloudinaryService.testConnection();
        } else if (account.provider === 'Supabase') {
            supabaseService.setCredentials(account);
            testResult = await supabaseService.testConnection();
        }

        account.status = testResult.status;
        account.last_tested = new Date();
        await account.save();

        const io = req.app.get('socketio');
        io.emit('account_updated', account);

        res.json({ success: true, status: account.status, message: testResult.message });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.syncAccount = async (req, res) => {
    try {
        const { id } = req.body;
        const account = await CloudAccount.findById(id);
        if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

        // Simulate or fetch real quota
        let quota = { used: 0, total: 15 * 1024 * 1024 * 1024 }; // Default 15GB

        if (account.provider === 'Google Drive') {
            googleDriveService.setCredentials({ access_token: account.access_token, refresh_token: account.refresh_token });
            try {
                const drive = googleDriveService.getDrive();
                const about = await drive.about.get({ fields: 'storageQuota' });
                quota = {
                    used: parseInt(about.data.storageQuota.usage),
                    total: parseInt(about.data.storageQuota.limit)
                };
            } catch (e) {
                logger.error(`[Sync] Google Meta Fetch Error: ${e.message}`);
            }
        }

        account.quota = quota;
        await account.save();

        const io = req.app.get('socketio');
        io.emit('account_updated', account);

        res.json({ success: true, quota });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.setDefaultAccount = async (req, res) => {
    try {
        const { id } = req.body;
        
        // Unset all primary
        await CloudAccount.updateMany({}, { isPrimary: false });
        
        const account = await CloudAccount.findByIdAndUpdate(id, { isPrimary: true }, { new: true });
        
        const io = req.app.get('socketio');
        io.emit('account_updated', account);

        res.json({ success: true, account });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getCloudAccounts = async (req, res) => {
    try {
        const accounts = await CloudAccount.find();
        res.json({ success: true, accounts });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.moveToCloud = async (req, res) => {
    try {
        const { kycId, accountId } = req.body;
        const kyc = await KYC.findById(kycId);
        if (!kyc) return res.status(404).json({ success: false, message: 'KYC not found' });

        const account = await CloudAccount.findById(accountId);
        if (!account || (account.status !== 'Connected' && account.status !== 'VERIFIED')) {
            return res.status(400).json({ success: false, message: 'Cloud node not healthy' });
        }

        let uploadResult = null;

        if (account.provider === 'Google Drive') {
            googleDriveService.setCredentials({
                access_token: account.access_token,
                refresh_token: account.refresh_token
            });
            const cloudFile = await googleDriveService.uploadFile(kyc.file_name, kyc.temp_path, kyc.file_type);
            const fileUrl = await googleDriveService.getFileUrl(cloudFile.id);
            uploadResult = { url: fileUrl };
        } else if (account.provider === 'Cloudinary') {
            cloudinaryService.setCredentials(account);
            uploadResult = await cloudinaryService.uploadFile(kyc.file_name, kyc.temp_path, kyc.file_type);
        } else if (account.provider === 'Supabase') {
            supabaseService.setCredentials(account);
            uploadResult = await supabaseService.uploadFile(kyc.file_name, kyc.temp_path, kyc.file_type);
        }

        if (uploadResult && uploadResult.url) {
            kyc.status = 'MOVED';
            kyc.provider = account.provider;
            kyc.file_url = uploadResult.url;
            await kyc.save();

            if (fs.existsSync(kyc.temp_path)) {
                fs.unlinkSync(kyc.temp_path);
            }

            const io = req.app.get('socketio');
            io.emit('file_moved', kyc);

            res.json({ success: true, kyc });
        } else {
            throw new Error('Upload failed to return URL');
        }
    } catch (error) {
        logger.error(`[Cloud Move] Error: ${error.message}`);
        res.status(500).json({ success: false, error: error.message });
    }
};
