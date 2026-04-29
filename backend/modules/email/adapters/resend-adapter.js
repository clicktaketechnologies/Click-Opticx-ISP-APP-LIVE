const { Resend } = require('resend');
const logger = require('../../../utils/logger');

class ResendAdapter {
  constructor(config) {
    this.config = config;
    this.resend = null;
  }

  async init() {
    if (!this.config.apiKey) throw new Error('Resend API Key missing');
    this.resend = new Resend(this.config.apiKey);
    logger.info('[RESEND-ADAPTER] Initialized');
  }

  async send(options) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.config.from || 'ISP <noreply@clickopticx.com>',
        to: options.to,
        subject: options.subject,
        html: options.html
      });

      if (error) throw error;
      return { success: true, messageId: data.id };
    } catch (error) {
      logger.error(`[RESEND-ADAPTER] Send failure: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

module.exports = ResendAdapter;
