const fs = require('fs');

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
  
  content = content.replace(/hover:bg-slate-100(?! dark:hover:bg)/g, 'hover:bg-slate-100 dark:hover:bg-slate-800');
  content = content.replace(/'bg-slate-100 text-slate-600'/g, "'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'");
  
  fs.writeFileSync(file, content);
});
console.log('Fixed missing dark classes');
