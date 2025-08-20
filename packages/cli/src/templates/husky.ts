import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const HUSKY_PRE_COMMIT = `#!/usr/bin/env sh
. "$(dirname "$0")/_/husky.sh"

echo "🔒 FlowLock: Validating UX specification..."
npx flowlock-uxcg audit || { 
  echo "❌ UX specification validation failed. Fix issues before committing."
  echo "💡 Run 'npx flowlock-uxcg audit --fix' to auto-fix common issues."
  exit 1
}
`;

const HUSKY_PRE_PUSH = `#!/usr/bin/env sh
. "$(dirname "$0")/_/husky.sh"

echo "🔒 FlowLock: Final validation before push..."
npx flowlock-uxcg audit || { 
  echo "⚠️  Warning: UX specification has issues."
  echo "💡 Consider fixing with 'npx flowlock-uxcg audit --fix'"
}
`;

export async function setupHusky(projectDir: string): Promise<void> {
  try {
    // Check if package.json exists
    const pkgPath = path.join(projectDir, "package.json");
    if (!fs.existsSync(pkgPath)) {
      console.log("⚠️  No package.json found, skipping Husky setup");
      return;
    }

    // Install husky as dev dependency
    console.log("📦 Installing Husky...");
    execSync("npm install --save-dev husky", {
      cwd: projectDir,
      stdio: "inherit",
    });

    // Initialize husky
    console.log("🔧 Initializing Husky...");
    execSync("npx husky install", {
      cwd: projectDir,
      stdio: "inherit",
    });

    // Add husky install to prepare script
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    if (!pkg.scripts) pkg.scripts = {};
    pkg.scripts.prepare = "husky install";
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

    // Create pre-commit hook
    const preCommitPath = path.join(projectDir, ".husky", "pre-commit");
    fs.writeFileSync(preCommitPath, HUSKY_PRE_COMMIT);
    
    // Create pre-push hook
    const prePushPath = path.join(projectDir, ".husky", "pre-push");
    fs.writeFileSync(prePushPath, HUSKY_PRE_PUSH);

    // Make hooks executable on Unix-like systems
    if (process.platform !== "win32") {
      fs.chmodSync(preCommitPath, 0o755);
      fs.chmodSync(prePushPath, 0o755);
    }

    console.log("✅ Husky git hooks configured");
    console.log("   • pre-commit: Validates UX spec");
    console.log("   • pre-push: Final validation");
  } catch (error) {
    console.error("⚠️  Failed to setup Husky:", error);
    console.log("   You can manually set it up later with:");
    console.log("   npm install --save-dev husky");
    console.log("   npx husky install");
  }
}

export function createHuskyConfig(): { [key: string]: string } {
  return {
    ".husky/pre-commit": HUSKY_PRE_COMMIT,
    ".husky/pre-push": HUSKY_PRE_PUSH,
  };
}
