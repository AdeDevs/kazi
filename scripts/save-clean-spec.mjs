import fs from 'fs';
import https from 'https';

https.get('https://kazihub-52ph.onrender.com/openapi.json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const spec = JSON.parse(data);
    fs.writeFileSync('openapi-spec.json', JSON.stringify(spec, null, 2));
    console.log('Successfully wrote formatted openapi-spec.json');
    console.log('Paths:', Object.keys(spec.paths));
    console.log('Schemas:', Object.keys(spec.components.schemas));
  });
});
