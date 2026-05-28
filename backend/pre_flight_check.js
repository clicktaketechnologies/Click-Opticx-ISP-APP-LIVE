
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function validateEnvironment() {
  console.log('--- PRE-FLIGHT ENVIRONMENT VALIDATION ---');
  
  // 1. Check NODE_ENV
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error('❌ FAILED: NODE_ENV is not production');
  } else {
    console.log('✅ PASSED: NODE_ENV is production');
  }

  // 2. Check Supabase (PostgreSQL)
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: supabaseData, error: supabaseError } = await supabase.from('users').select('id').limit(1);
  if (supabaseError) {
    console.error('❌ FAILED: Supabase unreachable', supabaseError.message);
  } else {
    console.log('✅ PASSED: Supabase reachable');
  }

  // 3. Check Redis (Upstash)
  try {
    const redisRes = await axios.get(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
      headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` }
    });
    if (redisRes.data.result === 'PONG') {
      console.log('✅ PASSED: Redis (Upstash) reachable');
    } else {
      console.error('❌ FAILED: Redis (Upstash) ping failed', redisRes.data);
    }
  } catch (err) {
    console.error('❌ FAILED: Redis (Upstash) unreachable', err.message);
  }

  // 4. Check Audit Logging (Try to write a dummy log)
  const { error: auditError } = await supabase.from('audit_logs').insert({
    id: crypto.randomUUID(),
    action: 'PRE_FLIGHT_CHECK',
    details: 'Automated environment validation',
    created_at: new Date().toISOString()
  });
  if (auditError) {
    console.error('❌ FAILED: Audit logging inactive', auditError.message);
  } else {
    console.log('✅ PASSED: Audit logging active');
  }

  console.log('--- VALIDATION COMPLETE ---');
}

validateEnvironment();
