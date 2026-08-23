const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('src/components');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/title="([^"]+)"(?!\s*aria-label)/g, 'title="$1" aria-label="$1"');
  content = content.replace(/title=\{([^}]+)\}(?!\s*aria-label)/g, 'title={$1} aria-label={$1}');
  
  fs.writeFileSync(file, content);
});
console.log('Fixed titles in all components');
