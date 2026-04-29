const axios = require('axios');
const FormData = require('form-data');

/**
 * Mailgun Email Provider
 * API Docs: https://documentation.mailgun.com/en/latest/api-sending.html#sending
 */
async function send({ to, subject, html, from, fromName }) {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  
  if (!apiKey || !domain) throw new Error('MAILGUN_API_KEY or MAILGUN_DOMAIN is not configured');

  try {
    const form = new FormData();
    form.append('from', fromName ? `${fromName} <${from}>` : from);
    form.append('to', Array.isArray(to) ? to.join(',') : to);
    form.append('subject', subject);
    form.append('html', html);

    const auth = Buffer.from(`api:${apiKey}`).toString('base64');

    const response = await axios.post(
      `https://api.mailgun.net/v3/${domain}/messages`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Basic ${auth}`,
        },
      }
    );

    return {
      success: true,
      messageId: response.data.id,
      provider: 'mailgun',
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    throw new Error(`Mailgun Error: ${message}`);
  }
}

module.exports = { send };
