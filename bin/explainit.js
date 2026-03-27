#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import os from "os";
import readline from "readline";
import { readScores, getStreak } from "../lib/scores.js";

const program = new Command();

// ─────────────────────────────────────────────────────────────
// 🎨 THEME
// ─────────────────────────────────────────────────────────────
const t = {
  brand:   (s) => chalk.hex("#A78BFA")(s),
  accent:  (s) => chalk.hex("#34D399")(s),
  hot:     (s) => chalk.hex("#FB923C")(s),
  info:    (s) => chalk.hex("#60A5FA")(s),
  muted:   (s) => chalk.hex("#6B7280")(s),
  dim:     (s) => chalk.hex("#374151")(s),
  white:   (s) => chalk.hex("#F9FAFB")(s),
  success: (s) => chalk.hex("#4ADE80")(s),
  danger:  (s) => chalk.hex("#F87171")(s),
  bold:    (s) => chalk.bold(s),
};

// ─────────────────────────────────────────────────────────────
// 🖼️  HEADER
// ─────────────────────────────────────────────────────────────
function showHeader() {
  console.log();
  console.log(t.brand("  ███████╗██╗  ██╗██████╗ ██╗      █████╗ ██╗███╗   ██╗██╗████████╗"));
  console.log(t.brand("  ██╔════╝╚██╗██╔╝██╔══██╗██║     ██╔══██╗██║████╗  ██║██║╚══██╔══╝"));
  console.log(t.accent("  █████╗   ╚███╔╝ ██████╔╝██║     ███████║██║██╔██╗ ██║██║   ██║   "));
  console.log(t.accent("  ██╔══╝   ██╔██╗ ██╔═══╝ ██║     ██╔══██║██║██║╚██╗██║██║   ██║   "));
  console.log(t.hot("  ███████╗██╔╝ ██╗██║     ███████╗██║  ██║██║██║ ╚████║██║   ██║   "));
  console.log(t.hot("  ╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝   "));
  console.log();
  console.log(t.muted("  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄"));
  console.log(
    "  " + t.muted("by") + " " + t.brand("@explainit") +
    t.muted("  ·  ") + t.accent("quiz your code") +
    t.muted("  ·  ") + t.info("v1.0.0")
  );
  console.log(t.muted("  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄"));
  console.log();
}

// ─────────────────────────────────────────────────────────────
// 🧱 UI HELPERS
// ─────────────────────────────────────────────────────────────
function section(title) {
  console.log();
  console.log("  " + t.brand("▸") + " " + t.white(chalk.bold(title)));
  console.log("  " + t.muted("─".repeat(44)));
}

function row(icon, label, value = "") {
  console.log("  " + icon + "  " + t.white(label.padEnd(20)) + t.muted(value));
}

// ─────────────────────────────────────────────────────────────
// ⚙️  CONFIG
// ─────────────────────────────────────────────────────────────
program
  .name("explainit")
  .usage("[command] [options]")
  .description(t.brand("🧠 quiz your code before it ships"))
  .version(t.accent("1.0.0"), "-V, --version");

program.configureHelp({
  optionTerm: (option) => option.flags,
  commandDescription: (cmd) => cmd.description(),
});

program.configureOutput({
  writeOut: (str) => process.stdout.write(str),
  writeErr: (str) => process.stdout.write(str),
});

program.addHelpText("beforeAll", () => {
  showHeader();
  return "";
});

program.addHelpText(
  "after",
  [
    "",
    "  " + t.muted("┄".repeat(44)),
    "  " + t.brand("✦") + "  " + t.white("commands"),
    "",
    "  " + t.accent("  scan  ") + t.muted("│") + "  " + t.white("scan a file and preview its contents"),
    "  " + t.info("  quiz  ") + t.muted("│") + "  " + t.white("generate an AI quiz from your code"),
    "  " + t.hot(" score  ") + t.muted("│") + "  " + t.white("view your quiz history and score"),
    "  " + t.brand(" setup  ") + t.muted("│") + "  " + t.white("connect your Gemini API key"),
    "  " + t.brand("install ") + t.muted("│") + "  " + t.white("hook into git — auto-quiz on commit"),
    "",
    "  " + t.muted("┄".repeat(44)),
    "  " + t.brand("✦") + "  " + t.white("examples"),
    "",
    "  " + t.muted("$") + "  " + t.accent("explainit install") + t.muted("            # set up git hook"),
    "  " + t.muted("$") + "  " + t.accent("explainit scan index.js") + t.muted("      # preview file"),
    "  " + t.muted("$") + "  " + t.accent("explainit quiz app.js") + t.muted("        # quiz yourself"),
    "  " + t.muted("$") + "  " + t.accent("explainit score") + t.muted("              # check progress"),
    "",
  ].join("\n")
);

