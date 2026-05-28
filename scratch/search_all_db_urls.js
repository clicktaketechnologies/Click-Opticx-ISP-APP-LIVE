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
        if (content.includes('postgresql://') || content.includes('aws-1-ap-south-1.pooler.supabase.com')) {
          console.log(`Found match in ${fullPath}:`);
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            if (line.includes('postgresql://') || line.includes('pooler.supabase.com')) {
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
