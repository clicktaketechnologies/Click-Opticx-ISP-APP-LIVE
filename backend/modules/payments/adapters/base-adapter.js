/**
 * base-adapter.js
 */
class BasePaymentAdapter {
  constructor(config) {
    this.config = config;
  }

  /** Initialize the vendor SDK/Connection */
  async init() {
    throw new Error('init() not implemented');
  }

  /** 
   * Execute a payment 
   * @returns { success: boolean, transactionId: string, error?: string, raw?: any }
   */
  async process(data) {
    throw new Error('process() not implemented');
  }

  /** Verify a webhook signature */
  async verifyWebhook(body, headers) {
    throw new Error('verifyWebhook() not implemented');
  }
}

module.exports = BasePaymentAdapter;
