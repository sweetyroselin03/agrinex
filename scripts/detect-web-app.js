const fs = require('fs');
const path = require('path');

function detectWebAppDir() {
  const rootDir = process.cwd();
  
  // 1. Check common names first: frontend, web, app, client
  const commonNames = ['frontend', 'web', 'app', 'client'];
  for (const name of commonNames) {
    const p = path.join(rootDir, name);
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
      if (fs.existsSync(path.join(p, 'package.json')) && 
         (fs.existsSync(path.join(p, 'vite.config.ts')) || fs.existsSync(path.join(p, 'vite.config.js')))) {
        return name;
      }
    }
  }

  // 2. Scan all subdirectories (1 level deep)
  const items = fs.readdirSync(rootDir);
  for (const item of items) {
    if (item === 'node_modules' || item === '.git' || commonNames.includes(item)) continue;
    const p = path.join(rootDir, item);
    try {
      if (fs.statSync(p).isDirectory()) {
        if (fs.existsSync(path.join(p, 'package.json')) && 
           (fs.existsSync(path.join(p, 'vite.config.ts')) || fs.existsSync(path.join(p, 'vite.config.js')))) {
          return item;
        }
      }
    } catch (e) {}
  }
  
  // 3. Fallback to 'frontend' if not found
  return 'frontend';
}

module.exports = { detectWebAppDir };
