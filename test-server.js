const http = require('http');
const path = require('path');

// Run server
require('./server.js');

setTimeout(() => {
  const urls = ['/', '/styles.css', '/app.js'];
  let checked = 0;

  urls.forEach(url => {
    http.get('http://127.0.0.1:3000' + url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`[PASS] ${url} -> HTTP ${res.statusCode} (${data.length} bytes)`);
        checked++;
        if (checked === urls.length) {
          console.log('All local routes verified successfully!');
          process.exit(0);
        }
      });
    }).on('error', err => {
      console.error(`[FAIL] ${url} error:`, err.message);
      process.exit(1);
    });
  });
}, 1000);
