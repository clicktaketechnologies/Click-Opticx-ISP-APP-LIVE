import axios from 'axios';
import crypto from 'crypto';
import BasePaymentAdapter from './base-adapter.js';
import logger from '../../../utils/logger.js';

class JazzCashAdapter extends BasePaymentAdapter {
  constructor(config) {
    super(config);
    this.merchantId = config.merchantId;
    this.password = config.password;
    this.integritySalt = config.integritySalt;
    this.endpoint = config.sandbox ? 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantpay/' : 'https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantpay/';
  }

  async init() {
    if (!this.merchantId || !this.integritySalt) {
        throw new Error('JazzCash config missing (MerchantID or Salt)');
    }
    logger.info('[JAZZCASH-ADAPTER] Initialized');
  }

  async process(data) {
    try {
      const { amount, userId, invoiceId } = data;
      const transactionId = `JC${Date.now()}`;
      
      // 1. Prepare Payload
      const payload = {
        pp_Version: '1.1',
        pp_TxnType: 'MWALLET',
        pp_Language: 'EN',
        pp_MerchantID: this.merchantId,
        pp_SubMerchantID: '',
        pp_Password: this.password,
        pp_BankID: 'TBANK',
        pp_ProductID: 'RECH',
        pp_TxnRefNo: transactionId,
        pp_Amount: Math.round(amount * 100).toString(),
        pp_TxnCurrency: 'PKR',
        pp_TxnDateTime: new Date().toISOString().replace(/[-:T]/g, '').split('.')[0],
        pp_BillReference: invoiceId || userId,
        pp_Description: 'ISP Subscription Payment',
        pp_TxnExpiryDateTime: '',
        pp_ReturnURL: `${process.env.BACKEND_URL}/api/payments/webhooks/jazzcash`,
        pp_SecureHash: '',
        ppmpf_1: userId,
        ppmpf_2: '',
        ppmpf_3: '',
        ppmpf_4: '',
        ppmpf_5: ''
      };

      // 2. Generate Secure Hash
      payload.pp_SecureHash = this.generateSecureHash(payload);

      // 3. JazzCash usually requires a form POST from the frontend,
      // but we return the payload so the UI can construct the form.
      return {
        success: true,
        transactionId,
        payload,
        endpoint: this.endpoint
      };
    } catch (error) {
      logger.error(`[JAZZCASH-ADAPTER] Process error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  generateSecureHash(data) {
    // Sort keys alphabetically as required by JazzCash
    const sortedKeys = Object.keys(data).filter(k => data[k] !== '' && k !== 'pp_SecureHash').sort();
    
    let hashString = this.integritySalt;
    sortedKeys.forEach(key => {
      hashString += `&${data[key]}`;
    });

    return crypto
      .createHmac('sha256', this.integritySalt)
      .update(hashString)
      .digest('hex')
      .toUpperCase();
  }

  async verifyWebhook(body) {
    const receivedHash = body.pp_SecureHash;
    const calculatedHash = this.generateSecureHash(body);
    
    if (receivedHash === calculatedHash) {
      return { success: true, status: body.pp_ResponseCode === '000' ? 'SUCCESS' : 'FAILED' };
    }
    return { success: false, error: 'Integrity Verification Failed' };
  }
}

export default JazzCashAdapter;
