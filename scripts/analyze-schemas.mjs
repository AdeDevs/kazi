import fs from 'fs';

const spec = JSON.parse(fs.readFileSync('openapi-spec.json', 'utf8'));

console.log('=== GIG SCHEMAS ===');
console.log('GigCreate:', JSON.stringify(spec.components.schemas.GigCreate, null, 2));
console.log('GigResponse:', JSON.stringify(spec.components.schemas.GigResponse, null, 2));
console.log('GigUpdate:', JSON.stringify(spec.components.schemas.GigUpdate, null, 2));

console.log('\n=== LOGIN ENDPOINT ===');
console.log(JSON.stringify(spec.paths['/api/auth/login'], null, 2));
console.log('Login Body Schema:', JSON.stringify(spec.components.schemas.Body_login_api_auth_login_post, null, 2));

console.log('\n=== USER SCHEMAS ===');
console.log('UserCreate:', JSON.stringify(spec.components.schemas.UserCreate, null, 2));
console.log('UserResponse:', JSON.stringify(spec.components.schemas.UserResponse, null, 2));
console.log('UserUpdate:', JSON.stringify(spec.components.schemas.UserUpdate, null, 2));

console.log('\n=== PROFILE SCHEMAS ===');
console.log('ProfileCreate:', JSON.stringify(spec.components.schemas.ProfileCreate, null, 2));
console.log('ProfileResponse:', JSON.stringify(spec.components.schemas.ProfileResponse, null, 2));
console.log('ProfileUpdate:', JSON.stringify(spec.components.schemas.ProfileUpdate, null, 2));
