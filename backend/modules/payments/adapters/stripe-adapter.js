import Stripe from 'stripe';
import BasePaymentAdapter from './base-adapter.js';
import logger from '../../../utils/logger.js';

class StripeAdapter extends BasePaymentAdapter {
  constructor(config) {
    super(config);
    this.client = null;
  }

  async init() {
    const apiKey = this.config.apiKey || this.config.secretKey;
    if (!apiKey) throw new Error('Stripe API Key missing');
    this.client = new Stripe(apiKey, {
        apiVersion: '2023-10-16'
    });
    logger.info('[STRIPE-ADAPTER] Initialized');
  }

  async process(data) {
    try {
      const { amount, currency = 'pkr', userId, userName, invoiceId } = data;
      
      // Create a Checkout Session
      const session = await this.client.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency,
            product_data: { name: `ISP Invoice: ${invoiceId || 'Monthly Service'}` },
            unit_amount: Math.round(amount * 100), // Stripe expects cents
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
        metadata: { userId, userName, invoiceId }
      });

      return {
        success: true,
        transactionId: session.id,
        checkoutUrl: session.url,
        raw: session
      };
    } catch (error) {
      logger.error(`[STRIPE-ADAPTER] Process error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async verifyWebhook(body, headers, secret) {
    try {
      const sig = headers['stripe-signature'];
      const event = this.client.webhooks.constructEvent(body, sig, secret || this.config.webhookSecret);
      return { success: true, event };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

export default StripeAdapter;
