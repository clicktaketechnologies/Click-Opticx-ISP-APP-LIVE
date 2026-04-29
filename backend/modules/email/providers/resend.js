const axios = require('axios');

/**
 * Resend Email Provider
 * API Docs: https://resend.com/docs/api-reference/emails/send-email
 */
async function send({ to, subject, html, from, fromName }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured');

  try {
    const response = await axios.post('https://api.resend.com/emails', {
      from: fromName ? `${fromName} <${from}>` : from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      success: true,
      messageId: response.data.id,
      provider: 'resend',
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    throw new Error(`Resend Error: ${message}`);
  }
}

module.exports = { send };
