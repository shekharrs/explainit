#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import os from "os";
import readline from "readline";
import { readScores, getStreak } from "../lib/scores.js";
import { runQuiz } from "../lib/quiz.js";
import {
  getStagedDiff,
  getWorkingDiff,
  getStagedFiles,
  trimDiff,
} from "../lib/diff.js";
import {
  explainDiffContent,
  generateCommitMessage,
  saveKey,
} from "../lib/ai.js";

const program = new Command();

const pkg = JSON.parse(
  fs.readFileSync(new URL("../package.json", import.meta.url), "utf-8")
);

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
function showHeader(compact = false) {
  if (!compact) {
    console.log();
    console.log(t.brand("  ███████╗██╗  ██╗██████╗ ██╗      █████╗ ██╗███╗   ██╗██╗████████╗"));
    console.log(t.brand("  ██╔════╝╚██╗██╔╝██╔══██╗██║     ██╔══██╗██║████╗  ██║██║╚══██╔══╝"));
    console.log(t.accent("  █████╗   ╚███╔╝ ██████╔╝██║     ███████║██║██╔██╗ ██║██║   ██║   "));
    console.log(t.accent("  ██╔══╝   ██╔██╗ ██╔═══╝ ██║     ██╔══██║██║██║╚██╗██║██║   ██║   "));
    console.log(t.hot("  ███████╗██╔╝ ██╗██║     ███████╗██║  ██║██║██║ ╚████║██║   ██║   "));
    console.log(t.hot("  ╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝   "));
    console.log();
    console.log(t.muted("  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄"));
  }
  console.log(
    "  " + t.brand("🧠 explainit") +
    t.muted("  ·  ") + t.accent("understand your code") +
    t.muted("  ·  ") + t.info(`v${pkg.version}`)
  );
  if (!compact) {
    console.log(t.muted("  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄"));
    console.log();
  }
}

function section(title) {
  console.log();
  console.log("  " + t.brand("▸") + " " + t.white(chalk.bold(title)));
  console.log("  " + t.muted("─".repeat(44)));
}

function row(icon, label, value = "") {
  console.log("  " + icon + "  " + t.white(label.padEnd(20)) + t.muted(value));
}

// ─────────────────────────────────────────────────────────────
// ⚙️  CLI SETUP
// ─────────────────────────────────────────────────────────────
program
  .name("explainit")
  .usage("[command] [options]")
  .description(t.brand("🧠 test your code comprehension before it ships"))
  .version(t.accent(pkg.version), "-V, --version");

const COMMAND_HELP_MAP = {
  explain: { name: "explain|exp", args: "[file name]" },
  msg:     { name: "msg|m",        args: "" },
  quiz:    { name: "quiz|q",       args: "[file name]" },
  score:   { name: "score|sc",     args: "" },
  scan:    { name: "scan|s",       args: "<file name>" },
  setup:   { name: "setup",        args: "" },
  install: { name: "install",      args: "" },
  help:    { name: "help",         args: "[command]" },
};

program.configureHelp({
  helpWidth: 105,
  styleTitle: (str) => t.brand(chalk.bold(str)),
  styleOptionTerm: (term) => t.accent(term),
  styleOptionDescription: (desc) => t.white(desc),
  subcommandTerm: (cmd) => {
    const info = COMMAND_HELP_MAP[cmd.name()];
    if (!info) return cmd.name();
    const prefix = t.brand("explainit ");
    const name = t.accent(chalk.bold(info.name));
    const args = info.args ? " " + t.hot(info.args) : "";
    return prefix + name + args;
  },
  styleSubcommandDescription: (desc) => t.white(desc),
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
    "  " + t.brand("✦") + "  " + t.white(chalk.bold("examples")),
    "",
    "  " + t.muted("$") + "  " + t.accent("explainit explain") + t.muted("          # break down staged changes and risks"),
    "  " + t.muted("$") + "  " + t.accent("git commit -m \"$(explainit msg)\"") + t.muted(" # auto conventional commit"),
    "  " + t.muted("$") + "  " + t.accent("explainit quiz") + t.muted("             # run 1-key comprehension check"),
    "  " + t.muted("$") + "  " + t.accent("explainit score") + t.muted("            # check your stats and streak"),
    "  " + t.muted("$") + "  " + t.accent("explainit scan <file>") + t.muted("       # preview a file and inspect line stats"),
    "",
  ].join("\n")
);

