import chalk from "chalk";

export function showSuccess(message: string) {
  console.log(chalk.green(`✅ ${message}`));
}

export function showError(message: string, details?: string) {
  console.error(chalk.red(`❌ ${message}`));
  if (details) {
    console.error(chalk.gray(`   ${details}`));
  }
}

export function showWarning(message: string) {
  console.log(chalk.yellow(`⚠️  ${message}`));
}

export function showInfo(message: string) {
  console.log(chalk.cyan(`ℹ️  ${message}`));
}

export function showSpinner(message: string) {
  console.log(chalk.cyan(`🔄 ${message}`));
}

export function showSection(title: string) {
  console.log(chalk.blue(`\n📋 ${title}`));
}

export function showCommand(command: string) {
  return chalk.cyan(`'${command}'`);
}

export function showPath(filePath: string) {
  return chalk.green(filePath.replace(/\\/g, "/"));
}

export function showSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function indent(text: string, spaces = 2): string {
  const prefix = " ".repeat(spaces);
  return text.split('\n').map(line => prefix + line).join('\n');
}

export function showSteps(steps: string[]) {
  steps.forEach((step, index) => {
    console.log(chalk.yellow(`  ${index + 1}.`) + ` ${step}`);
  });
}