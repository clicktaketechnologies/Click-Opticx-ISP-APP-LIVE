const mongoose = require('mongoose');

const CloudAccountSchema = new mongoose.Schema({
    provider: { type: String, required: true }, // 'Google Drive', 'Cloudinary', 'Supabase', etc.
    email: { type: String },
    access_token: { type: String },
    refresh_token: { type: String },
    expiry_date: { type: Date },
    api_key: { type: String },
    secret: { type: String },
    endpoint: { type: String }, // For Supabase URL etc.
    loginMethod: { type: String }, // 'OAuth', 'API Key', 'Email'
    quota: {
        used: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    },
    status: { type: String, enum: ['Connected', 'Disconnected', 'Expired', 'Failed', 'VERIFIED'], default: 'Connected' },
    isPrimary: { type: Boolean, default: false },
    last_tested: { type: Date },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CloudAccount', CloudAccountSchema);
