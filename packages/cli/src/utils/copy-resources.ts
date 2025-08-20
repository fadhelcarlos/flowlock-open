import * as fs from "fs";
import * as path from "path";

/**
 * Recursively copy a directory
 */
function copyDirectoryRecursive(src: string, dest: string): void {
  if (!fs.existsSync(src)) {
    console.warn(`Warning: Source directory ${src} does not exist`);
    return;
  }

  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules and .git directories
      if (entry.name === "node_modules" || entry.name === ".git") {
        continue;
      }
      copyDirectoryRecursive(srcPath, destPath);
    } else {
      // Copy file
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Copy FlowLock resources (examples, docs, README) to the target project
 */
export function copyFlowLockResources(targetDir: string): void {
  // Determine the CLI package root directory
  // __dirname could be either src/utils or dist/utils depending on compilation
  // Go up 2 levels to get to the package root
  const cliPackageRoot = path.resolve(__dirname, "..", "..");
  
  // The monorepo root is two levels up from the CLI package
  const monorepoRoot = path.resolve(cliPackageRoot, "..", "..");
  
  const flowlockDir = path.join(targetDir, ".flowlock");
  
  // Create .flowlock directory if it doesn't exist
  if (!fs.existsSync(flowlockDir)) {
    fs.mkdirSync(flowlockDir, { recursive: true });
  }

  // Copy examples directory
  const examplesSource = path.join(monorepoRoot, "examples");
  const examplesDest = path.join(flowlockDir, "examples");
  if (fs.existsSync(examplesSource)) {
    console.log("  • Copying FlowLock examples...");
    copyDirectoryRecursive(examplesSource, examplesDest);
  }

  // Copy docs directory
  const docsSource = path.join(monorepoRoot, "docs");
  const docsDest = path.join(flowlockDir, "docs");
  if (fs.existsSync(docsSource)) {
    console.log("  • Copying FlowLock documentation...");
    copyDirectoryRecursive(docsSource, docsDest);
  }

  // Copy README.md
  const readmeSource = path.join(monorepoRoot, "README.md");
  const readmeDest = path.join(flowlockDir, "README.md");
  if (fs.existsSync(readmeSource)) {
    console.log("  • Copying FlowLock README...");
    fs.copyFileSync(readmeSource, readmeDest);
  }
}