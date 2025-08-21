// packages/cli/src/commands/inventory.ts
import { buildInventory } from "flowlock-inventory";
import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import { printArtifacts } from "../lib/printArtifacts";

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

    console.log(chalk.cyan(`📦 Building inventory from ${opts.config}...`));
    const f = await buildInventory(opts.config, opts.out);
    
    // Verify output was created
    if (!fs.existsSync(f)) {
      throw new Error(`Failed to create inventory file at ${f}`);
    }

    const stats = fs.statSync(f);
    console.log(chalk.green(`✅ Inventory built successfully`));
    
    // Parse and display summary
    try {
      const inv = JSON.parse(fs.readFileSync(f, "utf8"));
      console.log(chalk.blue("\n📊 Inventory Summary:"));
      console.log(`  ${chalk.gray("•")} DB entities: ${chalk.yellow(inv.db?.entities?.length || 0)}`);
      console.log(`  ${chalk.gray("•")} API endpoints: ${chalk.yellow(inv.api?.endpoints?.length || 0)}`);
      console.log(`  ${chalk.gray("•")} UI reads: ${chalk.yellow(inv.ui?.reads?.length || 0)}`);
      console.log(`  ${chalk.gray("•")} UI writes: ${chalk.yellow(inv.ui?.writes?.length || 0)}`);
    } catch (e) {
      // Non-critical - just skip summary
    }
    
    // Show all artifacts
    printArtifacts(path.dirname(opts.out));
  } catch (error) {
    console.error("Error building inventory:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
};
