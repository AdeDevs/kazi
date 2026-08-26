import fs from 'fs';
const spec = JSON.parse(fs.readFileSync('openapi-spec.json', 'utf8'));

console.log('GET /api/gigs/ params:', spec.paths['/api/gigs/']?.get?.parameters);
console.log('GET /api/profiles/all params:', spec.paths['/api/profiles/all']?.get?.parameters);
console.log('Verification paths:');
for (const p of Object.keys(spec.paths)) {
  if (p.includes('verification')) {
    console.log(p, Object.keys(spec.paths[p]));
  }
}
