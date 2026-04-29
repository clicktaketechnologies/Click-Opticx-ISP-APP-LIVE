/**
 * smtp-adapter.js
 */
const nodemailer = require('nodemailer');
const logger = require('../../../utils/logger');

class SmtpAdapter {
  constructor(config) {
    this.config = config;
    this.transporter = null;
  }

  async init() {
    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port || 587,
      secure: this.config.port === 465,
      auth: {
        user: this.config.user,
        pass: this.config.pass
      }
    });
    
    // Verify connection
    await this.transporter.verify();
    logger.info(`[SMTP-ADAPTER] Verified: ${this.config.host}`);
  }

  async send(options) {
    try {
      const info = await this.transporter.sendMail({
        from: this.config.from || options.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`[SMTP-ADAPTER] Send failure: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

module.exports = SmtpAdapter;
