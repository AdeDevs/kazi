import fs from 'fs';

const spec = JSON.parse(fs.readFileSync('openapi-spec.json', 'utf8'));

console.log('=== GIGS ===');
console.log('GigCreate:', JSON.stringify(spec.components.schemas.GigCreate, null, 2));
console.log('GigResponse:', JSON.stringify(spec.components.schemas.GigResponse, null, 2));
console.log('GigUpdate:', JSON.stringify(spec.components.schemas.GigUpdate, null, 2));
console.log('Gig paths:', Object.keys(spec.paths).filter(p => p.includes('gig')));
