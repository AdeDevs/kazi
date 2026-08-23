const fs = require('fs');
const files = [
  'src/components/CustomerDashboard.tsx',
  'src/components/ProProfileManagement.tsx',
  'src/components/AppShell.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace title="text" with title="text" aria-label="text"
  // but only if aria-label is not already on that tag (basic regex)
  content = content.replace(/title="([^"]+)"(?![^>]*aria-label)/g, 'title="$1" aria-label="$1"');
  
  // Replace title={`text`} with title={`text`} aria-label={`text`}
  content = content.replace(/title=\{`([^`]+)`\}(?![^>]*aria-label)/g, 'title={`$1`} aria-label={`$1`}');
  
  fs.writeFileSync(file, content);
});
console.log('Fixed titles');
