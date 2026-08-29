
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkFinance() {
  const { count: invoiceCount } = await supabase.from('invoices').select('*', { count: 'exact', head: true });
  const { count: paymentCount } = await supabase.from('payments').select('*', { count: 'exact', head: true });
  console.log('Invoice count:', invoiceCount);
  console.log('Payment count:', paymentCount);
}

checkFinance();
