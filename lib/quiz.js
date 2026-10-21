import fs from "fs";
import readline from "readline";
import chalk from "chalk";
import {
  getStagedFiles,
  getStagedDiff,
  getWorkingDiff,
  trimDiff,
  isIgnoredFile,
} from "./diff.js";
import { generateMCQQuestion } from "./ai.js";
import { saveScore } from "./scores.js";

/**
 * Cross-platform 1-key terminal reader.
 * Works on macOS, Linux, and Windows without external shell spawning.
 */
export async function readSingleKey(allowedKeys = ["1", "2", "3", "s"]) {
  const normalizedAllowed = allowedKeys.map((k) => k.toLowerCase());

  // Non-interactive fallback: In GUI Git clients (e.g. VS Code GUI, GitHub Desktop)
  // stdin is not a live terminal, so skip gracefully to prevent freezing the commit.
  if (!process.stdin.isTTY) {
    return "s";
  }

  return new Promise((resolve) => {
    readline.emitKeypressEvents(process.stdin);
    const wasRaw = process.stdin.isRaw;
    try {
      process.stdin.setRawMode(true);
    } catch {}
    process.stdin.resume();

    const onKeypress = (str, key) => {
      // Allow user to exit with Ctrl+C
      if (key && key.ctrl && key.name === "c") {
        try {
          process.stdin.setRawMode(wasRaw);
        } catch {}
        process.stdin.removeListener("keypress", onKeypress);
        process.stdin.pause();
        process.exit(0);
      }

      const input = (str || "").toLowerCase();
      if (normalizedAllowed.includes(input)) {
        try {
          process.stdin.setRawMode(wasRaw);
        } catch {}
        process.stdin.removeListener("keypress", onKeypress);
        process.stdin.pause();
        process.stderr.write(str + "\n");
        resolve(input);
      }
    };

    process.stdin.on("keypress", onKeypress);
  });
}

/**
 * Run quiz on staged changes or specified file paths
 */
export async function runQuiz(files = null, isExplicitCommand = false) {
  let targetFiles = [];

  if (files && files.length > 0) {
    targetFiles = files.map((f) => ({
      file: f,
      totalChanged: 10, // explicit file
    }));
  } else {
    targetFiles = getStagedFiles();
  }

  if (targetFiles.length === 0) {
    if (isExplicitCommand) {
      console.log(
        chalk.hex("#A78BFA")("  ◆ ") +
          chalk.white("No staged changes found to quiz.")
      );
      console.log(
        chalk.gray("    Stage files with ") +
          chalk.hex("#34D399")("git add <file>") +
          chalk.gray(" or specify a file: ") +
          chalk.hex("#34D399")("explainit quiz <file>\n")
      );
    }
    return true;
  }

  // Prioritize the most significantly changed file
  const validFiles = targetFiles
    .filter((item) => !isIgnoredFile(item.file))
    .sort((a, b) => (b.totalChanged || 0) - (a.totalChanged || 0));

  if (validFiles.length === 0) {
    return true;
  }

  const otherFilesCount = Math.max(0, validFiles.length - 1);

  // Ask strictly ONE question per commit on the most impactful file
  for (const item of validFiles) {
    const filePath = item.file;

    // Get diff
    let diff = getStagedDiff(filePath);
    if (!diff && fs.existsSync(filePath)) {
      diff = getWorkingDiff(filePath);
      if (!diff) {
        // Fallback to file contents if no git diff
        diff = fs.readFileSync(filePath, "utf-8");
      }
    }

    if (!diff || diff.trim().length < 20) {
      continue;
    }

    // Render header immediately for instant user feedback
    process.stderr.write("\n");
    process.stderr.write(
      chalk.hex("#A78BFA").bold("  🧠 explainit — quick check before commit\n")
    );
    process.stderr.write(
      chalk.gray("  ──────────────────────────────────────────\n")
    );

    const otherBadge =
      otherFilesCount > 0
        ? chalk.gray(` (+${otherFilesCount} other file${otherFilesCount > 1 ? "s" : ""})`)
        : "";

    process.stderr.write(
      chalk.hex("#34D399").bold(`  ${filePath}`) +
        (item.totalChanged ? chalk.gray(` — ${item.totalChanged} lines changed`) : "") +
        otherBadge +
        "\n"
    );

    const trimmedDiff = trimDiff(diff, 5000);
    const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    let frameIdx = 0;
    const isTTY = Boolean(process.stderr.isTTY);
    let spinTimer = null;

    if (isTTY) {
      spinTimer = setInterval(() => {
        process.stderr.write(
          chalk.hex("#A78BFA")(`  ${spinnerFrames[frameIdx]} `) +
            chalk.gray("Generating quiz question...") +
            "\r"
        );
        frameIdx = (frameIdx + 1) % spinnerFrames.length;
      }, 80);
    }

    let quiz = null;
    try {
      quiz = await generateMCQQuestion(trimmedDiff, filePath);
    } catch (err) {
      if (spinTimer) clearInterval(spinTimer);
      if (isTTY) process.stderr.write("                                          \r");
      process.stderr.write(
        chalk.hex("#F87171")(`  AI check failed: ${err.message}\n\n`)
      );
      continue;
    }

    if (spinTimer) clearInterval(spinTimer);
    if (isTTY) process.stderr.write("                                          \r");

    if (!quiz || !quiz.question || !Array.isArray(quiz.options)) {
      continue;
    }

    if (quiz.observation) {
      process.stderr.write(
        chalk.hex("#FB923C")("  Diff note: ") +
          chalk.white(quiz.observation) +
          "\n"
      );
    }

    process.stderr.write(chalk.white(`\n  ${quiz.question}\n\n`));

    // Render options
    quiz.options.forEach((opt, idx) => {
      const num = chalk.hex("#A78BFA")(`  [${idx + 1}] `);
      process.stderr.write(`${num}${chalk.white(opt)}\n`);
    });
    process.stderr.write(chalk.gray("  [s]  Skip\n\n"));

    process.stderr.write(chalk.hex("#FB923C")("  Your choice (1-3/s): "));

    const choice = await readSingleKey(["1", "2", "3", "s"]);

    if (choice === "s") {
      process.stderr.write(chalk.gray("  Skipped\n\n"));
      break; // Only 1 question per commit
    }

    const chosenNum = parseInt(choice, 10);
    const isCorrect = chosenNum === quiz.correctIndex;

    saveScore({
      file: filePath,
      correct: isCorrect,
      question: quiz.question,
    });

    if (isCorrect) {
      process.stderr.write(
        chalk.hex("#4ADE80").bold(`\n  ✓ Exactly right`) +
          chalk.white(` — ${quiz.explanation}\n\n`)
      );
    } else {
      const correctText = quiz.options[quiz.correctIndex - 1] || "";
      process.stderr.write(
        chalk.hex("#F87171").bold(`\n  ✗ Not quite`) +
          chalk.gray(` — Option [${quiz.correctIndex}] was correct:\n`) +
          chalk.white(`    "${correctText}"\n`) +
          chalk.gray(`  → ${quiz.explanation}\n\n`)
      );
    }

    // Finished the 1 question for this commit
    break;
  }

  return true;
}
