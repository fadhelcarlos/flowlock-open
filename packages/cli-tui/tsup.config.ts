import { defineConfig } from 'tsup';

export default defineConfig([
  // Main library build without shebang
  {
    entry: {
      'index': 'src/index.tsx'
    },
    splitting: false,
    clean: true,
    sourcemap: true,
    dts: false,
    format: ['esm'],
    outDir: 'dist',
    external: ['react']
  },
  // Binary builds with shebang
  {
    entry: {
      'bin/flowlock': 'src/bin/flowlock.ts',
      'bin/flowlock-test': 'src/bin/flowlock-test.ts'
    },
    splitting: false,
    clean: false,
    sourcemap: true,
    dts: false,
    format: ['esm'],
    banner: { 
      js: '#!/usr/bin/env node'
    },
    outDir: 'dist',
    external: ['react']
  }
]);