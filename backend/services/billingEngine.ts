/*
 * billingEngine.ts
 * Dynamic Billing Engine implementing a state machine for invoice lifecycle.
 * Handles partial payments, emergency loans, and integrates with the global wallet.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Invoice lifecycle states
export enum InvoiceState {
  CREATED = 'CREATED',
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CLOSED = 'CLOSED',
  LOAN_ISSUED = 'LOAN_ISSUED',
}

/**
 * Core invoice interface.
 */
export interface Invoice {
  id: string;
  userId: string;
  amount: number; // total amount due (cents)
  paidAmount: number; // amount already paid (cents)
  state: InvoiceState;
  dueDate: string; // ISO date string
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

/**
 * Simple wallet interface – integrated with Supabase ledger.
 */
export interface Wallet {
  userId: string;
  balance: number; // in cents
}

/**
 * BillingEngine encapsulates all state transitions and side‑effects.
 */
export class BillingEngine {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /** Create a new invoice */
  async createInvoice(userId: string, amount: number, dueDate: string, metadata?: Record<string, any>): Promise<Invoice> {
    const invoice: Invoice = {
      id: uuidv4(),
      userId,
      amount,
      paidAmount: 0,
      state: InvoiceState.CREATED,
      dueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata,
    };
    const { error } = await this.supabase.from('invoices').insert(invoice);
    if (error) throw new Error(`Failed to create invoice: ${error.message}`);
    return invoice;
  }

  /** Apply a payment (full or partial) */
  async applyPayment(invoiceId: string, paymentCents: number): Promise<Invoice> {
    const { data: inv, error } = await this.supabase.from('invoices').select('*').eq('id', invoiceId).single();
    if (error) throw new Error(`Invoice not found: ${error.message}`);
    const invoice: Invoice = inv as Invoice;
    const newPaid = invoice.paidAmount + paymentCents;
    let newState = invoice.state;
    if (newPaid >= invoice.amount) {
      newState = InvoiceState.PAID;
    } else if (newPaid > 0) {
      newState = InvoiceState.PARTIAL;
    }
    const updated = { paidAmount: newPaid, state: newState, updatedAt: new Date().toISOString() };
    const { error: updErr } = await this.supabase.from('invoices').update(updated).eq('id', invoiceId);
    if (updErr) throw new Error(`Failed to update invoice: ${updErr.message}`);
    // Sync wallet balance via stored procedure
    await this.syncWalletBalance(invoice.userId);
    return { ...invoice, ...updated } as Invoice;
  }

  /** Issue an emergency loan – adds credit to wallet and marks invoice */
  async issueEmergencyLoan(userId: string, loanCents: number, relatedInvoiceId?: string): Promise<void> {
    // Increase wallet balance
    await this.supabase.rpc('adjust_user_balance', { p_user_id: userId, p_delta: loanCents });
    if (relatedInvoiceId) {
      // Mark invoice as loan issued
      await this.supabase.from('invoices').update({ state: InvoiceState.LOAN_ISSUED }).eq('id', relatedInvoiceId);
    }
  }

  /** Helper to sync wallet balance – calls existing ledger function */
  private async syncWalletBalance(userId: string): Promise<void> {
    await this.supabase.rpc('sync_user_balance', { p_user_id: userId });
  }
}

/**
 * Export a singleton for app-wide usage – values pulled from env.
 */
export const billingEngine = new BillingEngine(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);
