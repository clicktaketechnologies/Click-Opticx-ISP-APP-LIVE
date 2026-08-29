/**
 * Quick backend login smoke-test. Credentials come from the environment —
 * never hardcode them (they used to live here and were leaked via git).
 *
 * Usage:
 *   BOOTSTRAP_ADMIN_EMAIL=admin@clickopticx.com \
 *   BOOTSTRAP_ADMIN_PASSWORD='...' \
 *   VITE_BACKEND_URL=http://localhost:5000 \
 *   node backend/scripts/test_login.mjs
 */
import fetch from 'node-fetch';

const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:5000';
const identifier = process.env.BOOTSTRAP_ADMIN_EMAIL;
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

if (!identifier || !password) {
  console.error('Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD environment variables first.');
  process.exit(1);
}

(async () => {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', { ...data, token: data.token ? `<${String(data.token).slice(0, 24)}...>` : undefined });
  } catch (e) {
    console.error('Error:', e);
  }
})();
