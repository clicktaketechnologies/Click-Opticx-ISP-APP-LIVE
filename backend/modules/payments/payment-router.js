/**
 * payment-router.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Central Payment Orchestrator
 */

import configManager from '../../services/config-manager.js';
import StripeAdapter from './adapters/stripe-adapter.js';
import JazzCashAdapter from './adapters/jazzcash-adapter.js';
import logger from '../../utils/logger.js';

class PaymentRouter {
  constructor() {
    this.gateways = [];
    this.adapters = {}; // { gatewayId: AdapterInstance }
    this.initialized = false;
  }

  /** Load gateways from Supabase/Cache */
  async init() {
    await this.refreshGateways();
    
    // 1. Listen to Config Manager for generic triggers
    configManager.onConfigChange('*', (key) => {
      if (key === 'payment_gateways' || key.includes('gateway')) {
        this.refreshGateways();
      }
    });

    // 2. Direct Supabase Realtime for granular gateway updates
    const supabase = configManager.getSupabaseClient();
    if (supabase) {
      supabase
        .channel('payment_gateway_watch')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_gateways' }, () => {
          this.refreshGateways();
        })
        .subscribe();
    }

    this.initialized = true;
  }

  async refreshGateways() {
    const supabase = configManager.getSupabaseClient();
    if (!supabase) return;

    const { data, error } = await supabase
      .from('payment_gateways')
      .select('*')
      .order('priority', { ascending: true });

    if (!error && data) {
      this.gateways = data;
      
      // Instantiate/Refresh Adapters
      for (const g of data) {
        if (g.enabled && !this.adapters[g.id]) {
            try {
                let adapter = null;
                if (g.id === 'stripe') adapter = new StripeAdapter(g.config);
                if (g.id === 'jazzcash') adapter = new JazzCashAdapter(g.config);
                
                if (adapter) {
                    await adapter.init();
                    this.adapters[g.id] = adapter;
                }
            } catch (e) {
                logger.error(`[PAYMENT-ROUTER] Failed to init adapter for ${g.id}: ${e.message}`);
            }
        }
      }
      
      console.log(`[PAYMENT-ROUTER] Refreshed ${this.gateways.length} gateways, ${Object.keys(this.adapters).length} adapters online`);
    }
  }

  /** Get healthy gateways sorted by priority */
  getAvailableGateways(criteria = {}) {
    return this.gateways
      .filter(g => g.enabled && (g.reputation_score || 100) > 30)
      .filter(g => {
        if (criteria.mode && g.mode !== criteria.mode) return false;
        return true;
      });
  }

  /** 
   * Process a payment with auto-fallback
   * @param {Object} paymentData - { amount, currency, userId, invoiceId }
   */
  async processPayment(paymentData) {
    const available = this.getAvailableGateways();
    
    if (available.length === 0) {
      return { success: false, error: 'No healthy payment gateways available' };
    }

    let lastError = null;
    
    // Try gateways in order of priority
    for (const gateway of available) {
      try {
        console.log(`[PAYMENT-ROUTER] Attempting payment via: ${gateway.name}`);
        
        // Dynamic adapter selection (to be implemented in Phase 2)
        const result = await this.executeGatewayAction(gateway, paymentData);
        
        if (result.success) {
          await this.updateReputation(gateway.id, 5); // +5 for success
          return result;
        } else {
          lastError = result.error;
          await this.updateReputation(gateway.id, -10); // -10 for failure
          console.warn(`[PAYMENT-ROUTER] ${gateway.name} failed: ${lastError}. Trying next...`);
        }
      } catch (e) {
        lastError = e.message;
        await this.updateReputation(gateway.id, -20); // -20 for timeout/crash
        console.error(`[PAYMENT-ROUTER] Critical failure in ${gateway.name}:`, e.message);
      }
    }

    return { 
      success: false, 
      error: 'All gateways failed. Last error: ' + lastError,
      failoverTriggered: true 
    };
  }

  async executeGatewayAction(gateway, data) {
    const adapter = this.adapters[gateway.id];
    if (!adapter) {
        return { success: false, error: `No active adapter for ${gateway.id}` };
    }
    return await adapter.process(data);
  }

  /** Update reputation score in DB */
  async updateReputation(id, delta) {
    const supabase = configManager.getSupabaseClient();
    if (!supabase) return;

    const gateway = this.gateways.find(g => g.id === id);
    if (!gateway) return;

    const newScore = Math.min(100, Math.max(0, (gateway.reputation_score || 100) + delta));
    
    await supabase
      .from('payment_gateways')
      .update({ 
        reputation_score: newScore,
        status: newScore < 30 ? 'Error' : (gateway.enabled ? 'Connected' : 'Disconnected'),
        last_check_at: new Date().toISOString()
      })
      .eq('id', id);
    
    // Local cache update will happen via Realtime listener in init()
  }
}

export default new PaymentRouter();
