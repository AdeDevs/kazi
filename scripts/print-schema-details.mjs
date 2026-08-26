import fs from 'fs';

const spec = JSON.parse(fs.readFileSync('openapi-spec.json', 'utf8'));

console.log('=== Schemas details ===');
for (const [name, schema] of Object.entries(spec.components.schemas || {})) {
  console.log(`\n--- ${name} ---`);
  console.log('Properties:', Object.keys(schema.properties || {}));
  console.log('Required:', schema.required || []);
}

console.log('\n=== Paths details ===');
for (const [path, methods] of Object.entries(spec.paths)) {
  for (const [method, op] of Object.entries(methods)) {
    console.log(`\n${method.toUpperCase()} ${path} (${op.operationId})`);
    if (op.requestBody) {
      const content = op.requestBody.content;
      console.log('  RequestBody types:', Object.keys(content));
      const jsonSchema = content['application/json']?.schema || content['application/x-www-form-urlencoded']?.schema;
      if (jsonSchema) console.log('  RequestBody schema:', jsonSchema.$ref || jsonSchema.title || jsonSchema);
    }
    if (op.parameters) {
      console.log('  Parameters:', op.parameters.map(p => `${p.name} (${p.in}${p.required ? ', req' : ''})`).join(', '));
    }
  }
}
