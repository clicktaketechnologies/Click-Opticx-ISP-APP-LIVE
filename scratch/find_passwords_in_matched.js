import fs from 'fs';

const files = [
  'C:\\Users\\ClickTake\\.gemini\\antigravity\\brain\\11aa565a-ad8f-4842-a72a-d634c1fef9c5\\.system_generated\\logs\\overview.txt',
  'C:\\Users\\ClickTake\\.gemini\\antigravity\\brain\\1a43dea1-57b0-46ef-9245-e4d922b7e0c5\\.system_generated\\logs\\overview.txt',
  'C:\\Users\\ClickTake\\.gemini\\antigravity\\brain\\8e4c655d-354d-49c9-a762-56b12a43356f\\.system_generated\\logs\\overview.txt',
  'C:\\Users\\ClickTake\\.gemini\\antigravity\\brain\\b712919f-12b4-4aad-8505-58a80a787a70\\.system_generated\\logs\\overview.txt'
];

for (const f of files) {
  try {
    const content = fs.readFileSync(f, 'utf8');
    const lines = content.split('\n');
    console.log(`\n=== File: ${f} ===`);
    lines.forEach((line, idx) => {
      const lower = line.toLowerCase();
      if ((lower.includes('password') || lower.includes('db_') || lower.includes('postgresql:') || lower.includes('conn')) && 
          (lower.includes('snmsvix') || lower.includes('klx') || lower.includes('click') || lower.includes('opticx'))) {
        console.log(`L${idx}: ${line.trim().slice(0, 300)}`);
      }
    });
  } catch (e) {
    console.error(`Error reading ${f}:`, e.message);
  }
}
