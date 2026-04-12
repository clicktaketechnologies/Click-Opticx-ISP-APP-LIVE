const { google } = require('googleapis');
const fs = require('fs');
const logger = require('../utils/logger');

class GoogleDriveService {
    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
    }

    getAuthUrl() {
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/userinfo.email'],
        });
    }

    async getTokens(code) {
        const { tokens } = await this.oauth2Client.getToken(code);
        return tokens;
    }

    setCredentials(tokens) {
        this.oauth2Client.setCredentials(tokens);
    }

    async uploadFile(fileName, filePath, mimeType) {
        try {
            const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
            const response = await drive.files.create({
                requestBody: {
                    name: fileName,
                    parents: [] // Can specify folder ID here
                },
                media: {
                    mimeType: mimeType,
                    body: fs.createReadStream(filePath),
                },
            });
            return response.data;
        } catch (error) {
            logger.error(`[Google Drive] Upload Echo: ${error.message}`);
            throw error;
        }
    }

    async deleteFile(fileId) {
        try {
            const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
            await drive.files.delete({ fileId });
            return true;
        } catch (error) {
            logger.error(`[Google Drive] Delete Echo: ${error.message}`);
            throw error;
        }
    }

    async getFileUrl(fileId) {
        try {
            const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
            const file = await drive.files.get({
                fileId: fileId,
                fields: 'webViewLink, webContentLink'
            });
            return file.data.webViewLink;
        } catch (error) {
            logger.error(`[Google Drive] URL Echo: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new GoogleDriveService();
