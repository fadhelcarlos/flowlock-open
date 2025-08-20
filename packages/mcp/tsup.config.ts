import { defineConfig } from "tsup";
export default defineConfig({
  entry: ["src/server.ts"],
  format: ["cjs"],
  outExtension() {
    return {
      js: '.js'
    }
  },
  target: "es2022",
  sourcemap: true,
  clean: true,
  banner: { js: "#!/usr/bin/env node" }
});