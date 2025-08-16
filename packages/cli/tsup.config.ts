import { defineConfig } from "tsup";
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  dts: true,
  clean: true,
  target: "es2022",
  sourcemap: true,
  minify: false,
  banner: { js: "#!/usr/bin/env node" }
});
