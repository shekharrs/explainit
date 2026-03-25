#!/usr/bin/env node

import { program } from 'commander'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'

program
  .name('explainit')
  .description('Quiz yourself on code before you commit it')
  .version('1.0.0')

// ── explainit check <file> ──────────────────────────────────────────
program
  .command('check <file>')
  .description('Read a file and print its contents')
  .action((file) => {

    // Step 1: check the file exists
    const filePath = path.resolve(file)

    if (!fs.existsSync(filePath)) {
      console.log(chalk.red(`\n  File not found: ${file}\n`))
      process.exit(1)
    }

    // Step 2: read the file
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')

    // Step 3: print a nice header
    console.log()
    console.log(chalk.bold.white('  explainit') + chalk.gray(' — do you understand this code?'))
    console.log(chalk.gray('  ─────────────────────────────────────'))
    console.log(chalk.cyan(`  File: `) + chalk.white(file))
    console.log(chalk.cyan(`  Lines: `) + chalk.white(lines.length))
    console.log(chalk.gray('  ─────────────────────────────────────'))
    console.log()

    // Step 4: print first 20 lines with line numbers
    console.log(chalk.gray('  Preview (first 20 lines):'))
    console.log()

    lines.slice(0, 20).forEach((line, i) => {
      const lineNum = chalk.gray(`  ${String(i + 1).padStart(3)} │ `)
      console.log(lineNum + chalk.white(line))
    })

    if (lines.length > 20) {
      console.log(chalk.gray(`\n  ... and ${lines.length - 20} more lines`))
    }

    console.log()
    console.log(chalk.green('  ✓ File read successfully!'))
    console.log(chalk.gray('  Next: Gemini will generate quiz questions from this file.\n'))
  })

// ── explainit stats ─────────────────────────────────────────────────
program
  .command('stats')
  .description('Show your quiz history and scores')
  .action(() => {
    console.log()
    console.log(chalk.bold.white('  explainit stats'))
    console.log(chalk.gray('  Coming in Week 3!\n'))
  })

program.parse()