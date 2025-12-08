import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixReactImports(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixReactImports(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Fix React import
      content = content.replace(
        /import\s+React\s+from\s+'react'/g,
        "import * as React from 'react'"
      );
      
      // Also fix default imports that might cause issues
      content = content.replace(
        /import\s+(\w+)\s+from\s+'react-dom'/g,
        "import * as $1 from 'react-dom'"
      );
      
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${filePath}`);
    }
  });
}

// Start from src directory
if (fs.existsSync('src')) {
  fixReactImports('src');
}
