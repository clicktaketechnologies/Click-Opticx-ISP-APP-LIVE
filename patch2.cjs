const fs = require('fs');
const path = 'backend/controllers/authController.js';
let content = fs.readFileSync(path, 'utf8');

const oldBlock = `             } else {
                 const actionLink = linkData.properties.action_link;
                 // Send email manually
                 const emailHtml = \`
                     <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px;">
                         <h2 style="color: #0f172a; margin-top: 0;">Password Reset Request</h2>
                         <p style="color: #475569; font-size: 14px; line-height: 1.6;">Click the button below to reset your password:</p>
                         <a href="\${actionLink}" style="display: inline-block; padding: 12px 24px; background: #ea580c; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0;">Reset Password</a>
                         <p style="color: #64748b; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
                     </div>
                 \`;`;

const newBlock = `             } else {
                 let actionLink = linkData.properties.action_link;
                 try {
                     const urlObj = new URL(actionLink);
                     if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
                         urlObj.protocol = 'https:';
                         urlObj.host = 'isp-click-opticx.web.app';
                         urlObj.pathname = '/reset-password';
                         actionLink = urlObj.toString();
                     }
                 } catch (e) {}
                 // Send email manually
                 const emailHtml = \`
                     <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px;">
                         <h2 style="color: #0f172a; margin-top: 0;">Password Reset Request</h2>
                         <p style="color: #475569; font-size: 14px; line-height: 1.6;">Click the button below to reset your password:</p>
                         <a href="\${actionLink}" style="display: inline-block; padding: 12px 24px; background: #ea580c; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0;">Reset Password</a>
                         <p style="color: #64748b; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
                     </div>
                 \`;`;

content = content.replace(oldBlock.replace(/\n/g, '\r\n'), newBlock.replace(/\n/g, '\r\n'));
fs.writeFileSync(path, content);
