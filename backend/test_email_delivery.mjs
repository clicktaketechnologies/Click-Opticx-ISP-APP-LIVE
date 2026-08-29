/**
 * test_email_delivery.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * End-to-end email delivery test using the production resend-direct.js pipeline.
 * Sends a real test OTP email and a test password reset email.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

// Dynamically import after env is loaded
const { sendDirectEmail } = await import('./modules/email/resend-direct.js');

const TEST_EMAIL = process.env.GMAIL_USER || 'clickopticx@gmail.com';

console.log('=== Email Delivery E2E Test ===');
console.log('Target:', TEST_EMAIL);
console.log('RESEND_API_KEY present:', !!process.env.RESEND_API_KEY);
console.log('GMAIL_USER present:', !!process.env.GMAIL_USER);
console.log('GMAIL_APP_PASSWORD present:', !!process.env.GMAIL_APP_PASSWORD);
console.log('');

// ── Test 1: OTP Email ────────────────────────────────────────────────────────
console.log('─── Test 1: OTP Verification Email ───');
const otpResult = await sendDirectEmail({
  to: TEST_EMAIL,
  subject: '🧪 TEST OTP — Click Opticx Email System Check',
  html: `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px;">
      <h2 style="color: #0f172a; margin-top: 0;">🧪 Test OTP Email</h2>
      <p style="color: #475569; font-size: 14px;">This is an automated test from the Click Opticx email delivery pipeline.</p>
      <div style="font-size: 28px; font-weight: 800; letter-spacing: 6px; padding: 16px; background: #f1f5f9; display: inline-block; border-radius: 12px; margin: 16px 0; color: #000;">123456</div>
      <p style="color: #64748b; font-size: 12px;">Sent at: ${new Date().toISOString()}</p>
      <p style="color: #22c55e; font-weight: bold;">✅ If you see this in your inbox (not spam), email delivery is WORKING.</p>
    </div>
  `,
  type: 'otp'
});

console.log('Result:', JSON.stringify(otpResult, null, 2));
console.log('');

// ── Test 2: Password Reset Email ─────────────────────────────────────────────
console.log('─── Test 2: Password Reset Email ───');
const resetResult = await sendDirectEmail({
  to: TEST_EMAIL,
  subject: '🧪 TEST Password Reset — Click Opticx Email System Check',
  html: `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px;">
      <h2 style="color: #0f172a; margin-top: 0;">🧪 Test Password Reset</h2>
      <p style="color: #475569; font-size: 14px;">This is an automated test of the password reset email pipeline.</p>
      <a href="https://isp-click-opticx.web.app/reset-password?token=TEST" style="display: inline-block; padding: 12px 24px; background: #ea580c; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0;">Reset Password (Test)</a>
      <p style="color: #64748b; font-size: 12px;">Sent at: ${new Date().toISOString()}</p>
    </div>
  `,
  type: 'password_reset'
});

console.log('Result:', JSON.stringify(resetResult, null, 2));
console.log('');

// ── Summary ──────────────────────────────────────────────────────────────────
console.log('=== DELIVERY SUMMARY ===');
console.log('OTP Email:      ', otpResult.success ? '✅ DELIVERED' : '❌ FAILED — ' + otpResult.error);
console.log('  Provider:     ', otpResult.provider);
console.log('  Message ID:   ', otpResult.messageId || 'N/A');
console.log('');
console.log('Reset Email:    ', resetResult.success ? '✅ DELIVERED' : '❌ FAILED — ' + resetResult.error);
console.log('  Provider:     ', resetResult.provider);
console.log('  Message ID:   ', resetResult.messageId || 'N/A');
console.log('');

const allPassed = otpResult.success && resetResult.success;
console.log(allPassed 
  ? '🎉 ALL TESTS PASSED — Check inbox for delivery confirmation.'
  : '⚠️  SOME TESTS FAILED — Review errors above.'
);

process.exit(allPassed ? 0 : 1);
