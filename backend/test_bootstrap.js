const http = require('http');

const data = JSON.stringify({
  email: 'admin@projectflow.io',
  password: 'admin123'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const token = JSON.parse(body).token;
    
    const bsReq = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/bootstrap',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    }, bsRes => {
      console.log(`Bootstrap STATUS: ${bsRes.statusCode}`);
      let bsBody = '';
      bsRes.on('data', d => bsBody += d);
      bsRes.on('end', () => console.log(bsBody.substring(0, 300)));
    });
    bsReq.end();
  });
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
