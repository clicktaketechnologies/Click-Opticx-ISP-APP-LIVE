-- Double-Entry Accounting Logic & RPC Functions
-- Click Opticx ISP BSS/OSS Finance Engine

BEGIN;

/**
 * create_ledger_entry
 * Atomic double-entry function that ensures financial integrity.
 * Debits one account and credits another in a single transaction.
 */
CREATE OR REPLACE FUNCTION public.create_ledger_entry(
    p_debit_acc UUID,
    p_credit_acc UUID,
    p_amount NUMERIC,
    p_desc TEXT,
    p_ref_type VARCHAR,
    p_ref_id UUID
) RETURNS VOID AS $$
DECLARE
    v_debit_balance NUMERIC;
    v_credit_balance NUMERIC;
BEGIN
    -- 1. Calculate new balance for Debit Account
    SELECT COALESCE((SELECT balance_after FROM public.ledger_entries WHERE account_id = p_debit_acc ORDER BY created_at DESC LIMIT 1), 0) - p_amount 
    INTO v_debit_balance;

    -- 2. Insert Debit Entry
    INSERT INTO public.ledger_entries (account_id, type, amount, balance_after, description, reference_type, reference_id)
    VALUES (p_debit_acc, 'DEBIT', p_amount, v_debit_balance, p_desc, p_ref_type, p_ref_id);

    -- 3. Calculate new balance for Credit Account
    SELECT COALESCE((SELECT balance_after FROM public.ledger_entries WHERE account_id = p_credit_acc ORDER BY created_at DESC LIMIT 1), 0) + p_amount 
    INTO v_credit_balance;

    -- 4. Insert Credit Entry
    INSERT INTO public.ledger_entries (account_id, type, amount, balance_after, description, reference_type, reference_id)
    VALUES (p_credit_acc, 'CREDIT', p_amount, v_credit_balance, p_desc, p_ref_type, p_ref_id);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * sync_user_balance
 * Trigger to keep the user's primary balance field in sync with the ledger.
 */
CREATE OR REPLACE FUNCTION public.sync_user_balance() RETURNS TRIGGER AS $$
BEGIN
    -- Assuming 'users' table has a 'balance' column
    UPDATE public.users 
    SET balance = NEW.balance_after 
    WHERE id = NEW.account_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS tr_sync_user_balance ON public.ledger_entries;
CREATE TRIGGER tr_sync_user_balance
AFTER INSERT ON public.ledger_entries
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_balance();

COMMIT;
