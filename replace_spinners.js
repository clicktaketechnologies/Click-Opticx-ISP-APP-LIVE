import fs from 'fs';
import path from 'path';

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    let changed = false;

    // Replace Loader2 and RefreshCw that have animate-spin
    content = content.replace(/<(Loader2|RefreshCw)[^>]*?animate-spin[^>]*?\/>/g, (match, tag) => {
        let sizeMatch = match.match(/size=\{?(\d+)\}?/);
        let sizeProp = sizeMatch ? ` size={${sizeMatch[1]}}` : '';
        changed = true;
        return `<Mini5GMicroLoader${sizeProp} />`;
    });

    if (changed && !content.includes('Mini5GMicroLoader')) {
        let relativePath = path.relative(path.dirname(filePath), path.join(process.cwd(), 'components', 'Mini5GMicroLoader')).replace(/\\/g, '/');
        if (!relativePath.startsWith('.')) relativePath = './' + relativePath;
        
        let importLines = content.split('\n');
        let importIndex = 0;
        for (let i = 0; i < importLines.length; i++) {
            if (importLines[i].startsWith('import ')) {
                importIndex = i + 1;
            }
        }
        importLines.splice(importIndex, 0, `import { Mini5GMicroLoader } from '${relativePath}';`);
        content = importLines.join('\n');
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated', filePath);
    }
}

function traverse(dir) {
    if (!fs.existsSync(dir)) return;
    let files = fs.readdirSync(dir);
    for (let file of files) {
        let fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!['node_modules', '.git', 'dist'].includes(file)) traverse(fullPath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            processFile(fullPath);
        }
    }
}

traverse(path.join(process.cwd(), 'pages'));
traverse(path.join(process.cwd(), 'components'));
traverse(process.cwd()); // also root for App.tsx
