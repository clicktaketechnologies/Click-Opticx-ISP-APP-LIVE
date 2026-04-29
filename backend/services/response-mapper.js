/**
 * response-mapper.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Config-Driven Integration Mapper
 *
 * Transforms 3rd-party (Stripe, JazzCash, etc.) responses into
 * standardized internal formats based on DB-stored mappings.
 */

const configManager = require('./config-manager');

class ResponseMapper {
  constructor() {
    this.mappings = {};
    this.initialized = false;
  }

  async init() {
    await this.refreshMappings();
    // Subscribe to changes
    const supabase = configManager.getSupabaseClient();
    if (supabase) {
      supabase
        .channel('response_mapping_watch')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'response_mappings' }, () => {
          this.refreshMappings();
        })
        .subscribe();
    }
    this.initialized = true;
  }

  async refreshMappings() {
    const supabase = configManager.getSupabaseClient();
    if (!supabase) return;

    const { data, error } = await supabase.from('response_mappings').select('*');
    if (!error && data) {
      this.mappings = {};
      data.forEach(m => {
        if (!this.mappings[m.provider_id]) this.mappings[m.provider_id] = {};
        this.mappings[m.provider_id][m.response_type] = m.mappings;
      });
      console.log(`[RESPONSE-MAPPER] Loaded mappings for ${data.length} integrations`);
    }
  }

  /**
   * Map a provider response to internal format
   * @param {string} providerId - 'stripe', 'jazzcash'
   * @param {string} type - 'payment_success', 'webhook'
   * @param {Object} rawResponse - The data from the provider
   */
  mapResponse(providerId, type, rawResponse) {
    const config = this.mappings[providerId]?.[type];
    if (!config) {
      console.warn(`[RESPONSE-MAPPER] No mapping found for ${providerId}:${type}. Returning raw data.`);
      return rawResponse;
    }

    const result = {
      _original: rawResponse,
      _mappedAt: new Date().toISOString(),
      fields: {},
      status: 'unknown',
      message: ''
    };

    // 1. Field Mapping
    if (config.fields) {
      Object.entries(config.fields).forEach(([providerField, internalField]) => {
        result.fields[internalField] = this.getNestedValue(rawResponse, providerField);
      });
    }

    // 2. Status Mapping
    if (config.status) {
      const providerStatus = this.getNestedValue(rawResponse, 'status'); // Default status field
      result.status = config.status[providerStatus] || 'unknown';
    }

    // 3. Error Mapping
    if (config.errors) {
      const providerErrorCode = this.getNestedValue(rawResponse, 'error_code') || this.getNestedValue(rawResponse, 'code');
      result.message = config.errors[providerErrorCode] || rawResponse.message || '';
    }

    return result;
  }

  /** Helper to get nested values like "data.object.amount" */
  getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }
}

module.exports = new ResponseMapper();
