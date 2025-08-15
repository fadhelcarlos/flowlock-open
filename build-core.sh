#!/bin/bash
# Build core packages only (skip site)

echo "Building core FlowLock packages..."

cd packages/uxspec && pnpm build
cd ../plugin-sdk && pnpm build  
cd ../checks-core && pnpm build
cd ../runner && pnpm build
cd ../cli && pnpm build

echo "Core packages built successfully!"
echo "You can now run: pnpm -w uxcg audit"