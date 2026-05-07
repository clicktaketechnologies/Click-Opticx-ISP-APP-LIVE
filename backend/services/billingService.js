import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

/**
 * Invoice lifecycle states
 */
export const InvoiceState = {
  CREATED: 'CREATED',
  PENDING: 'PENDING',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CLOSED: 'CLOSED',
  LOAN_ISSUED: 'LOAN_ISSUED',
};

class BillingService {
  get supabase() {
    if (!this._supabase) {
      this._supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
    }
    return this._supabase;
  }

  /**
   * Create a new invoice with atomic ledger entry
   */
  async createInvoice(userId, amount, dueDate, description = 'Monthly Subscription') {
    const invoiceId = uuidv4();
    const invoice = {
      id: invoiceId,
      user_id: userId,
      amount,
      paid_amount: 0,
      state: InvoiceState.CREATED,
      due_date: dueDate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      // 1. Insert invoice
      const { error: invError } = await this.supabase.from('invoices').insert(invoice);
      if (invError) throw invError;

      // 2. Create initial ledger entry (Accounts Receivable)
      // Debit: Accounts Receivable (User), Credit: Revenue
      await this.supabase.rpc('create_ledger_entry', {
        p_debit_acc: `AR_${userId}`,
        p_credit_acc: 'REVENUE_MAIN',
        p_amount: amount,
        p_desc: description,
        p_ref_type: 'INVOICE',
        p_ref_id: invoiceId
      });

      logger.info(`[BILLING] Invoice ${invoiceId} created for user ${userId}`);
      return invoice;
    } catch (error) {
      logger.error(`[BILLING-CREATE] Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process a payment (supports partial payments)
   */
  async processPayment(invoiceId, paymentAmount, method = 'CASH') {
    try {
      // 1. Fetch current invoice state
      const { data: invoice, error: fetchError } = await this.supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (fetchError || !invoice) throw new Error('Invoice not found');

      const newPaidAmount = invoice.paid_amount + paymentAmount;
      let newState = invoice.state;

      if (newPaidAmount >= invoice.amount) {
        newState = InvoiceState.PAID;
      } else if (newPaidAmount > 0) {
        newState = InvoiceState.PARTIAL;
      }

      // 2. Update invoice
      const { error: updError } = await this.supabase
        .from('invoices')
        .update({
          paid_amount: newPaidAmount,
          state: newState,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);

      if (updError) throw updError;

      // 3. Ledger Entry (Payment Received)
      // Debit: Cash/Gateway, Credit: Accounts Receivable (User)
      await this.supabase.rpc('create_ledger_entry', {
        p_debit_acc: `ASSET_${method}`,
        p_credit_acc: `AR_${invoice.user_id}`,
        p_amount: paymentAmount,
        p_desc: `Payment for Invoice ${invoiceId}`,
        p_ref_type: 'PAYMENT',
        p_ref_id: invoiceId
      });

      // 4. Sync User Balance
      await this.supabase.rpc('sync_user_balance', { p_user_id: invoice.user_id });

      logger.info(`[BILLING] Payment of ${paymentAmount} processed for invoice ${invoiceId}`);
      return { ...invoice, paid_amount: newPaidAmount, state: newState };
    } catch (error) {
      logger.error(`[BILLING-PAYMENT] Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Issue an emergency loan to restore connectivity
   */
  async issueEmergencyLoan(userId, loanAmount = 50, days = 3) {
    try {
      // 1. Create a loan record/ledger entry
      // Debit: Accounts Receivable (User), Credit: Liability (Emergency Loans)
      await this.supabase.rpc('create_ledger_entry', {
        p_debit_acc: `AR_${userId}`,
        p_credit_acc: 'LIABILITY_LOANS',
        p_amount: loanAmount,
        p_desc: `Emergency Loan (${days} days)`,
        p_ref_type: 'LOAN',
        p_ref_id: userId
      });

      // 2. Update user status to 'active' temporarily (handled by network integration later)
      // For now, just sync balance
      await this.supabase.rpc('sync_user_balance', { p_user_id: userId });

      logger.info(`[BILLING] Emergency loan issued for user ${userId}`);
      return { success: true, amount: loanAmount };
    } catch (error) {
      logger.error(`[BILLING-LOAN] Error: ${error.message}`);
      throw error;
    }
  }
}

export default new BillingService();
