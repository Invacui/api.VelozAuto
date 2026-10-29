/** Build script: tsc + rewrite @/ path aliases (tsc-alias). */
const { execSync } = require('child_process');
execSync('npx tsc -p tsconfig.json', { stdio: 'inherit' });
execSync('npx tsc-alias -p tsconfig.json', { stdio: 'inherit' });
console.log('Build complete → dist/');
