const fs = require('fs');
const code = fs.readFileSync('G:/ClickOptix/click-opticx-isp-app-live/pages/Recovery.tsx', 'utf8');
const lines = code.split('\n');
let d = 0;
const results = [];
for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const o = (l.match(/<div/g) || []).length;
    const c = (l.match(/<\/div>/g) || []).length;
    if (o !== c) {
        d += o - c;
        results.push((i + 1) + ': ' + d + ' | ' + l.trim());
    }
}
fs.writeFileSync('full_div_audit.log', results.join('\n') + '\nFinal d: ' + d);
console.log('Audit complete. Final d: ' + d);
