import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'index': 'src/index.tsx',
    'bin/flowlock': 'src/bin/flowlock.ts'
  },
  splitting: false,
  clean: true,
  sourcemap: true,
  dts: false, // Disable for now due to ink type issues
  format: ['cjs'],
  banner: { 
    js: '#!/usr/bin/env node'
  },
  outDir: 'dist',
  external: ['react']
});