// ─────────────────────────────────────────────────────────────
// 🔍 explain (Flow B)
// ─────────────────────────────────────────────────────────────
program
  .command("explain [file]")
  .alias("exp")
  .description("break down staged changes, key decisions, and risks")
  .action(async (file) => {
    showHeader(true);

    let diff = "";
    let contextTitle = "";

    if (file) {
      const filePath = path.resolve(file);
      if (!fs.existsSync(filePath)) {
        console.log("  " + t.danger("✗") + " " + t.white("file not found:") + " " + t.hot(file));
        console.log();
        process.exit(1);
      }
      diff = getStagedDiff(file) || getWorkingDiff(file);
      if (!diff) {
        diff = fs.readFileSync(filePath, "utf-8");
      }
      contextTitle = file;
    } else {
      diff = getStagedDiff();
      contextTitle = "staged changes";
      if (!diff) {
        diff = getWorkingDiff();
        contextTitle = "unstaged working changes";
      }
    }

    if (!diff || diff.trim().length < 10) {
      console.log("  " + t.brand("◆") + " " + t.white("No code changes detected."));
      console.log(
        "    " + t.muted("Stage files with") + " " + t.accent("git add <file>") +
        " " + t.muted("or specify a file:") + " " + t.accent("explainit explain <file>")
      );
      console.log();
      return;
    }

    try {
      const explanation = await explainDiffContent(trimDiff(diff, 6000), contextTitle);

      if (!explanation) {
        console.log("  " + t.danger("✗") + " " + t.white("Could not generate explanation."));
        console.log();
        return;
      }

      section(`what changed — ${contextTitle}`);

      if (explanation.summary) {
        console.log("  " + t.accent("◆ Summary: ") + t.white(explanation.summary));
        console.log();
      }

      if (Array.isArray(explanation.details) && explanation.details.length > 0) {
        console.log("  " + t.brand("◆ What it does:"));
        explanation.details.forEach((item) => {
          console.log("    " + t.info("→") + " " + t.white(item));
        });
        console.log();
      }

      if (Array.isArray(explanation.watchOut) && explanation.watchOut.length > 0) {
        console.log("  " + t.hot("◆ Watch out for:"));
        explanation.watchOut.forEach((item) => {
          console.log("    " + t.hot("→") + " " + t.white(item));
        });
        console.log();
      }
    } catch (err) {
      console.log("  " + t.danger("✗") + " " + t.white(`Failed to explain: ${err.message}`));
      console.log();
    }
  });

// ─────────────────────────────────────────────────────────────
// ✍️ msg (Flow C)
// ─────────────────────────────────────────────────────────────
program
  .command("msg")
  .alias("m")
  .description("generate a conventional commit message from diff")
  .action(async () => {
    let diff = getStagedDiff();
    if (!diff) {
      diff = getWorkingDiff();
    }

    if (!diff || diff.trim().length < 10) {
      process.stdout.write("update: working changes\n");
      return;
    }

    try {
      const commitMsg = await generateCommitMessage(trimDiff(diff, 6000));
      process.stdout.write(commitMsg + "\n");
    } catch {
      process.stdout.write("update: working changes\n");
    }
  });

// ─────────────────────────────────────────────────────────────
// 🧠 quiz (Flow A)
// ─────────────────────────────────────────────────────────────
program
  .command("quiz [file]")
  .alias("q")
  .description("quiz yourself on staged changes or a file")
  .action(async (file) => {
    showHeader(true);
    const files = file ? [file] : null;
    await runQuiz(files, true);
  });

// ─────────────────────────────────────────────────────────────
// ⚡ pre-commit hook runner
// ─────────────────────────────────────────────────────────────
program
  .command("pre-commit", { hidden: true })
  .description("internal runner for pre-commit git hook")
  .action(async () => {
    await runQuiz(null, false);
    process.exit(0);
  });

// ─────────────────────────────────────────────────────────────
// 📊 score
// ─────────────────────────────────────────────────────────────
function getExistingFilePath(filePath) {
  if (!filePath) return null;
  const rel = path.resolve(process.cwd(), filePath);
  if (fs.existsSync(rel) && fs.statSync(rel).isFile()) {
    return path.relative(process.cwd(), rel).replace(/\\/g, "/");
  }
  if (path.isAbsolute(filePath) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const fromCwd = path.relative(process.cwd(), filePath).replace(/\\/g, "/");
    if (!fromCwd.startsWith("..")) {
      return fromCwd;
    }
  }
  return null;
}

