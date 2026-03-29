const fs = require('fs');

const content = fs.readFileSync('db.ts', 'utf8');
const lines = content.split('\n');

const methodRegex = /async\s+([a-zA-Z0-9_]+)\s*\(/g;
const syncMethodRegex = /([a-zA-Z0-9_]+)\s*\(/g;

const methods = new Map();

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let match;
    // Look for lines that look like a method start inside the DB class.
    // They usually have an indentation of 2 spaces, and optionally "async " followed by methodName(
    if (line.match(/^  (async\s+)?[a-zA-Z0-9_]+\s*\(/)) {
        const nameMatch = line.match(/^  (?:async\s+)?([a-zA-Z0-9_]+)\s*\(/);
        if (nameMatch) {
            const methodName = nameMatch[1];
            if (!methods.has(methodName)) {
                methods.set(methodName, []);
            }
            methods.get(methodName).push(i + 1);
        }
    }
}

console.log('--- Duplicate Method Analysis ---');
let found = false;
for (const [name, lineNumbers] of methods.entries()) {
    if (lineNumbers.length > 1 && name !== 'constructor') { // Exclude constructor if any
        console.log(`Method "${name}" found at lines: ${lineNumbers.join(', ')}`);
        found = true;
    }
}

if (!found) {
    console.log('No duplicate methods found.');
}
