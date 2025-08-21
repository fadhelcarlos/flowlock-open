import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";

export function printArtifacts(dir = "artifacts") {
  try {
    console.log(chalk.cyan("\n📁 Artifacts generated:"));
    const files = fs.readdirSync(dir, { withFileTypes: true })
      .filter(d => d.isFile())
      .map(d => d.name)
      .sort();
    
    if (files.length === 0) {
      console.log(chalk.gray("   (none)"));
      return;
    }
    
    for (const f of files) {
      const fullPath = path.join(dir, f);
      const stats = fs.statSync(fullPath);
      const size = formatFileSize(stats.size);
      const ext = path.extname(f).toLowerCase();
      
      // Add file type icons for better UX
      let icon = "📄";
      if ([".svg", ".png", ".jpg", ".jpeg"].includes(ext)) icon = "🖼️";
      else if ([".json"].includes(ext)) icon = "📋";
      else if ([".xml"].includes(ext)) icon = "🔗";
      else if ([".csv"].includes(ext)) icon = "📊";
      else if ([".md"].includes(ext)) icon = "📝";
      
      console.log(`   ${icon} ${chalk.green(fullPath.replace(/\\/g, "/"))} ${chalk.gray(`(${size})`)}`);
    }
  } catch {
    console.log(chalk.cyan("\n📁 Artifacts generated:"));
    console.log(chalk.gray("   (none)"));
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
