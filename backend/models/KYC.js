const mongoose = require('mongoose');

const KYCSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    file_name: { type: String, required: true },
    temp_path: { type: String },
    file_url: { type: String },
    provider: { type: String },
    status: { type: String, enum: ['TEMP', 'MOVED', 'FAILED'], default: 'TEMP' },
    file_type: { type: String },
    size: { type: Number },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('KYC', KYCSchema);
