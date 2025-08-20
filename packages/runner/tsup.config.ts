import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['flowlock-shared', 'flowlock-uxspec', 'flowlock-checks-core', 'flowlock-plugin-sdk'],
});