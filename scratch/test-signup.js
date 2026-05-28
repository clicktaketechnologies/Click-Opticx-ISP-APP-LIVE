import http from 'http';

const data = JSON.stringify({
  name: 'Test Setup User New 2',
  username: 'testsetup_new2',
  email: 'test_setup_new2@clickopticx.com',
  password: 'Password123!',
  phone: '1234567896'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/signup',
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
