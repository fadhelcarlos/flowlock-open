// packages/cli/src/commands/inventory.ts
import { buildInventory } from "flowlock-inventory";

export const inventoryCommand = async (opts: { config: string; out: string }) => {
  const f = await buildInventory(opts.config, opts.out);
  console.log("Wrote", f);
};
