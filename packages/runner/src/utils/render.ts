import { spawn } from "child_process";
import * as path from "path";

/**
 * Try rendering Mermaid to SVG using:
 *  1) npm exec from runner package directory (where @mermaid-js/mermaid-cli is installed)
 *  2) direct node module execution if available
 */
export async function renderMermaidCLI(input: string, output: string): Promise<boolean> {
  const isWin = process.platform === "win32";
  
  // Convert relative paths to absolute paths
  const inputPath = path.resolve(input);
  const outputPath = path.resolve(output);
  
  // Find the runner package directory
  // When built, __dirname points to dist/utils/, so we need to go up two levels to get to the runner package root
  const runnerPackageDir = path.join(__dirname, "..", "..");
  
  const candidates = [
    {
      cmd: isWin ? "npm.cmd" : "npm",
      args: ["exec", "--", "@mermaid-js/mermaid-cli", "-i", inputPath, "-o", outputPath, "-b", "transparent"],
      cwd: runnerPackageDir
    },
    {
      cmd: "node",
      args: [
        path.join(runnerPackageDir, "node_modules", "@mermaid-js", "mermaid-cli", "src", "cli.js"),
        "-i", inputPath, "-o", outputPath, "-b", "transparent"
      ],
      cwd: runnerPackageDir
    }
  ];

  for (const candidate of candidates) {
    try {
      await new Promise<void>((resolve, reject) => {
        const proc = spawn(candidate.cmd, candidate.args, { 
          cwd: candidate.cwd,
          stdio: 'pipe',
          shell: isWin
        });
        
        let stdout = '';
        let stderr = '';
        
        proc.stdout?.on('data', (data) => {
          stdout += data;
        });
        
        proc.stderr?.on('data', (data) => {
          stderr += data;
        });
        
        proc.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Command failed with code ${code}. Stderr: ${stderr}`));
          }
        });
        
        proc.on('error', (error) => {
          reject(error);
        });
      });
      
      return true;
    } catch (error) {
      console.debug(`Failed to render with ${candidate.cmd}:`, error);
      // try next
    }
  }
  return false;
}
