#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import fs from "fs";
import path from "path";

const program = new Command();

// ─────────────────────────────────────────────────────────────
// 🔥 CLI HEADER
// ─────────────────────────────────────────────────────────────
function showHeader() {
  console.log(
    chalk.cyan.bold(`
🚀 ExplainIt CLI
────────────────────────────────
`),
  );
}

// ─────────────────────────────────────────────────────────────
// ⚙️ CONFIG
// ─────────────────────────────────────────────────────────────
program
  .name("explainit")
  .usage("[command] [options]")
  .description(chalk.yellow("🧠 Turn your code into a quiz before committing"))
  .version("1.0.0");

// Clean options (no descriptions)
program.configureHelp({
  optionTerm: (option) => option.flags,
});

// Custom help footer
program.addHelpText(
  "after",
  chalk.gray(`
Examples:
  explainit scan index.js
  explainit quiz app.js
  explainit score

💡 Tip:
  Run 'explainit quiz <file>' before every commit 🚀
`),
);

// ─────────────────────────────────────────────────────────────
// 🔍 explainit scan <file>
// ─────────────────────────────────────────────────────────────
program
  .command("scan <file>")
  .alias("s")
  .description("🔍 Scan your code instantly")
  .action((file) => {
    showHeader();

    const filePath = path.resolve(file);

    if (!fs.existsSync(filePath)) {
      console.log(chalk.red(`❌ File not found: ${file}\n`));
      process.exit(1);
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    console.log(chalk.cyan(`📄 File: `) + chalk.white(file));
    console.log(chalk.cyan(`📏 Lines: `) + chalk.white(lines.length));
    console.log(chalk.gray("────────────────────────────────\n"));

    console.log(chalk.gray("Preview (first 20 lines):\n"));

    lines.slice(0, 20).forEach((line, i) => {
      const lineNum = chalk.gray(`${String(i + 1).padStart(3)} │ `);
      console.log(lineNum + chalk.white(line));
    });

    if (lines.length > 20) {
      console.log(chalk.gray(`\n... and ${lines.length - 20} more lines`));
    }

    console.log();
    console.log(chalk.green("✅ File scanned successfully!"));
    console.log(chalk.gray('Next: Run "explainit quiz <file>" 🧠\n'));
  });

// ─────────────────────────────────────────────────────────────
// 🧠 explainit quiz <file>
// ─────────────────────────────────────────────────────────────
program
  .command("quiz <file>")
  .alias("q")
  .description("🧠 Test your understanding")
  .action((file) => {
    showHeader();

    console.log(chalk.blue("🤖 Generating quiz from your code..."));
    console.log(chalk.gray("(Gemini integration coming next 🔥)\n"));
  });

// ─────────────────────────────────────────────────────────────
// 📊 explainit score
// ─────────────────────────────────────────────────────────────
program
  .command("score")
  .alias("sc")
  .description("📊 View your progress")
  .action(() => {
    showHeader();

    console.log(chalk.magenta("📊 Your Stats"));
    console.log(chalk.gray("Coming soon in next update 🚀\n"));
  });

// ─────────────────────────────────────────────────────────────
// 🎉 explainit install — setup git pre-commit hook
// ─────────────────────────────────────────────────────────────
program
  .command("install")
  .description("Install git hook")
  .action(() => {
    const hookPath = path.resolve(".git/hooks/pre-commit");

    const script = `#!/bin/sh

FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|ts)$')

[ -z "$FILES" ] && exit 0

echo ""
echo "🧠 explainit — quick check before commit"
echo ""

node -e "
  import('./lib/quiz.js').then(m => m.runQuiz(process.argv.slice(1)))
" $FILES

exit 0
`;

    fs.writeFileSync(hookPath, script);
    fs.chmodSync(hookPath, "755");

    console.log("✅ Hook installed");
  });

program.parse();