program
  .command("score")
  .alias("sc")
  .option("-a, --all", "show all history including deleted or external files")
  .description("view your quiz history and score")
  .action((options) => {
    showHeader(true);
    section("your stats");

    const allScores = readScores();

    // Dynamically filter to only include files that currently exist in the codebase
    const scores = options.all
      ? allScores
      : allScores
          .map((s) => ({
            ...s,
            resolvedPath: getExistingFilePath(s.file),
          }))
          .filter((s) => s.resolvedPath !== null);

    if (!scores.length) {
      console.log("  " + t.muted("no checks for current codebase yet — make a commit or run explainit quiz! 🚀"));
      console.log();
      return;
    }

    const total = scores.length;
    const correct = scores.filter((s) => s.correct).length;
    const incorrect = total - correct;
    const percent = Math.round((correct / total) * 100);
    const streak = getStreak(scores);

    const recent = scores.slice(-5).reverse();

    const fileCounts = {};
    scores.forEach((s) => {
      const displayFile = s.resolvedPath || s.file.replace(/\\/g, "/");
      fileCounts[displayFile] = (fileCounts[displayFile] || 0) + 1;
    });
    const topFiles = Object.entries(fileCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    console.log();
    console.log(
      "  " + t.brand("total checks   ") +
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

    console.log();
    const barLength = 30;
    const filled = Math.round((correct / total) * barLength);
    const empty = barLength - filled;
    const bar =
      t.success("█".repeat(filled)) +
      t.muted("░".repeat(empty));
    console.log("  " + bar + "  " + t.muted(`${percent}%`));

    section("recent checks");

    recent.forEach((s) => {
      const date = new Date(s.date);
      const dateStr = date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });

      const icon = s.correct ? t.success("✓") : t.danger("✗");
      const displayFile = s.resolvedPath || path.basename(s.file);
      const q =
        s.question && s.question.length > 40
          ? s.question.slice(0, 40) + "..."
          : s.question || "Code comprehension check";

      console.log(
        "  " + icon +
        "  " + t.white(displayFile.padEnd(20)) +
        t.muted(dateStr.padEnd(20)) +
        t.muted(q)
      );
    });

    if (topFiles.length > 0) {
      section("most checked files");

      topFiles.forEach(([displayFile, count]) => {
        const fileScores = scores.filter((s) => (s.resolvedPath || s.file.replace(/\\/g, "/")) === displayFile);
        const fileCorrect = fileScores.filter((s) => s.correct).length;
        const filePct = Math.round((fileCorrect / fileScores.length) * 100);
        const pctColor = filePct >= 70 ? t.success : t.danger;

        console.log(
          "  " + t.brand("◆") +
          "  " + t.white(displayFile.padEnd(25)) +
          t.muted(`${count} check${count > 1 ? "s" : ""}`.padEnd(12)) +
          pctColor(`${filePct}% correct`)
        );
      });
    }

    console.log();
    console.log(
      "  " + t.muted("scores saved at") +
      " " + t.info(path.join(os.homedir(), ".explainit", "scores.json"))
    );
    console.log();
  });

// ─────────────────────────────────────────────────────────────
// 🔍 scan
// ─────────────────────────────────────────────────────────────
program
  .command("scan <file>")
  .alias("s")
  .description("preview a file and inspect line stats")
  .action((file) => {
    showHeader(true);

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
      "  " + t.muted("→") + "  " + t.accent("explainit explain " + file)
    );
    console.log();
  });

// ─────────────────────────────────────────────────────────────
// 🔑 setup
// ─────────────────────────────────────────────────────────────
program
  .command("setup")
  .description("connect your free Gemini API key")
  .action(() => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    showHeader(true);
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

        saveKey(key.trim());

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
  .description("hook into git — auto-check on every commit")
  .action(() => {
    showHeader(true);
    section("installing git hook");

    if (!fs.existsSync(path.resolve(".git"))) {
      console.log(
        "  " + t.danger("✗") + " " + t.white("no git repo found — run") +
        " " + t.hot("git init") + " " + t.white("first")
      );
      console.log();
      process.exit(1);
    }

    const hooksDir = path.resolve(".git/hooks");
    if (!fs.existsSync(hooksDir)) {
      fs.mkdirSync(hooksDir, { recursive: true });
    }

    const hookPath = path.join(hooksDir, "pre-commit");

    // Clean, robust shell script that invokes explainit directly
    const script = `#!/bin/sh
# explainit pre-commit hook

# Reconnect stdin to the terminal if running in an interactive terminal
if [ -t 1 ]; then
  exec </dev/tty
fi

if command -v explainit >/dev/null 2>&1; then
  explainit pre-commit
elif [ -f "./bin/explainit.js" ]; then
  node "./bin/explainit.js" pre-commit
elif command -v npx >/dev/null 2>&1; then
  npx --no-install explainit pre-commit 2>/dev/null || true
fi

exit 0
`;

    fs.writeFileSync(hookPath, script, { mode: 0o755 });
    try {
      fs.chmodSync(hookPath, "755");
    } catch {}

    console.log("  " + t.success("✓") + " " + t.white("git hook installed at .git/hooks/pre-commit"));
    console.log();
    console.log(
      "  " + t.brand("◆") + " " + t.white("every") +
      " " + t.accent("git commit") +
      " " + t.white("will now trigger a quick comprehension check")
    );
    console.log();
  });

program.parse();