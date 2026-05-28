const fs = require('fs');
let content = fs.readFileSync('.env', 'utf8');
content = content.replace(/\\\\n/g, '\\n');
fs.writeFileSync('.env', content);
