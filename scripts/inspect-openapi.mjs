import https from 'https';

console.log('Fetching OpenAPI schema from Render backend...');
const req = https.get('https://kazihub-52ph.onrender.com/openapi.json', { timeout: 60000 }, (res) => {
  let data = '';
  console.log('Response status:', res.statusCode);
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('OpenAPI Title:', json.info?.title);
      console.log('OpenAPI Version:', json.info?.version);
      console.log('Paths count:', Object.keys(json.paths || {}).length);
      console.log('\n--- Endpoints ---');
      for (const [path, methods] of Object.entries(json.paths || {})) {
        for (const [method, op] of Object.entries(methods)) {
          console.log(`${method.toUpperCase()} ${path} -> ${op.operationId || op.summary || ''}`);
        }
      }
      console.log('\n--- Components Schemas ---');
      console.log(Object.keys(json.components?.schemas || {}).join(', '));
      
      // Also save the full json to openapi.json for reference
      import('fs').then(fs => {
        fs.writeFileSync('openapi-spec.json', JSON.stringify(json, null, 2));
        console.log('Saved openapi-spec.json successfully.');
      });
    } catch (err) {
      console.error('Failed to parse JSON:', err.message);
      console.log('Raw sample:', data.substring(0, 300));
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});
req.on('timeout', () => {
  console.error('Request timed out while waiting for Render instance to wake up.');
  req.destroy();
});
