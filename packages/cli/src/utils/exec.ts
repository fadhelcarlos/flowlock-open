import { spawn } from "child_process";

export async function run(cmd: string, args: string[], opts: { cwd?: string; env?: NodeJS.ProcessEnv } = {}) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd || process.cwd(),
      env: { ...process.env, ...(opts.env || {}) },
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} exited with code ${code}`));
    });
  });
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
