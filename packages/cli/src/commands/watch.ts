import { sendToCloud } from "../lib/cloud"; // adjust to "../../lib/cloud" if needed
import * as fs from "fs/promises";
import * as path from "path";
import chalk from "chalk";
import chokidar from "chokidar";
import { Runner } from "flowlock-runner";

interface WatchOptions {
  cloud?: boolean;
  cloudUrl?: string;
  projectId?: string;
  token?: string; // optional auth token for secured ingest
}

export async function watchCommand(options: WatchOptions) {
  console.log(chalk.cyan("👁️  Starting FlowLock watch mode...\n"));

  const specPath = path.join(process.cwd(), "uxspec.json");
  const appDirs = ["app", "apps"];

  const watchPaths: string[] = [specPath];
  for (const dir of appDirs) {
    try {
      await fs.access(dir);
      watchPaths.push(`${dir}/**/*.{ts,tsx,js,jsx}`);
    } catch {
      // Directory doesn't exist, skip
    }
  }

  console.log("Watching:");
  watchPaths.forEach((p) => console.log(`  • ${p}`));

  // Resolve cloud options from explicit flags first, then env vars, then defaults.
  const envCloud = (process.env.FLOWLOCK_CLOUD ?? "").toLowerCase();
  const cloudEnabled = (options.cloud ?? ["1", "true"].includes(envCloud));
  const cloudUrl =
    options.cloudUrl ?? process.env.FLOWLOCK_CLOUD_URL ?? "http://localhost:8787";
  const projectId =
    options.projectId ?? process.env.FLOWLOCK_PROJECT_ID ?? "demo";
  const token = options.token ?? process.env.FLOWLOCK_TOKEN;

  if (cloudEnabled) {
    console.log(chalk.yellow("\n☁️  Cloud sync enabled"));
    console.log(`  URL: ${cloudUrl}`);
    console.log(`  Project: ${projectId}`);
    if (token) console.log(`  Auth: Bearer <token>`);
  }

  let isRunning = false;

  const runAudit = async () => {
    if (isRunning) return;
    isRunning = true;

    console.log(chalk.dim("\n---"));
    console.log(chalk.cyan("🔄 Change detected, running audit..."));

    const startedAt = new Date().toISOString();

    try {
      const runner = await Runner.fromFile(specPath);
      const result = await runner.runAndSave("artifacts");

      const errors = result.checkResults.filter(
        (r: any) => r.level === "error" && r.status === "fail"
      );
      const warnings = result.checkResults.filter(
        (r: any) => r.level === "warning" && r.status === "fail"
      );

      if (errors.length > 0) {
        console.log(chalk.red(`  ❌ ${errors.length} errors`));
      }
      if (warnings.length > 0) {
        console.log(chalk.yellow(`  ⚠️  ${warnings.length} warnings`));
      }
      if (errors.length === 0 && warnings.length === 0) {
        console.log(chalk.green("  ✅ All checks passed"));
      }

      // ---- Call it after each audit completes (send to cloud) ----
      const finishedAt = new Date().toISOString();
      const artifacts = ["er.svg", "flow.svg", "screens.csv", "results.junit.xml"];

      await sendToCloud(
        {
          checks: result.checkResults,
          artifacts,
          startedAt,
          finishedAt,
        },
        {
          cloud: cloudEnabled,
          cloudUrl,
          projectId,
          token,
        }
      );
      // ------------------------------------------------------------

    } catch (error) {
      console.error(chalk.red("  ❌ Audit failed:"), error);
    } finally {
      isRunning = false;
    }
  };

  const watcher = chokidar.watch(watchPaths, {
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on("change", runAudit);
  watcher.on("add", runAudit);
  watcher.on("unlink", runAudit);

  // Run initial audit
  await runAudit();

  console.log(chalk.dim("\nPress Ctrl+C to stop watching"));
}
