/**
 * email-router.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Simplified Email Orchestrator
 */

import configManager from '../../services/config-manager.js';
import SmtpAdapter from './adapters/smtp-adapter.js';
import ResendAdapter from './adapters/resend-adapter.js';
import * as mailgunProvider from './providers/mailgun.js';
import * as brevoProvider from './providers/brevo.js';
import logger from '../../utils/logger.js';

class EmailRouter {
  constructor() {
    this.providers = [];
    this.adapters = {}; // { providerId: AdapterInstance }
    this.initialized = false;
  }

  async init() {
    await this.refreshProviders();
    
    // 1. Listen to Config Manager for generic triggers
    // Wildcard callback signature is (key, value, old)
    configManager.onConfigChange('*', (key) => {
      if (typeof key === 'string' && (key === 'email_providers' || key.includes('email'))) {
        this.refreshProviders();
      }
    });

    // 2. Direct Supabase Realtime for granular provider updates
    const supabase = configManager.getSupabaseClient();
    if (supabase) {
      supabase
        .channel('email_provider_watch')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'email_providers' }, () => {
          this.refreshProviders();
        })
        .subscribe();
    }

    this.initialized = true;
  }

  async refreshProviders() {
    const supabase = configManager.getSupabaseClient();
    if (!supabase) return;

    const { data, error } = await supabase
      .from('email_providers')
      .select('*')
      .order('priority', { ascending: true });

    if (!error && data) {
      this.providers = data;

      // Instantiate/Refresh Adapters
      for (const p of data) {
        if (p.enabled && !this.adapters[p.id]) {
            try {
                let adapter = null;
                if (p.id === 'gmail_smtp' || p.id.includes('smtp')) adapter = new SmtpAdapter(p.config);
                if (p.id === 'resend') adapter = new ResendAdapter(p.config);
                // Lightweight providers (no init needed — use module directly)
                if (p.id === 'mailgun') adapter = { send: (opts) => mailgunProvider.send(opts), init: async () => {} };
                if (p.id === 'brevo')   adapter = { send: (opts) => brevoProvider.send(opts),   init: async () => {} };

                if (adapter) {
                    await adapter.init();
                    this.adapters[p.id] = adapter;
                }
            } catch (e) {
                logger.error(`[EMAIL-ROUTER] Failed to init adapter for ${p.id}: ${e.message}`);
            }
        }
      }

      logger.info(`[EMAIL-ROUTER] Refreshed ${this.providers.length} email providers, ${Object.keys(this.adapters).length} adapters online`);
    }
  }

  /** Get healthy providers */
  getHealthyProviders() {
    return this.providers.filter(p => p.enabled && p.status === 'Healthy');
  }

  /**
   * Send an email with automatic failover
   * @param {Object} options - { to, subject, body, templateId, userId }
   */
  async sendEmail(options) {
    const healthy = this.getHealthyProviders();
    
    if (healthy.length === 0) {
      return { success: false, error: 'No healthy email providers configured' };
    }

    let lastError = null;
    let successfulProvider = null;

    for (const provider of healthy) {
      // Check daily limit
      if (provider.usage_today >= provider.daily_limit) {
        logger.warn(`[EMAIL-ROUTER] Provider ${provider.name} reached daily limit. Skipping...`);
        continue;
      }

      try {
        logger.info(`[EMAIL-ROUTER] Dispatching email via: ${provider.name}`);
        
        // Placeholder for actual provider logic (Nodemailer, Resend SDK, etc.)
        const result = await this.executeSendAction(provider, options);

        if (result.success) {
          successfulProvider = provider.id;
          await this.logSuccess(provider.id, options);
          return { success: true, provider: provider.id };
        } else {
          lastError = result.error;
          await this.logFailure(provider.id, options, lastError);
        }
      } catch (e) {
        lastError = e.message;
        await this.logFailure(provider.id, options, lastError);
      }
    }

    return { 
      success: false, 
      error: 'All providers failed to deliver. Last error: ' + lastError 
    };
  }

  async executeSendAction(provider, options) {
    const adapter = this.adapters[provider.id];
    if (!adapter) {
        return { success: false, error: `No active adapter for ${provider.id}` };
    }
    return await adapter.send(options);
  }

  async logSuccess(providerId, options) {
    const supabase = configManager.getSupabaseClient();
    if (!supabase) return;

    // Increment usage
    await supabase.rpc('increment_provider_usage', { p_id: providerId });

    // Log to email_logs
    await supabase.from('email_logs').insert({
      user_id: options.userId || null,
      email: options.to,
      subject: options.subject,
      provider_used: providerId,
      status: 'Delivered', // Must match migration stats query filter
      template_id: options.templateId || 'manual'
    });
  }

  async logFailure(providerId, options, error) {
    const supabase = configManager.getSupabaseClient();
    if (!supabase) return;

    await supabase.from('email_logs').insert({
      user_id: options.userId || null,
      email: options.to,
      subject: options.subject,
      provider_used: providerId,
      status: 'Failed',
      error_message: error,
      template_id: options.templateId || 'manual'
    });

    // Optionally mark provider as unhealthy if errors persist
    // (Circuit breaker logic here)
  }
}

export default new EmailRouter();
