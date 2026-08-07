const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { detectWebAppDir } = require('./detect-web-app');

function build() {
  const webAppDir = detectWebAppDir();
  console.log(`[Vercel Build] Automatically detected web application folder: ${webAppDir}`);
  
  const webAppPath = path.join(process.cwd(), webAppDir);
  
  console.log(`[Vercel Build] Running production build in ${webAppDir}...`);
  execSync('npm run build', {
    cwd: webAppPath,
    stdio: 'inherit'
  });
  
  const srcDist = path.join(webAppPath, 'dist');
  const destDist = path.join(process.cwd(), 'dist');
  
  if (!fs.existsSync(srcDist)) {
    throw new Error(`[Vercel Build] Build succeeded but could not find output directory: ${srcDist}`);
  }
  
  console.log(`[Vercel Build] Cleaning target root-level dist folder...`);
  if (fs.existsSync(destDist)) {
    fs.rmSync(destDist, { recursive: true, force: true });
  }
  
  console.log(`[Vercel Build] Copying build outputs from ${srcDist} to ${destDist}...`);
  fs.mkdirSync(destDist, { recursive: true });
  fs.cpSync(srcDist, destDist, { recursive: true });
  
  console.log('[Vercel Build] Build and artifact copy completed successfully!');
}

build();
