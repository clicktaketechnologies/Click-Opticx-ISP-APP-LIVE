import http from 'http';

const data = JSON.stringify({
  userId: 'ff728a12-37ad-49a1-a187-d82c53113fa9',
  otp: '620565'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/verify-otp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Body: ${body}`);
  });
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
