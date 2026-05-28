import fs from 'fs';
const content = fs.readFileSync('db.ts', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('AUD-') || line.includes('AUD')) {
    console.log(`db.ts L${idx + 1}: ${line.trim()}`);
  }
});
