import fs from "fs";
import chalk from "chalk";
import ora from "ora";
import { execSync, spawnSync } from "child_process";
import { generateOneQuestion, evaluateAnswer } from "./ai.js";

// reads input directly from terminal — works in Windows git hooks
function readAnswerFromTerminal(question) {
  try {
    // write question to stderr (always shows in terminal)
    process.stderr.write(chalk.yellow(`  Your answer: `));

    // use powershell to read input on Windows
    const result = spawnSync(
      "powershell",
      ["-Command", "$input = Read-Host; Write-Output $input"],
      {
        stdio: ["inherit", "pipe", "inherit"],
        encoding: "utf-8",
        shell: false,
      }
    );

    return (result.stdout || "").trim();
  } catch {
    return "";
  }
}

function isLargeChange(filePath) {
  try {
    const diff = execSync(
      `git diff --cached --numstat -- "${filePath}"`,
      { encoding: "utf-8" }
    ).trim();

    if (!diff) return true;

    const added = parseInt(diff.split("\t")[0], 10);
    console.log(chalk.gray(`  Lines changed: ${added}`));
    return added > 3;
  } catch {
    return true;
  }
}

export async function runQuiz(files) {
  if (!files || files.length === 0) return true;

  for (const filePath of files) {
    if (!fs.existsSync(filePath)) continue;

    const stat = fs.statSync(filePath);
    if (!stat.isFile()) continue;

    if (!isLargeChange(filePath)) {
      console.log(chalk.gray(`  ✓ Small change — skipping ${filePath}\n`));
      continue;
    }

    const code = fs.readFileSync(filePath, "utf-8");

    const spinner = ora(chalk.cyan("  Generating question...")).start();

    let quiz;
    try {
      quiz = await generateOneQuestion(code);
      spinner.stop();
    } catch (err) {
      spinner.stop();
      console.log(chalk.red(`  AI failed: ${err.message}\n`));
      continue;
    }

    // show question
    console.log();
    console.log(chalk.cyan.bold(`  ${filePath}`));
    console.log(chalk.white(`  ${quiz.question}\n`));

    // get answer
    const answer = readAnswerFromTerminal(quiz.question);

    if (!answer) {
      console.log(chalk.gray("  Skipped\n"));
      continue;
    }

    const evalSpinner = ora("  Checking...").start();

    let result;
    try {
      result = await evaluateAnswer(quiz.question, quiz.answer, answer);
      evalSpinner.stop();
    } catch {
      evalSpinner.stop();
      console.log(chalk.gray("  Could not evaluate\n"));
      continue;
    }

    if (result.correct) {
      console.log(chalk.green(`\n  ✓ ${result.explanation}\n`));
    } else {
      console.log(chalk.red(`\n  ✗ ${result.explanation}`));
      console.log(chalk.gray(`  → ${quiz.answer}\n`));
    }
  }

  return true;
}