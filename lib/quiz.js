import fs from "fs";
import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";
import { execSync } from "child_process";
import { generateOneQuestion, evaluateAnswer } from "./ai.js";

function isLargeChange(filePath) {
  try {
    const diff = execSync(
      `git diff --cached --numstat -- "${filePath}"`,
      { encoding: 'utf-8' }
    ).trim()

    if (!diff) return true

    const added = parseInt(diff.split('\t')[0], 10)
    console.log(chalk.gray(`  Lines changed: ${added}`))
    return added > 3

  } catch {
    return true
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

    const spinner = ora(
      chalk.cyan(`  Reading ${filePath}...`)
    ).start();

    let quiz;
    try {
      quiz = await generateOneQuestion(code);
      spinner.stop();  // ← must stop before printing question
    } catch (err) {
      spinner.stop();
      console.log(chalk.red(`  AI failed: ${err.message}\n`));
      return true;
    }

    // print question clearly
    console.log()
    console.log(chalk.cyan.bold(`  ${filePath}`))
    console.log(chalk.white(`  ${quiz.question}\n`))

    const { answer } = await inquirer.prompt([{
      type: "input",
      name: "answer",
      prefix: " ",
      message: chalk.yellow("Your answer:"),
    }]);

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
      console.log(chalk.gray("  Could not evaluate\n"));
      continue;
    }

    if (result.correct) {
      console.log(chalk.green(`  ✓ ${result.explanation}\n`));
    } else {
      console.log(chalk.red(`  ✗ ${result.explanation}`));
      console.log(chalk.gray(`  → Correct answer: ${quiz.answer}\n`));
    }
  }

  return true;
}