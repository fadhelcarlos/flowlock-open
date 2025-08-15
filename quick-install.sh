#!/bin/bash
# Quick install for core functionality only

echo "Installing core dependencies..."

# Install workspace root dependencies
npm install --no-save @changesets/cli @types/node eslint prettier typescript vitest

# Build core packages
echo "Building core packages..."
cd packages/uxspec && npm install --no-save zod && npm run build 2>/dev/null || echo "uxspec build skipped"
cd ../plugin-sdk && npm run build 2>/dev/null || echo "plugin-sdk build skipped"  
cd ../checks-core && npm run build 2>/dev/null || echo "checks-core build skipped"
cd ../runner && npm install --no-save mermaid && npm run build 2>/dev/null || echo "runner build skipped"
cd ../cli && npm install --no-save commander chalk@4 chokidar ws && npm run build 2>/dev/null || echo "cli build skipped"

cd ../..
echo "Core packages ready!"
echo ""
echo "You can now use:"
echo "  node packages/cli/dist/index.js init"
echo "  node packages/cli/dist/index.js audit"
echo ""
echo "For the Next.js site, run: cd apps/site && npm install"