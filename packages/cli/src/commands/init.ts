import prompts from "prompts";
import * as path from "path";
import * as fs from "fs";
import chalk from "chalk";
import { scaffoldProject, type InitChoices } from "../templates/projects";
import { writeClaudeCommands } from "../templates/claude";
import { printArtifacts } from "../lib/printArtifacts";

type PromptAnswers = {
  mode?: "current" | "scaffold";
  template?: "blank" | "next-tailwind";
  appName?: string;
  addClaudeCmds?: boolean;
  addWorkflow?: boolean;
  addScript?: boolean;
  addHusky?: boolean;
  addGlossary?: boolean;
};

function repoIsProbablyEmpty(cwd: string) {
  const children = fs.readdirSync(cwd).filter((x) => !x.startsWith(".git"));
  return children.length === 0;
}

export const initCommand = async () => {
  console.log(chalk.cyan("🚀 FlowLock Init"));

  // Offer mode based on folder emptiness
  const defaultMode: "current" | "scaffold" = repoIsProbablyEmpty(process.cwd()) ? "scaffold" : "current";

  const answers = await prompts(
    [
      {
        type: "select",
        name: "mode",
        message: "Where do you want to initialize FlowLock?",
        choices: [
          { title: "Use current folder", value: "current" },
          { title: "Scaffold a new project", value: "scaffold" },
        ],
        initial: defaultMode === "scaffold" ? 1 : 0,
      },
      {
        type: (prev: any) => (prev === "scaffold" ? "select" : null),
        name: "template",
        message: "Choose a project template",
        choices: [
          { title: "Blank (FlowLock-only starter)", value: "blank" },
          { title: "Next.js + Tailwind (via create-next-app)", value: "next-tailwind" },
        ],
        initial: 0,
      },
      {
        type: (_prev: any, values: PromptAnswers) => (values.mode === "scaffold" ? "text" : null),
        name: "appName",
        message: "Project directory name",
        initial: (_prev: any, values: PromptAnswers) => (values.template === "next-tailwind" ? "flowlock-next" : "flowlock-app"),
        validate: (v: string) => (!!v && /^[a-z0-9-_]+$/i.test(v)) || "Use letters, numbers, - or _",
      },
      {
        type: "toggle",
        name: "addClaudeCmds",
        message: "Write .claude/commands helper files?",
        initial: true,
        active: "yes",
        inactive: "no",
      },
      {
        type: "toggle",
        name: "addWorkflow",
        message: "Add GitHub Actions workflow for FlowLock audit?",
        initial: true,
        active: "yes",
        inactive: "no",
      },
      {
        type: "toggle",
        name: "addScript",
        message: "Add npm script `flowlock:audit`?",
        initial: true,
        active: "yes",
        inactive: "no",
      },
      {
        type: "toggle",
        name: "addHusky",
        message: "Add Husky git hooks for pre-commit validation?",
        initial: false,
        active: "yes",
        inactive: "no",
      },
      {
        type: "toggle",
        name: "addGlossary",
        message: "Create glossary.yml for derived fields?",
        initial: true,
        active: "yes",
        inactive: "no",
      },
    ],
    {
      onCancel: () => {
        process.stdout.write("\nCancelled.\n");
        process.exit(1);
      },
    }
  );

  const choices = answers as InitChoices;
  await scaffoldProject(process.cwd(), choices);

  // Always ensure commands exist in *this* repo too (idempotent)
  try {
    writeClaudeCommands(process.cwd());
  } catch {}

  console.log(chalk.green("\n✅ FlowLock initialization complete!"));
  console.log(chalk.blue("\n🚀 Next steps:"));
  if (choices.mode === "scaffold") {
    const dir = path.join(process.cwd(), choices.appName || (choices.template === "next-tailwind" ? "flowlock-next" : "flowlock-app"));
    console.log(chalk.yellow("  1.") + ` cd ${chalk.cyan(path.relative(process.cwd(), dir))}`);
    console.log(chalk.yellow("  2.") + ` ${chalk.cyan("npx -y flowlock-uxcg audit")}`);
  } else {
    console.log(chalk.yellow("  1.") + ` ${chalk.cyan("npx -y flowlock-uxcg audit")}`);
  }
  
  // Show any artifacts that might already exist
  try {
    if (fs.existsSync("artifacts")) {
      printArtifacts("artifacts");
    }
  } catch {
    // Ignore if artifacts directory doesn't exist
  }
};