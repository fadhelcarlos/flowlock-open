import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['flowlock-shared', 'flowlock-uxspec', 'flowlock-plugin-sdk'],
});