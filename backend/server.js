/**
 * ESM SHIM FOR RENDER
 * This file redirects 'node server.js' calls to 'tsx server.ts'
 * to maintain compatibility with legacy Render dashboard settings.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find the tsx binary
const tsxPath = path.resolve(__dirname, '../node_modules/.bin/tsx');
const serverTsPath = path.resolve(__dirname, 'server.ts');

console.log(`🚀 [SHIM] Redirecting to: tsx ${serverTsPath}`);

const child = spawn(tsxPath, [serverTsPath], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: 'production' }
});

child.on('exit', (code) => {
    process.exit(code || 0);
});
