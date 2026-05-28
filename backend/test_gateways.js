
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const BASE_URL = 'http://localhost:5000/api';

async function testPaymentGateways() {
  console.log('[MODULE] Payment Gateways');
  
  try {
    // 1. Test malformed Stripe signature
    console.log('[ACTION] Send malformed Stripe webhook');
    try {
      await axios.post(`${BASE_URL}/finance/webhook/stripe`, 
        { id: 'evt_123', type: 'charge.succeeded' },
        { headers: { 'stripe-signature': 'invalid' } }
      );
    } catch (err) {
      console.log(`[EXPECTED] HTTP 401 Unauthorized`);
      console.log(`[ACTUAL] HTTP ${err.response?.status}`);
      
      if (err.response?.status === 401) {
        console.log('[STATUS] ✅ PASS (Signature verification active)');
      } else {
        console.log('[STATUS] ❌ FAIL');
      }
    }

  } catch (err) {
    console.log(`[ACTUAL] Error: ${err.message}`);
    console.log('[STATUS] ❌ FAIL');
  }
}

testPaymentGateways();
