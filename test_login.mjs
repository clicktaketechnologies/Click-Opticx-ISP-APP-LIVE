import fetch from 'node-fetch';

const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:5000';
const payload = {
  identifier: 'admin@clickopticx.com',
  password: 'Click@Opticx2026'
};

(async () => {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);
  } catch (e) {
    console.error('Error:', e);
  }
})();
