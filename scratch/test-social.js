import http from 'http';

const data = JSON.stringify({
  email: 'google_test_user@gmail.com',
  name: 'Google Test User',
  provider: 'google'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/social-handshake',
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
