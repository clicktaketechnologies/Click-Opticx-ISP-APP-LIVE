
import { db } from '../db';

export interface EmailPayload {
    to: string;
    subject: string;
    senderName?: string;
    text?: string;
    html?: string;
}

class NotificationManager {
    private static instance: NotificationManager;
    private apiBase = 'http://localhost:5000/api';

    private constructor() { }

    public static getInstance(): NotificationManager {
        if (!NotificationManager.instance) {
            NotificationManager.instance = new NotificationManager();
        }
        return NotificationManager.instance;
    }

    /**
     * Dispatches an email through the centralized communication hub.
     * Leverages the global configuration stored in the system registry.
     */
    async sendEmail(payload: EmailPayload): Promise<{ success: boolean; message: string }> {
        const state = db.getState();
        const config = state.settings.commConfig;
        const defaultSender = config.senderIdentities.find(i => i.isDefault) || config.senderIdentities[0];

        // Determine configuration to use based on mode
        const activeConfig = config.emailMode === 'PROVIDER_API' ? config.providerConfig : config.smtpConfig;

        try {
            const response = await fetch(`${this.apiBase}/communicate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    config: activeConfig,
                    payload: {
                        ...payload,
                        from: defaultSender?.email || 'noreply@clickopticx.com',
                        senderName: payload.senderName || defaultSender?.name || 'Click Opticx ISP'
                    }
                }),
            });

            const result = await response.json();
            if (result.success) {
                db.logNotification('all', 'success', 'Email Transmitted', `Message "${payload.subject}" successfully dispatched to ${payload.to}`);
                return { success: true, message: 'Dispatch Successful' };
            } else {
                throw new Error(result.message || 'Transmission handshaked failed.');
            }
        } catch (error: any) {
            console.error('[NotificationManager] Dispatch Error:', error);
            db.logNotification('all', 'error', 'Transmission Failed', `Failed to send to ${payload.to}: ${error.message}`);
            return { success: false, message: error.message };
        }
    }

    /**
     * Dispatches a One-Time Password (OTP) sequence.
     */
    async sendOTP(email: string, code: string): Promise<{ success: boolean; message: string }> {
        return this.sendEmail({
            to: email,
            subject: 'Security Protocol: Identity Verification Code',
            html: `
        <div style="font-family: sans-serif; background: #f8fafc; padding: 40px; border-radius: 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
            <h2 style="color: #4f46e5; margin-bottom: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: -1px; font-style: italic;">Identity Verification</h2>
            <p style="color: #64748b; font-size: 14px; margin-bottom: 30px; font-weight: 500;">A secure access request was initiated. Use the following code to continue:</p>
            <div style="background: #f1f5f9; padding: 24px; border-radius: 16px; text-align: center; margin-bottom: 30px; border: 2px dashed #cbd5e1;">
              <span style="font-size: 32px; font-weight: 900; color: #1e293b; letter-spacing: 4px; font-family: monospace;">${code}</span>
            </div>
            <p style="color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">Security Notice: This code will expire in 10 minutes. If you did not request this, please secure your terminal immediately.</p>
          </div>
        </div>
      `
        });
    }

    /**
    * Dispatches a real-time invoice dispatch.
    */
    async sendInvoice(email: string, invoiceId: string, amount: string): Promise<{ success: boolean; message: string }> {
        return this.sendEmail({
            to: email,
            subject: `Billing Node: ${invoiceId} Dispatch`,
            html: `
        <div style="font-family: sans-serif; background: #f8fafc; padding: 40px; border-radius: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 24px; border: 1px solid #e2e8f0;">
             <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px;">
                <h2 style="color: #4f46e5; margin: 0; font-weight: 900; font-style: italic;">Click Opticx Bill</h2>
                <span style="font-size: 12px; font-weight: 900; color: #94a3b8; text-transform: uppercase; padding: 6px 12px; background: #f8fafc; border-radius: 8px;">DIGITAL INVOICE</span>
             </div>
             <p style="color: #64748b; line-height: 1.6;">A new billing cycle has been finalized. Your invoice <b>${invoiceId}</b> for <b>${amount}</b> is now ready for review.</p>
             <div style="margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                <p style="margin: 0; color: #94a3b8; font-size: 10px; font-weight: 800; text-transform: uppercase;">Total Outstanding</p>
                <h3 style="margin: 5px 0 0 0; font-size: 24px; font-weight: 900; color: #1e293b;">${amount}</h3>
             </div>
             <div style="margin-top: 40px;">
                <a href="http://localhost:3000/portal/invoices" style="display: block; width: 100%; padding: 16px; background: #4f46e5; color: white; text-decoration: none; border-radius: 12px; font-weight: 900; text-align: center; text-transform: uppercase; font-size: 12px;">Login to Portal & Pay</a>
             </div>
          </div>
        </div>
      `
        });
    }

    /**
     * Dispatches a recovery warning for users in RECOVERY_MODE.
     */
    async sendRecoveryWarning(email: string, userName: string, balance: number): Promise<{ success: boolean; message: string }> {
        return this.sendEmail({
            to: email,
            subject: 'System Alert: Recovery Oversight Protocol Initiated',
            html: `
        <div style="font-family: sans-serif; background: #fff7ed; padding: 40px; border-radius: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 24px; border: 1px solid #fed7aa; box-shadow: 0 10px 15px -3px rgba(251, 146, 60, 0.1);">
             <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #fff7ed; padding-bottom: 20px; margin-bottom: 30px;">
                <h2 style="color: #ea580c; margin: 0; font-weight: 900; font-style: italic;">Recovery Notice</h2>
                <span style="font-size: 10px; font-weight: 900; color: #f97316; text-transform: uppercase; padding: 6px 12px; background: #fff7ed; border-radius: 8px;">LEVEL 1 ALERT</span>
             </div>
             <p style="color: #431407; line-height: 1.6; font-weight: 600;">Attention ${userName},</p>
             <p style="color: #7c2d12; line-height: 1.6;">Your account has been moved to <b>Recovery Mode</b> due to an outstanding balance of <b>Rs. ${balance.toLocaleString()}</b>. Please verify your payment to avoid service interruption.</p>
             <div style="margin-top: 30px; padding: 20px; background: #fff7ed; border-radius: 12px; border: 1px solid #fed7aa;">
                <p style="margin: 0; color: #9a3412; font-size: 10px; font-weight: 800; text-transform: uppercase;">Grace Expiry Imminent</p>
             </div>
             <div style="margin-top: 40px;">
                <a href="http://localhost:3000/portal/payment" style="display: block; width: 100%; padding: 16px; background: #ea580c; color: white; text-decoration: none; border-radius: 12px; font-weight: 900; text-align: center; text-transform: uppercase; font-size: 11px;">Settle Balance Now</a>
             </div>
          </div>
        </div>
      `
        });
    }

    /**
     * Dispatches a final suspension notice.
     */
    async sendSuspensionNotice(email: string, userName: string): Promise<{ success: boolean; message: string }> {
        return this.sendEmail({
            to: email,
            subject: 'CRITICAL: Service Isolation Protocol Executed',
            html: `
        <div style="font-family: sans-serif; background: #fef2f2; padding: 40px; border-radius: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 24px; border: 1px solid #fecaca;">
             <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #fef2f2; padding-bottom: 20px; margin-bottom: 30px;">
                <h2 style="color: #dc2626; margin: 0; font-weight: 900; font-style: italic;">Service Suspended</h2>
                <span style="font-size: 10px; font-weight: 900; color: #ef4444; text-transform: uppercase; padding: 6px 12px; background: #fef2f2; border-radius: 8px;">TERMINAL ALERT</span>
             </div>
             <p style="color: #450a0a; line-height: 1.6; font-weight: 600;">Identity: ${userName}</p>
             <p style="color: #7f1d1d; line-height: 1.6;">Protocol Enforced: Your internet service has been <b>Suspended</b> due to non-payment. Network access is now restricted.</p>
             <div style="margin-top: 40px;">
                <a href="http://localhost:3000/portal/support" style="display: block; width: 100%; padding: 16px; border: 2px solid #dc2626; color: #dc2626; text-decoration: none; border-radius: 12px; font-weight: 900; text-align: center; text-transform: uppercase; font-size: 11px;">Contact Support for Restoration</a>
             </div>
          </div>
        </div>
      `
        });
    }
}

export const notificationManager = NotificationManager.getInstance();
