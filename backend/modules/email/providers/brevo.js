const axios = require('axios');

/**
 * Brevo (formerly Sendinblue) Email Provider
 * API Docs: https://developers.brevo.com/reference/sendtransacemail
 */
async function send({ to, subject, html, from, fromName }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY is not configured');

  try {
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { name: fromName || 'Click Opticx', email: from },
      to: (Array.isArray(to) ? to : [to]).map(email => ({ email })),
      subject,
      htmlContent: html,
    }, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    return {
      success: true,
      messageId: response.data.messageId,
      provider: 'brevo',
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    throw new Error(`Brevo Error: ${message}`);
  }
}

module.exports = { send };
