const fs = require('fs');
const path = 'backend/controllers/authController.js';
let content = fs.readFileSync(path, 'utf8');

const oldBlock = `         // 5. Account Status Enforcement
         const BLOCKED_STATUSES = ['PENDING_VERIFICATION', 'SUSPENDED', 'Locked', 'Disabled', 'Blocked'];
         if (user.status === 'PENDING_VERIFICATION') {
             return res.status(403).json({ 
                 success: false, 
                 error: 'ACCOUNT_NOT_VERIFIED', 
                 message: 'Account not verified. Please complete verification first.',
                 status: 'PENDING_VERIFICATION',
                 userId: user.id
             });
         }`;

const newBlock = `         // 5. Account Status Enforcement
         // 'PENDING_VERIFICATION' is no longer blocked so users can access panel (Soft KYC)
         const BLOCKED_STATUSES = ['SUSPENDED', 'Locked', 'Disabled', 'Blocked'];`;

content = content.replace(oldBlock.replace(/\n/g, '\r\n'), newBlock.replace(/\n/g, '\r\n'));

const oldCatchBlock = `             if (user.status === 'PENDING_VERIFICATION') {
                 return res.status(403).json({ 
                     success: false, 
                     error: 'ACCOUNT_NOT_VERIFIED', 
                     message: 'Please verify your email first.',
                     status: 'PENDING_VERIFICATION',
                     userId: user.id
                 });
             }`;

const newCatchBlock = `             // Removed PENDING_VERIFICATION strict block for Soft KYC`;
content = content.replace(oldCatchBlock.replace(/\n/g, '\r\n'), newCatchBlock.replace(/\n/g, '\r\n'));

const oldErrMsgBlock = `             const errMsg = authError.message ? authError.message.toLowerCase() : '';
             if (errMsg.includes('confirm') || errMsg.includes('verified') || authError.code === 'email_not_confirmed') {
                 return res.status(403).json({ 
                     success: false, 
                     error: 'ACCOUNT_NOT_VERIFIED', 
                     message: 'Please verify your email first.',
                     status: 'PENDING_VERIFICATION',
                     userId: user.id
                 });
             }`;
const newErrMsgBlock = `             const errMsg = authError.message ? authError.message.toLowerCase() : '';
             if (errMsg.includes('confirm') || errMsg.includes('verified') || authError.code === 'email_not_confirmed') {
                 // Supabase block - we shouldn't hit this since email_confirm is true now
                 return res.status(403).json({ 
                     success: false, 
                     error: 'ACCOUNT_NOT_VERIFIED', 
                     message: 'Please verify your email first.',
                     status: 'PENDING_VERIFICATION',
                     userId: user.id
                 });
             }`;

content = content.replace(oldErrMsgBlock.replace(/\n/g, '\r\n'), newErrMsgBlock.replace(/\n/g, '\r\n'));

fs.writeFileSync(path, content);
