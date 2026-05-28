import fs from 'fs';
import path from 'path';

const brainDir = 'C:\\Users\\ClickTake\\.gemini\\antigravity\\brain';

function searchDirectory(dir) {
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        searchDirectory(fullPath);
      } else if (item === 'overview.txt' || item.endsWith('.md') || item.endsWith('.json') || item.endsWith('.txt')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('snmsvixlskwstvpuksbw')) {
          console.log(`Found project ID match in ${fullPath}:`);
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            if (line.includes('snmsvixlskwstvpuksbw') && (line.includes('password') || line.includes('postgresql://') || line.includes('kLXmn') || line.includes('Click'))) {
              console.log(`  L${idx}: ${line.trim()}`);
            }
          });
        }
      }
    }
  } catch (err) {
    // Ignore
  }
}

searchDirectory(brainDir);
