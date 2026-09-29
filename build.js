const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('[Build] Building frontend with Vite...');
execSync('npm --prefix frontend install && npm --prefix frontend run build', { stdio: 'inherit' });

const src = path.join(__dirname, 'frontend', 'dist');
const dest = path.join(__dirname, 'dist');

console.log('[Build] Copying frontend/dist to root dist...');
if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true, force: true });
}
fs.cpSync(src, dest, { recursive: true });

console.log('[Build] Build complete! dist/ ready.');
