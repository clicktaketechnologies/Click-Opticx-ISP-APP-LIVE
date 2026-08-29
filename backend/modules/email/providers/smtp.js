import nodemailer from 'nodemailer';

/**
 * Generic SMTP Email Provider (used for Gmail etc.)
 */
export async function send({ to, subject, html, from, fromName }) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) throw new Error('GMAIL_USER or GMAIL_APP_PASSWORD is not configured');

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from: fromName ? `"${fromName}" <${from}>` : from,
      to: Array.isArray(to) ? to.join(',') : to,
      subject,
      html,
    });

    return {
      success: true,
      messageId: info.messageId,
      provider: 'smtp',
    };
  } catch (error) {
    throw new Error(`SMTP Error: ${error.message}`);
  }
}

export default { send };
