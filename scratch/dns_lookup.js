import dns from 'dns';

dns.resolveMx('snmsvixlskwstvpuksbw.supabase.co', (err, addresses) => {
  console.log('MX:', addresses);
});

dns.lookup('snmsvixlskwstvpuksbw.supabase.co', (err, address, family) => {
  console.log('Lookup address:', address);
});
