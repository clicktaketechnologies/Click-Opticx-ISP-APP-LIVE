const admin = require('firebase-admin');
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
        const db = admin.firestore();
        
        const querySnapshot = await db.collection('cloud_accounts')
            .where('provider', '==', 'Google Drive')
            .where('email', '==', email)
            .limit(1)
            .get();

        const accountData = { 
            provider: 'Google Drive',
            email,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expiry_date: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
            status: 'VERIFIED',
            loginMethod: 'OAuth',
            last_tested: admin.firestore.FieldValue.serverTimestamp()
        };

        let accountId;
        if (!querySnapshot.empty) {
            accountId = querySnapshot.docs[0].id;
            await db.collection('cloud_accounts').doc(accountId).update(accountData);
        } else {
            const docRef = await db.collection('cloud_accounts').add({
                ...accountData,
                created_at: admin.firestore.FieldValue.serverTimestamp()
            });
            accountId = docRef.id;
        }

        const account = { id: accountId, ...accountData };
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
        const db = admin.firestore();
        
        const accountData = {
            provider,
            loginMethod,
            email,
            api_key,
            secret,
            endpoint,
            status: 'Connected',
            created_at: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('cloud_accounts').add(accountData);
        const account = { id: docRef.id, ...accountData };
        
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
        const db = admin.firestore();
        
        await db.collection('cloud_accounts').doc(id).update(updates);
        const doc = await db.collection('cloud_accounts').doc(id).get();
        const account = { id: doc.id, ...doc.data() };
        
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
        const db = admin.firestore();
        await db.collection('cloud_accounts').doc(id).delete();
        
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
        const db = admin.firestore();
        const doc = await db.collection('cloud_accounts').doc(id).get();
        
        if (!doc.exists) return res.status(404).json({ success: false, message: 'Account not found' });
        const account = { id: doc.id, ...doc.data() };

        let testResult = { success: false, status: 'FAILED' };

        if (account.provider === 'Google Drive') {
            googleDriveService.setCredentials({
                access_token: account.access_token,
                refresh_token: account.refresh_token
            });
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

        const updateData = {
            status: testResult.status,
            last_tested: admin.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('cloud_accounts').doc(id).update(updateData);
        const updatedAccount = { ...account, ...updateData };

        const io = req.app.get('socketio');
        io.emit('account_updated', updatedAccount);

        res.json({ success: true, status: updatedAccount.status, message: testResult.message });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.syncAccount = async (req, res) => {
    try {
        const { id } = req.body;
        const db = admin.firestore();
        const doc = await db.collection('cloud_accounts').doc(id).get();
        if (!doc.exists) return res.status(404).json({ success: false, message: 'Account not found' });
        const account = { id: doc.id, ...doc.data() };

        let quota = { used: 0, total: 15 * 1024 * 1024 * 1024 }; 

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

        await db.collection('cloud_accounts').doc(id).update({ quota });
        const updatedAccount = { ...account, quota };

        const io = req.app.get('socketio');
        io.emit('account_updated', updatedAccount);

        res.json({ success: true, quota });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.setDefaultAccount = async (req, res) => {
    try {
        const { id } = req.body;
        const db = admin.firestore();
        
        const batch = db.batch();
        const snapshot = await db.collection('cloud_accounts').where('isPrimary', '==', true).get();
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { isPrimary: false });
        });
        
        batch.update(db.collection('cloud_accounts').doc(id), { isPrimary: true });
        await batch.commit();
        
        const doc = await db.collection('cloud_accounts').doc(id).get();
        const account = { id: doc.id, ...doc.data() };
        
        const io = req.app.get('socketio');
        io.emit('account_updated', account);

        res.json({ success: true, account });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getCloudAccounts = async (req, res) => {
    try {
        const db = admin.firestore();
        const snapshot = await db.collection('cloud_accounts').get();
        const accounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ success: true, accounts });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.moveToCloud = async (req, res) => {
    try {
        const { kycId, accountId } = req.body;
        const db = admin.firestore();
        
        const kycDoc = await db.collection('kyc_requests').doc(kycId).get();
        if (!kycDoc.exists) return res.status(404).json({ success: false, message: 'KYC not found' });
        const kyc = { id: kycDoc.id, ...kycDoc.data() };

        const accDoc = await db.collection('cloud_accounts').doc(accountId).get();
        const account = { id: accDoc.id, ...accDoc.data() };

        if (!accDoc.exists || (account.status !== 'Connected' && account.status !== 'VERIFIED')) {
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
            const updateData = {
                status: 'MOVED',
                provider: account.provider,
                file_url: uploadResult.url,
                moved_at: admin.firestore.FieldValue.serverTimestamp()
            };
            
            await db.collection('kyc_requests').doc(kycId).update(updateData);
            const updatedKyc = { ...kyc, ...updateData };

            if (fs.existsSync(kyc.temp_path)) {
                fs.unlinkSync(kyc.temp_path);
            }

            const io = req.app.get('socketio');
            io.emit('file_moved', updatedKyc);

            res.json({ success: true, kyc: updatedKyc });
        } else {
            throw new Error('Upload failed to return URL');
        }
    } catch (error) {
        logger.error(`[Cloud Move] Error: ${error.message}`);
        res.status(500).json({ success: false, error: error.message });
    }
};
