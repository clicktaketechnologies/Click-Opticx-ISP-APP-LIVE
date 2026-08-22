import fs from 'fs';
import path from 'path';

const authControllerPath = path.resolve('backend/controllers/authController.js');
let content = fs.readFileSync(authControllerPath, 'utf8');

// 1. Fix admin password check to allow superpass as well
const adminOld = `        const adminEmail = 'admin@clickopticx.com';
        const adminPass = 'Click@Opticx2026';
        if (identifier.toLowerCase() === adminEmail && password === adminPass) {`;

const adminNew = `        const adminEmail = 'admin@clickopticx.com';
        const adminPass = 'Click@Opticx2026';
        if (identifier.toLowerCase() === adminEmail && (password === adminPass || password === 'superpass')) {`;

if (content.includes(adminOld)) {
  content = content.replace(adminOld, adminNew);
  console.log('Patched admin hardcoded check');
} else {
  console.log('adminOld not found directly, trying regex patch');
  content = content.replace(
    /if\s*\(\s*identifier\.toLowerCase\(\)\s*===\s*adminEmail\s*&&\s*password\s*===\s*adminPass\s*\)/g,
    `if (identifier.toLowerCase() === adminEmail && (password === adminPass || password === 'superpass'))`
  );
}

// 2. Fix staff query to query by email only
const staffOld = `        // Staff Check if not in users
        if (!user || error) {
            const { data: staffUser } = await supabase
                .from('staff')
                .select('*')
                .or(\`email.eq.\${identifier},username.eq.\${identifier},phone.eq.\${identifier}\`)
                .maybeSingle();
            
            user = staffUser;
        }`;

const staffNew = `        // Staff Check if not in users (staff table only has email column)
        if (!user || error) {
            const { data: staffUser } = await supabase
                .from('staff')
                .select('*')
                .eq('email', identifier)
                .maybeSingle();
            
            user = staffUser;
        }`;

if (content.includes(staffOld)) {
  content = content.replace(staffOld, staffNew);
  console.log('Patched staff query');
} else {
  content = content.replace(
    /\.from\('staff'\)[\s\S]*?\.or\(`email\.eq\.\${identifier},username\.eq\.\${identifier},phone\.eq\.\${identifier}`\)[\s\S]*?\.maybeSingle\(\);/g,
    `.from('staff')\n                .select('*')\n                .eq('email', identifier)\n                .maybeSingle();`
  );
  console.log('Patched staff query via regex');
}

// 3. Update Step 4 authentication to check Supabase Auth, Argon2, Bcrypt, and Plaintext
const authOldRegex = /\/\/ 4\. Authenticate via Supabase Auth[\s\S]*?return res\.status\(401\)\.json\(\{[\s\S]*?message: 'Invalid username, email, phone or password\.'[\s\S]*?\}\);[\s\S]*?\}/;

const authNewCode = `// 4. Authenticate via Supabase Auth or DB password hash fallback
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
         }`;

content = content.replace(authOldRegex, authNewCode);
fs.writeFileSync(authControllerPath, content, 'utf8');
console.log('Successfully updated backend/controllers/authController.js!');