// ─────────────────────────────────────────────────────────────
// 🔍 scan
// ─────────────────────────────────────────────────────────────
program
  .command("scan <file>")
  .alias("s")
  .description("scan a file instantly")
  .action((file) => {
    showHeader();

    const filePath = path.resolve(file);

    if (!fs.existsSync(filePath)) {
      console.log("  " + t.danger("✗") + " " + t.white("file not found:") + " " + t.hot(file));
      console.log();
      process.exit(1);
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    section("file info");
    row("📄", "path", file);
    row("📏", "lines", String(lines.length));
    row("💾", "size", (fs.statSync(filePath).size / 1024).toFixed(1) + " kb");

    section("preview");

    lines.slice(0, 20).forEach((line, i) => {
      const num = t.muted(String(i + 1).padStart(3) + " │ ");
      console.log("  " + num + t.white(line));
    });

    if (lines.length > 20) {
      console.log();
      console.log("  " + t.muted(`... ${lines.length - 20} more lines`));
    }

    console.log();
    console.log(
      "  " + t.success("✓") + " " + t.white("scan complete") +
      "  " + t.muted("→") + "  " + t.accent("explainit quiz " + file)
    );
    console.log();
  });

// ─────────────────────────────────────────────────────────────
// 🧠 quiz
// ─────────────────────────────────────────────────────────────
program
  .command("quiz <file>")
  .alias("q")
  .description("generate an AI quiz from your code")
  .action((file) => {
    showHeader();
    console.log(
      "  " + t.brand("◆") + " " + t.white("generating quiz from") +
      " " + t.accent(file) + t.muted(" ...")
    );
    console.log();
    console.log("  " + t.muted("powered by gemini 🔥"));
    console.log();
  });

// ─────────────────────────────────────────────────────────────
// 📊 score
// ─────────────────────────────────────────────────────────────
program
  .command("score")
  .alias("sc")
  .description("view your quiz history and score")
  .action(() => {
    showHeader();
    section("your stats");

    const scores = readScores();

    // no scores yet
    if (!scores.length) {
      console.log(
        "  " + t.muted("no quizzes yet — make a commit to start! 🚀")
      );
      console.log();
      return;
    }

    // calculate stats
    const total = scores.length;
    const correct = scores.filter((s) => s.correct).length;
    const incorrect = total - correct;
    const percent = Math.round((correct / total) * 100);
    const streak = getStreak(scores);

    // recent 5 sessions
    const recent = scores.slice(-5).reverse();

    // file breakdown
    const fileCounts = {};
    scores.forEach((s) => {
      fileCounts[s.file] = (fileCounts[s.file] || 0) + 1;
    });
    const topFiles = Object.entries(fileCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    // ── summary ───────────────────────────────────
    console.log();
    console.log(
      "  " + t.brand("total quizzes  ") +
      t.white(chalk.bold(String(total).padEnd(6))) +
      t.accent("correct  ") +
      t.white(chalk.bold(String(correct).padEnd(6))) +
      t.danger("wrong  ") +
      t.white(chalk.bold(String(incorrect)))
    );

    console.log();
    console.log(
      "  " + t.info("score  ") +
      (percent >= 70
        ? t.success(chalk.bold(`${percent}%`))
        : t.danger(chalk.bold(`${percent}%`))) +
      "   " +
      t.brand("streak  ") +
      t.hot(chalk.bold(`${streak} day${streak !== 1 ? "s" : ""}`))
    );

    // ── progress bar ──────────────────────────────
    console.log();
    const barLength = 30;
    const filled = Math.round((correct / total) * barLength);
    const empty = barLength - filled;
    const bar =
      t.success("█".repeat(filled)) +
      t.muted("░".repeat(empty));
    console.log("  " + bar + "  " + t.muted(`${percent}%`));

    // ── recent activity ───────────────────────────
    section("recent activity");

    recent.forEach((s) => {
      const date = new Date(s.date);
      const dateStr = date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });

      const icon = s.correct ? t.success("✓") : t.danger("✗");
      const fileName = path.basename(s.file);
      const q =
        s.question.length > 40
          ? s.question.slice(0, 40) + "..."
          : s.question;

      console.log(
        "  " + icon +
        "  " + t.white(fileName.padEnd(20)) +
        t.muted(dateStr.padEnd(20)) +
        t.muted(q)
      );
    });

    // ── top files ─────────────────────────────────
    if (topFiles.length > 0) {
      section("most quizzed files");

      topFiles.forEach(([file, count]) => {
        const fileName = path.basename(file);
        const fileScores = scores.filter((s) => s.file === file);
        const fileCorrect = fileScores.filter((s) => s.correct).length;
        const filePct = Math.round((fileCorrect / fileScores.length) * 100);
        const pctColor = filePct >= 70 ? t.success : t.danger;

        console.log(
          "  " + t.brand("◆") +
          "  " + t.white(fileName.padEnd(25)) +
          t.muted(`${count} quiz${count > 1 ? "zes" : ""}`.padEnd(12)) +
          pctColor(`${filePct}% correct`)
        );
      });
    }

    // ── footer ────────────────────────────────────
    console.log();
    console.log(
      "  " + t.muted("scores saved at") +
      " " + t.info(path.join(os.homedir(), ".explainit", "scores.json"))
    );
    console.log();
  });

