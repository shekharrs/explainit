import fs from "fs";
import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";
import { execSync } from "child_process";
import { generateOneQuestion, evaluateAnswer } from "./ai.js";

// function isLargeChange(filePath) {
//   try {
//     const diff = execSync(`git diff --cached --numstat -- "${filePath}`)
//       .toString()
//       .trim();

//     if (!diff) return false;

//     const [added] = diff.split("\t").map(Number);
//     return added > 10;
//   } catch {
//     return true;
//   }
// }
function isLargeChange(filePath) {
  try {
    const diff = execSync(`git diff --cached --numstat -- "${filePath}"`)
      .toString()
      .trim()

    if (!diff) return true // ⚠️ force question if unsure

    const [added] = diff.split('\t').map(Number)
    return added > 5 // reduce threshold for testing
  } catch {
    return true
  }
}

export async function runQuiz(files) {
  if (!files || files.length === 0) return true;

  for (const filePath of files) {
    // Skip if file doesn't exist
    if (!fs.existsSync(filePath)) continue;

    const stat = fs.statSync(filePath);

    // 🚫 Skip directories
    if (!stat.isFile()) continue;

    // Skip small changes
    if (!isLargeChange(filePath)) {
      console.log(chalk.gray(`  ✓ Small change — skipping ${filePath}`));
    //   continue;
    return true
    }

    const code = fs.readFileSync(filePath, "utf-8");

    const spinner = ora(
      chalk.cyan(`  Generating question for ${filePath}...`),
    ).start();

    let quiz;
    try {
      quiz = await generateOneQuestion(code);
      //   spinner.stop()
    } catch (err) {
      console.log(err);
      spinner.stop();
      console.log(chalk.gray("  Skipping (AI failed)\n"));
      return true;
    }

    console.log();
    console.log(chalk.cyan.bold(`  ${filePath}`));
    console.log(chalk.yellow(`  ${quiz.question}\n`));

    const { answer } = await inquirer.prompt([
      {
        type: "input",
        name: "answer",
        message: "Your answer:",
      },
    ]);

    // Allow skip
    if (!answer.trim()) {
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
      console.log(chalk.gray("  Could not evaluate — skipping\n"));
      continue;
    }

    if (result.correct) {
      console.log(chalk.green(`  ✓ ${result.explanation}\n`));
    } else {
      console.log(chalk.red(`  ✗ ${result.explanation}`));
      console.log(chalk.gray(`  → ${quiz.answer}\n`));
    }
  }

  return true;
}
