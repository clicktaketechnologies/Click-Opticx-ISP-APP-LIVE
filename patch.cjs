const fs = require('fs');
const path = 'backend/controllers/authController.js';
let content = fs.readFileSync(path, 'utf8');

const oldBlock = `         } catch (authError) {
             trackLoginAttempt(identifier);
             logger.warn(\`[LOGIN] Supabase Auth authentication failed for \${user.email}: \${authError.message}\`);
             
             if (authError.message === 'AUTH_TIMEOUT') {
                 return res.status(504).json({ 
                     success: false, 
                     error: 'AUTH_TIMEOUT', 
                     message: 'Authentication service timeout. Please try again.' 
                 });
             }
             
             const errMsg = authError.message ? authError.message.toLowerCase() : '';
             if (errMsg.includes('confirm') || errMsg.includes('verified') || authError.code === 'email_not_confirmed') {
                 return res.status(403).json({ 
                     success: false, 
                     error: 'ACCOUNT_NOT_VERIFIED', 
                     message: 'Please verify your email first.',
                     status: 'PENDING_VERIFICATION',
                     userId: user.id
                 });
             }
             
             return res.status(401).json({ 
                 success: false, 
                 error: 'INVALID_CREDENTIALS', 
                 message: 'Invalid username, email, phone or password.' 
             });
         }`;

const newBlock = `         } catch (authError) {
             trackLoginAttempt(identifier);
             logger.warn(\`[LOGIN] Supabase Auth authentication failed for \${user.email}: \${authError.message}\`);
             
             if (authError.message === 'AUTH_TIMEOUT') {
                 return res.status(504).json({ 
                     success: false, 
                     error: 'AUTH_TIMEOUT', 
                     message: 'Authentication service timeout. Please try again.' 
                 });
             }

             if (user.status === 'PENDING_VERIFICATION') {
                 return res.status(403).json({ 
                     success: false, 
                     error: 'ACCOUNT_NOT_VERIFIED', 
                     message: 'Please verify your email first.',
                     status: 'PENDING_VERIFICATION',
                     userId: user.id
                 });
             }
             
             const errMsg = authError.message ? authError.message.toLowerCase() : '';
             if (errMsg.includes('confirm') || errMsg.includes('verified') || authError.code === 'email_not_confirmed') {
                 return res.status(403).json({ 
                     success: false, 
                     error: 'ACCOUNT_NOT_VERIFIED', 
                     message: 'Please verify your email first.',
                     status: 'PENDING_VERIFICATION',
                     userId: user.id
                 });
             }
             
             return res.status(401).json({ 
                 success: false, 
                 error: 'INVALID_CREDENTIALS', 
                 message: 'Invalid username, email, phone or password.' 
             });
         }`;

content = content.replace(oldBlock.replace(/\n/g, '\r\n'), newBlock.replace(/\n/g, '\r\n'));
fs.writeFileSync(path, content);
