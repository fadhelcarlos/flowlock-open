// packages/cli/src/commands/inventory.ts
import { buildInventory } from "flowlock-inventory";
import fs from "node:fs";
import path from "node:path";

export const inventoryCommand = async (opts: { config: string; out: string }) => {
  try {
    // Validate config file exists
    if (!fs.existsSync(opts.config)) {
      console.error(`Error: Config file not found: ${opts.config}`);
      console.error("Run 'npx flowlock-uxcg init-existing' to create a default config.");
      process.exit(1);
    }

    // Ensure output directory exists
    const outDir = path.dirname(opts.out);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    console.log(`Building inventory from ${opts.config}...`);
    const f = await buildInventory(opts.config, opts.out);
    
    // Verify output was created
    if (!fs.existsSync(f)) {
      throw new Error(`Failed to create inventory file at ${f}`);
    }

    const stats = fs.statSync(f);
    console.log(`✓ Wrote ${f} (${stats.size} bytes)`);
    
    // Parse and display summary
    try {
      const inv = JSON.parse(fs.readFileSync(f, "utf8"));
      console.log(`  - DB entities: ${inv.db?.entities?.length || 0}`);
      console.log(`  - API endpoints: ${inv.api?.endpoints?.length || 0}`);
      console.log(`  - UI reads: ${inv.ui?.reads?.length || 0}`);
      console.log(`  - UI writes: ${inv.ui?.writes?.length || 0}`);
    } catch (e) {
      // Non-critical - just skip summary
    }
  } catch (error) {
    console.error("Error building inventory:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
};
