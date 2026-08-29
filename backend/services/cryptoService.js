import crypto from 'crypto';
import logger from '../utils/logger.js';

const ALGORITHM = 'aes-256-cbc';
// FIX: the fallback was a random per-process key — every server restart made
// all previously encrypted gateway configs permanently undecryptable.
// The fallback is now a stable value derived from JWT_SECRET (or a fixed dev key).
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
  || crypto.createHash('sha256').update(`co-crypto:${process.env.JWT_SECRET || 'insecure-dev-secret-do-not-use-in-production'}`).digest('hex'); // 64 hex chars = 32 bytes
const IV_LENGTH = 16;

class CryptoService {
  /**
   * Encrypts a string value.
   * @param {string} text - The text to encrypt.
   * @returns {string} - The encrypted string format `iv:encryptedData`.
   */
  static encrypt(text) {
    if (!text) return text;
    // Prevent double encryption: check if text already matches the iv:encryptedData format (16 byte hex IV = 32 chars)
    if (typeof text === 'string' && /^[a-f0-9]{32}:[a-f0-9]+$/i.test(text)) {
      return text;
    }
    try {
      const keyBuffer = Buffer.from(ENCRYPTION_KEY.padEnd(64, '0').slice(0, 64), 'hex');
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
      let encrypted = cipher.update(String(text), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return `${iv.toString('hex')}:${encrypted}`;
    } catch (error) {
      logger.error(`[CRYPTO] Encryption failed: ${error.message}`);
      return text; // Fallback or throw?
    }
  }

  /**
   * Decrypts an encrypted string.
   * @param {string} text - The encrypted string format `iv:encryptedData`.
   * @returns {string} - The decrypted text.
   */
  static decrypt(text) {
    if (!text || typeof text !== 'string' || !text.includes(':')) return text;
    try {
      const parts = text.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encryptedText = parts[1];
      const keyBuffer = Buffer.from(ENCRYPTION_KEY.padEnd(64, '0').slice(0, 64), 'hex');
      
      const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      logger.error(`[CRYPTO] Decryption failed: ${error.message}`);
      return text; // Return original if it wasn't encrypted properly
    }
  }

  /**
   * Recursively encrypts object values if they match certain keys.
   */
  static encryptConfig(config) {
    if (!config || typeof config !== 'object') return config;
    const encryptedConfig = { ...config };
    for (const key of Object.keys(encryptedConfig)) {
      if (typeof encryptedConfig[key] === 'string' && (key.toLowerCase().includes('secret') || key.toLowerCase().includes('key') || key.toLowerCase().includes('password'))) {
        encryptedConfig[key] = this.encrypt(encryptedConfig[key]);
      }
    }
    return encryptedConfig;
  }

  /**
   * Recursively decrypts object values.
   */
  static decryptConfig(config) {
    if (!config || typeof config !== 'object') return config;
    const decryptedConfig = { ...config };
    for (const key of Object.keys(decryptedConfig)) {
      if (typeof decryptedConfig[key] === 'string' && decryptedConfig[key].includes(':')) {
        decryptedConfig[key] = this.decrypt(decryptedConfig[key]);
      }
    }
    return decryptedConfig;
  }
}

export default CryptoService;
