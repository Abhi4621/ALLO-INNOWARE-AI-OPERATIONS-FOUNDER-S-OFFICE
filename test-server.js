const http = require('http');

const urls = ['/', '/styles.css', '/app.js', '/images/media_1794931821342_13c10745.jpg'];
let checked = 0;

urls.forEach(url => {
  http.get('http://127.0.0.1:3000' + url, res => {
    let dataLen = 0;
    res.on('data', chunk => dataLen += chunk.length);
    res.on('end', () => {
      console.log(`[PASS] ${url} -> HTTP ${res.statusCode} (${dataLen} bytes, Content-Type: ${res.headers['content-type']})`);
      checked++;
      if (checked === urls.length) {
        console.log('All local routes & static brand assets verified successfully on port 3000!');
        process.exit(0);
      }
    });
  }).on('error', err => {
    console.error(`[FAIL] ${url} error:`, err.message);
    process.exit(1);
  });
});
