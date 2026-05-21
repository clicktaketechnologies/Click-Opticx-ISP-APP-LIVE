const fetch = require('node-fetch');

(async () => {
  const backendUrl = process.env.VITE_BACKEND_URL || 'http://localhost:5000';
  const identifier = 'admin@clickopticx.com';
  const password = 'Click@Opticx2026';
  try {
    const response = await fetch(`${backendUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    const data = await response.json();
    console.log('Backend response:', data);
    // If backend reports failure, mimic client fallback logic
    if (!data.success) {
      console.log('Backend failed, invoking client-side fallback simulation...');
      // Simulate local staff lookup using the same INITIAL_STATE defined in db.ts
      const INITIAL_STATE = require('./db').INITIAL_STATE; // Assuming export
      const staffUser = INITIAL_STATE.staff.find(u => u.email.toLowerCase() === identifier.toLowerCase());
      if (staffUser && staffUser.password === password) {
        console.log('Local fallback succeeded:', { success: true, user: staffUser, type: 'staff' });
      } else {
        console.log('Local fallback failed.');
      }
    } else {
      console.log('Login succeeded via backend:', data);
    }
  } catch (err) {
    console.error('Error contacting backend:', err.message);
  }
})();