// ─────────────────────────────────────────────────────────────
// 🔑 setup
// ─────────────────────────────────────────────────────────────
program
  .command("setup")
  .description("connect your Gemini API key")
  .action(() => {
    const CONFIG_DIR = path.join(os.homedir(), ".explainit");
    const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    showHeader();
    section("setup — gemini api key");

    console.log("  " + t.muted("get your free key at:"));
    console.log("  " + t.info("→") + " " + t.accent("https://aistudio.google.com/apikey"));
    console.log();
    console.log("  " + t.muted("steps:"));
    console.log("  " + t.muted("  1. sign in with google"));
    console.log("  " + t.muted("  2. click 'create api key in new project'"));
    console.log("  " + t.muted("  3. copy and paste below"));
    console.log();

    rl.question(
      "  " + t.brand("◆") + " " + t.white("paste your gemini key: "),
      (key) => {
        rl.close();

        if (!key.trim()) {
          console.log();
          console.log("  " + t.danger("✗") + " " + t.white("no key entered — try again"));
          console.log();
          return;
        }

        if (!key.trim().startsWith("AIzaSy")) {
          console.log();
          console.log(
            "  " + t.danger("✗") + " " + t.white("invalid key — gemini keys start with") +
            " " + t.hot("AIzaSy")
          );
          console.log();
          return;
        }

        if (!fs.existsSync(CONFIG_DIR)) {
          fs.mkdirSync(CONFIG_DIR, { recursive: true });
        }

        fs.writeFileSync(
          CONFIG_FILE,
          JSON.stringify({ apiKey: key.trim() }, null, 2)
        );

        console.log();
        console.log("  " + t.success("✓") + " " + t.white("api key saved!"));
        console.log(
          "  " + t.muted("you're all set — run") +
          " " + t.accent("explainit install") +
          " " + t.muted("to hook into git")
        );
        console.log();
      }
    );
  });

// ─────────────────────────────────────────────────────────────
// 🎉 install
// ─────────────────────────────────────────────────────────────
program
  .command("install")
  .description("hook into git — auto-quiz on every commit")
  .action(() => {
    const hookPath = path.resolve(".git/hooks/pre-commit");
    const projectPath = process.cwd().replace(/\\/g, "/");

    showHeader();
    section("installing git hook");

    if (!fs.existsSync(path.resolve(".git"))) {
      console.log(
        "  " + t.danger("✗") + " " + t.white("no git repo found — run") +
        " " + t.hot("git init") + " " + t.white("first")
      );
      console.log();
      process.exit(1);
    }

    const script = `#!/bin/sh

FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\\.(js|ts|jsx|tsx|py)$')

[ -z "$FILES" ] && exit 0

echo ""
echo "🧠 explainit — quick check before commit"
echo "──────────────────────────────────────────"

for FILE in $FILES; do
  node "${projectPath}/run-quiz.js" "$FILE"
done

exit 0
`;

    fs.writeFileSync(hookPath, script);
    fs.chmodSync(hookPath, "755");

    const runnerPath = path.resolve("run-quiz.js");
    const runner = `import { runQuiz } from './node_modules/explainit/lib/quiz.js';
const file = process.argv[2];
if (file) await runQuiz([file]);
`;
    fs.writeFileSync(runnerPath, runner);

    console.log("  " + t.success("✓") + " " + t.white("git hook installed"));
    console.log("  " + t.success("✓") + " " + t.white("run-quiz.js created"));
    console.log();
    console.log(
      "  " + t.brand("◆") + " " + t.white("every") +
      " " + t.accent("git commit") +
      " " + t.white("will now trigger a quiz automatically")
    );
    console.log();
  });

program.parse();