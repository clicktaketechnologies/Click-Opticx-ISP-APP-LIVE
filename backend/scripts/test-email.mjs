/**
 * test-email.mjs
 * Run: node backend/scripts/test-email.mjs
 * Tests Resend → Gmail fallback and prints exact error messages.
 */
import { createRequire } from 'module';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../.env') });

const RESEND_API_KEY   = process.env.RESEND_API_KEY;
const GMAIL_USER       = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const FROM_ADDRESS     = process.env.EMAIL_FROM_ADDRESS || 'no-reply@clickopticx.com';
const FROM_NAME        = process.env.EMAIL_FROM_NAME    || 'Click Opticx';
const TEST_RECIPIENT   = process.env.GMAIL_USER;         // send to ourselves

console.log('\n══════════════════════════════════════════');
console.log('  ClickOptix Email Delivery Diagnostics  ');
console.log('══════════════════════════════════════════\n');
console.log('RESEND_API_KEY      :', RESEND_API_KEY  ? `✅ ${RESEND_API_KEY.slice(0,15)}…` : '❌ MISSING');
console.log('GMAIL_USER          :', GMAIL_USER       ? `✅ ${GMAIL_USER}`                  : '❌ MISSING');
console.log('GMAIL_APP_PASSWORD  :', GMAIL_APP_PASSWORD ? '✅ set'                          : '❌ MISSING');
console.log('FROM_ADDRESS        :', FROM_ADDRESS);
console.log('TEST_RECIPIENT      :', TEST_RECIPIENT);
console.log('');

// ── 1. Test Resend ──────────────────────────────────────────────────────────
console.log('── Step 1: Testing Resend API ──────────────────────');
try {
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${FROM_NAME} <${FROM_ADDRESS}>`,
      to: [TEST_RECIPIENT],
      subject: '[ClickOptix Test] Resend delivery check',
      html: '<p>✅ Resend is working! OTP email delivery confirmed.</p>',
    }),
  });

  const data = await resp.json();
  if (resp.ok) {
    console.log('✅ Resend SUCCESS | messageId:', data.id);
  } else {
    console.error('❌ Resend FAILED  | status:', resp.status);
    console.error('   Error body    :', JSON.stringify(data, null, 2));
  }
} catch (err) {
  console.error('❌ Resend EXCEPTION:', err.message);
}

// ── 2. Test Gmail SMTP ──────────────────────────────────────────────────────
console.log('\n── Step 2: Testing Gmail SMTP (nodemailer) ──────────');
try {
  const { default: nodemailer } = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });
  const info = await transporter.sendMail({
    from: `"Click Opticx" <${GMAIL_USER}>`,
    to: TEST_RECIPIENT,
    subject: '[ClickOptix Test] Gmail SMTP delivery check',
    html: '<p>✅ Gmail SMTP is working! Fallback delivery confirmed.</p>',
  });
  console.log('✅ Gmail SMTP SUCCESS | messageId:', info.messageId);
} catch (err) {
  console.error('❌ Gmail SMTP FAILED :', err.message);
}

console.log('\n══ Diagnostics complete ══\n');
