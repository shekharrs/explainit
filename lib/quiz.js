import fs from 'fs'
import chalk from 'chalk'
import inquirer from 'inquirer'
import ora from 'ora'
import { execSync } from 'child_process'
import { generateOneQuestion, evaluateAnswer } from './ai.js'

function isLargeChange(filePath) {
  try {
    const diff = execSync(`git diff --cached --numstat ${filePath}`)
      .toString().trim()

    if (!diff) return false

    const [added] = diff.split('\t').map(Number)
    return added > 10
  } catch {
    return true
  }
}

export async function runQuiz(filePath) {
  if (!fs.existsSync(filePath)) return true

  if (!isLargeChange(filePath)) {
    console.log(chalk.gray(`  ✓ Small change — skipping ${filePath}`))
    return true
  }

  const code = fs.readFileSync(filePath, 'utf-8')

  const spinner = ora(`  Generating question...`).start()

  let quiz
  try {
    quiz = await generateOneQuestion(code)
    spinner.stop()
  } catch {
    spinner.stop()
    console.log(chalk.gray('  Skipping (AI failed)\n'))
    return true
  }

  console.log()
  console.log(chalk.cyan.bold(`  ${filePath}`))
  console.log(chalk.yellow(`  ${quiz.question}\n`))

  const { answer } = await inquirer.prompt([
    { type: 'input', name: 'answer', message: 'Your answer:' }
  ])

  if (!answer.trim()) {
    console.log(chalk.gray('  Skipped\n'))
    return true
  }

  const evalSpinner = ora('  Checking...').start()

  let result
  try {
    result = await evaluateAnswer(quiz.question, quiz.answer, answer)
    evalSpinner.stop()
  } catch {
    evalSpinner.stop()
    return true
  }

  if (result.correct) {
    console.log(chalk.green(`  ✓ ${result.explanation}\n`))
  } else {
    console.log(chalk.red(`  ✗ ${result.explanation}`))
    console.log(chalk.gray(`  → ${quiz.answer}\n`))
  }

  return true
}