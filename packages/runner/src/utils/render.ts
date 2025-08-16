import { execFile } from "child_process";
import { promisify } from "util";
const exec = promisify(execFile);

/**
 * Try rendering Mermaid to SVG using:
 *  1) local "mmdc" if available (pnpm-installed)
 *  2) npx fallback (downloads if missing)
 */
export async function renderMermaidCLI(input: string, output: string): Promise<boolean> {
  const isWin = process.platform === "win32";
  const candidates: Array<{cmd:string,args:string[]}> = [
    { cmd: isWin ? "mmdc.cmd" : "mmdc", args: ["-i", input, "-o", output, "-b", "transparent"] },
    { cmd: "npx", args: ["-y", "@mermaid-js/mermaid-cli", "-i", input, "-o", output, "-b", "transparent"] },
  ];

  for (const c of candidates) {
    try {
      await exec(c.cmd, c.args, { stdio: "ignore" as any });
      return true;
    } catch {
      // try next
    }
  }
  return false;
}
