import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/errors.ts",
    "src/validation.ts",
    "src/types.ts",
    "src/config-validator.ts"
  ],
  format: ["cjs"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
});