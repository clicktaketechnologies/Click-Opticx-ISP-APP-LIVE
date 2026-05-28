import 'dotenv/config';
import fs from 'fs';

try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    console.log('Length:', raw.length);
    console.log('Last 50 chars:', raw.substring(raw.length - 50));
    const parsed = JSON.parse(raw);
    console.log('Parse successful');
} catch (e) {
    console.error('Parse failed:', e.message);
    // Find position of error
    const pos = e.message.match(/position (\d+)/);
    if (pos) {
        const p = parseInt(pos[1]);
        console.log('Error around:', raw.substring(p - 20, p + 20));
    }
}
