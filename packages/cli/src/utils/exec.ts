import { spawn } from "child_process";
import { processManager, ProcessOptions, ProcessResult } from "./process-manager";

export async function run(
  cmd: string, 
  args: string[], 
  opts: { cwd?: string; env?: NodeJS.ProcessEnv; timeout?: number } = {}
): Promise<void> {
  const processOptions: ProcessOptions = {
    cwd: opts.cwd || process.cwd(),
    env: { ...process.env, ...(opts.env || {}) },
    stdio: "inherit",
    shell: process.platform === "win32",
    timeout: opts.timeout || 120000, // 2 minutes default
  };

  const tempId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const result = await processManager.runProcess(tempId, cmd, args, processOptions);
  
  if (!result.success) {
    const errorMsg = result.stderr || result.stdout || `${cmd} ${args.join(" ")} exited with code ${result.code}`;
    throw new Error(errorMsg);
  }
}

// Enhanced version that returns output
export async function runWithOutput(
  cmd: string,
  args: string[],
  opts: { cwd?: string; env?: NodeJS.ProcessEnv; timeout?: number } = {}
): Promise<ProcessResult> {
  const processOptions: ProcessOptions = {
    cwd: opts.cwd || process.cwd(),
    env: { ...process.env, ...(opts.env || {}) },
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
    timeout: opts.timeout || 120000,
  };

  const tempId = `runOutput_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return processManager.runProcess(tempId, cmd, args, processOptions);
}

export async function which(cmd: string): Promise<string | null> {
  const isWin = process.platform === "win32";
  const probe = isWin ? ["where", cmd] : ["which", cmd];
  try {
    await run(probe[0], [probe[1]]);
    return cmd;
  } catch {
    return null;
  }
}
