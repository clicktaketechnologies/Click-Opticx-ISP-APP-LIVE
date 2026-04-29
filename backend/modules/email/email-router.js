const logger = require('../../utils/logger');
const configManager = require('../../services/config-manager');
const resend = require('./providers/resend');
const brevo = require('./providers/brevo');
const mailgun = require('./providers/mailgun');
const smtp = require('./providers/smtp');

const providers = {
  resend,
  brevo,
  mailgun,
  gmail: smtp, // Mapped to SMTP provider
  smtp
};

// Circuit breaker state
const circuitBreakers = {};
const FAILURE_THRESHOLD = 5;
const RESET_TIMEOUT_MS = 300000; // 5 minutes

/**
 * Email Router
 * Handles priority-based failover for email delivery
 */
async function sendEmail({ to, subject, html, category = 'System' }) {
  const config = configManager.getConfig('email_providers');
  if (!config) {
    logger.warn('[EMAIL-ROUTER] No configuration found. Falling back to primary only.');
    // Fallback to basic SMTP if config missing
    return smtp.send({ to, subject, html, from: process.env.GMAIL_USER, fromName: 'Click Opticx' });
  }

  const sortedProviders = [...(config.providers || [])]
    .filter(p => p.enabled)
    .sort((a, b) => a.priority - b.priority);

  if (sortedProviders.length === 0) {
    throw new Error('No enabled email providers found in configuration');
  }

  // Check for quiet hours
  if (config.quiet_hours?.enabled && category !== 'Critical') {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const { start, end } = config.quiet_hours;
    
    // Simple time comparison
    const isQuiet = start < end 
      ? (currentTime >= start && currentTime <= end)
      : (currentTime >= start || currentTime <= end);

    if (isQuiet) {
      logger.info(`[EMAIL-ROUTER] Suppressing non-critical email to ${to} during quiet hours (${currentTime})`);
      return { success: false, status: 'Suppressed', reason: 'Quiet Hours' };
    }
  }

  let lastError = null;

  for (const providerConfig of sortedProviders) {
    const providerId = providerConfig.id;
    const provider = providers[providerId];

    if (!provider) {
      logger.warn(`[EMAIL-ROUTER] Provider ${providerId} not implemented. Skipping.`);
      continue;
    }

    // Check circuit breaker
    if (isCircuitOpen(providerId)) {
      logger.warn(`[EMAIL-ROUTER] Circuit open for ${providerId}. Skipping.`);
      continue;
    }

    try {
      logger.info(`[EMAIL-ROUTER] Attempting delivery via ${providerId} to ${to}`);
      
      const result = await provider.send({
        to,
        subject,
        html,
        from: config.from_address || process.env.GMAIL_USER,
        fromName: config.from_name || 'Click Opticx'
      });

      // Reset circuit breaker on success
      resetCircuit(providerId);

      // Log success to Supabase email_logs if available
      logEmailDelivery(to, subject, providerId, 'Delivered').catch(() => {});

      return result;
    } catch (error) {
      logger.error(`[EMAIL-ROUTER] ${providerId} failed: ${error.message}`);
      lastError = error;
      recordFailure(providerId);
      
      // Continue to next provider in priority chain
    }
  }

  // If all failed
  logEmailDelivery(to, subject, 'None', 'Failed', lastError?.message).catch(() => {});
  throw new Error(`All email providers failed. Last error: ${lastError?.message}`);
}

// ─── Circuit Breaker Helpers ──────────────────────────────────────────────────

function isCircuitOpen(providerId) {
  const cb = circuitBreakers[providerId];
  if (!cb) return false;
  if (cb.status === 'OPEN' && Date.now() - cb.lastFailureTime > RESET_TIMEOUT_MS) {
    cb.status = 'HALF_OPEN';
    return false;
  }
  return cb.status === 'OPEN';
}

function recordFailure(providerId) {
  if (!circuitBreakers[providerId]) {
    circuitBreakers[providerId] = { failures: 0, lastFailureTime: 0, status: 'CLOSED' };
  }
  const cb = circuitBreakers[providerId];
  cb.failures++;
  cb.lastFailureTime = Date.now();
  if (cb.failures >= FAILURE_THRESHOLD) {
    cb.status = 'OPEN';
    logger.warn(`[EMAIL-ROUTER] Circuit OPENed for ${providerId}`);
  }
}

function resetCircuit(providerId) {
  if (circuitBreakers[providerId]) {
    circuitBreakers[providerId] = { failures: 0, lastFailureTime: 0, status: 'CLOSED' };
  }
}

// ─── Logging Helper ───────────────────────────────────────────────────────────

async function logEmailDelivery(to, subject, provider, status, error = null) {
  const supabase = configManager.getSupabaseClient();
  if (!supabase) return;

  try {
    await supabase.from('email_logs').insert({
      email: to,
      subject,
      provider_used: provider,
      status,
      error_message: error,
      created_at: new Date().toISOString()
    });
  } catch (e) {
    // Silent fail
  }
}

module.exports = { sendEmail };
