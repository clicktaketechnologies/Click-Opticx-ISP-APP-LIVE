import fs from 'fs';
import path from 'path';

const authControllerPath = path.resolve('backend/controllers/authController.js');

let lines = fs.readFileSync(authControllerPath, 'utf8').split('\n');

// Find the section from line 371 to 408
let startIdx = lines.findIndex(l => l.includes('// 4. Authenticate via Supabase Auth'));
let endIdx = lines.findIndex(l => l.includes('// 5. Account Status Enforcement'));

console.log('startIdx:', startIdx, 'endIdx:', endIdx);

if (startIdx !== -1 && endIdx !== -1) {
  const newSection = `         // 4. Authenticate via Supabase Auth or DB password hash fallback
         let isAuthenticated = false;
         let authSession = null;

         if (user.email) {
             try {
                 const authResult = await supabaseAuth.signIn({
                     email: user.email,
                     password
                 });
                 if (authResult && authResult.user) {
                     isAuthenticated = true;
                     authSession = authResult;
                 }
             } catch (authError) {
                 logger.warn(\`[LOGIN] Supabase Auth signIn failed for \${user.email}: \${authError.message}\`);
                 if (authError.message === 'AUTH_TIMEOUT') {
                     return res.status(504).json({ 
                         success: false, 
                         error: 'AUTH_TIMEOUT', 
                         message: 'Authentication service timeout. Please try again.' 
                     });
                 }
             }
         }

         if (!isAuthenticated && user.password) {
             try {
                 if (user.password.startsWith('$argon2')) {
                     try {
                         const argon2Module = await import('argon2');
                         isAuthenticated = await argon2Module.verify(user.password, password);
                     } catch (aErr) {
                         logger.warn(\`[LOGIN] Argon2 verification error: \${aErr.message}\`);
                     }
                 } else if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$')) {
                     isAuthenticated = await bcrypt.compare(password, user.password);
                 } else if (user.password === password) {
                     isAuthenticated = true;
                 }
             } catch (pwdErr) {
                 logger.warn(\`[LOGIN] Password hash check failed: \${pwdErr.message}\`);
             }

             if (isAuthenticated && user.email) {
                 try {
                     const { data: existingAuth } = await supabase.auth.admin.getUserById(user.id);
                     if (existingAuth?.user) {
                         await supabase.auth.admin.updateUserById(user.id, { password, email_confirm: true });
                     } else {
                         await supabase.auth.admin.createUser({
                             email: user.email,
                             password,
                             email_confirm: true,
                             user_metadata: { name: user.name, role: user.role }
                         });
                     }
                 } catch (syncErr) {
                     logger.warn(\`[LOGIN] Failed to auto-sync user to Supabase Auth: \${syncErr.message}\`);
                 }
             }
         }

         if (!isAuthenticated) {
             trackLoginAttempt(identifier);
             return res.status(401).json({ 
                 success: false, 
                 error: 'INVALID_CREDENTIALS', 
                 message: 'Invalid username, email, phone or password.' 
             });
         }
`;

  lines.splice(startIdx, endIdx - startIdx, newSection);
  fs.writeFileSync(authControllerPath, lines.join('\n'), 'utf8');
  console.log('Fixed auth controller block successfully!');
} else {
  console.error('Could not find indices!');
}
