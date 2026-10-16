<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=28&pause=1000&color=A78BFA&center=true&vCenter=true&width=435&lines=explainit" alt="explainit" />

[![npm version](https://img.shields.io/npm/v/explainit?color=A78BFA&style=flat-square&logo=npm)](https://www.npmjs.com/package/explainit)
[![npm downloads](https://img.shields.io/npm/dm/explainit?color=34D399&style=flat-square&logo=npm)](https://www.npmjs.com/package/explainit)
[![license](https://img.shields.io/npm/l/explainit?color=FB923C&style=flat-square)](./LICENSE)
[![Node.js](https://img.shields.io/node/v/explainit?color=60A5FA&style=flat-square&logo=node.js)](https://nodejs.org)
[![GitHub stars](https://img.shields.io/github/stars/shekharrs/explainit?color=A78BFA&style=flat-square&logo=github)](https://github.com/shekharrs/explainit/stargazers)

### Understand your code before you ship it.

**Quiz your staged Git changes, understand AI-generated code, and generate clear commit messages.**

</div>

`explainit` adds a lightweight understanding check to your Git workflow. It reads your staged changes, generates a short multiple-choice question in the terminal, and helps you review what you are about to commit.

## Table of contents

- [The problem](#the-problem)
- [Features](#features)
- [Requirements](#requirements)
- [Quick start](#quick-start)
- [How it works](#how-it-works)
- [Usage](#usage)
- [Command reference](#command-reference)
- [Tracking your progress](#tracking-your-progress)
- [API key and privacy](#api-key-and-privacy)
- [Project structure](#project-structure)
- [Technology stack](#technology-stack)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [Issues and support](#issues-and-support)
- [License](#license)

## The problem

AI coding tools can generate working code quickly, but working code is not always code you fully understand. When a change causes problems later, it can be hard to remember why a particular implementation was added.

`explainit` helps you pause and review your changes before they become part of your codebase.

## Features

- **Quiz staged changes**: generate a short multiple-choice question from your staged Git diff.
- **Explain code changes**: get a readable summary of changes, key decisions, and potential concerns.
- **Generate commit messages**: create a commit message from the staged diff.
- **Track quiz progress**: view previous quiz results and your score history.
- **Scan a file**: inspect a file and view its line statistics.

> The quiz is a check on your own understanding. It does not replace tests, code review, or security checks.

## Requirements

- Node.js and npm (see the Node.js badge above for the supported version)
- Git
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

## Quick start

Follow these four steps to set up `explainit` in a Git repository.

### Step 1: Install explainit

Install the package globally with npm:

```bash
npm install -g explainit
```

Check that the command is available:

```bash
explainit --help
```

### Step 2: Get a Gemini API key

1. Open [Google AI Studio](https://aistudio.google.com/apikey) and sign in with your Google account.
2. Select **Create API key in new project**.
3. Copy the generated key.

> Gemini API access, quotas, and pricing vary by account and may change. Check Google's current terms in AI Studio before use.

### Step 3: Connect your API key

Run the setup command and follow the prompts:

```bash
explainit setup
```

Example output:

```text
Setup — Gemini API key
--------------------------------------------
Get your API key at:
https://aistudio.google.com/apikey

Steps:
  1. Sign in with Google
  2. Select "Create API key in new project"
  3. Copy and paste the key below

Paste your Gemini API key: [input hidden]

API key saved.
You're all set — run explainit install to connect it to Git.
```

The key is stored locally in `~/.explainit/config.json`.

> **Security note:** the key is stored as plain text. Keep the file private (for example, `chmod 600 ~/.explainit/config.json` on macOS/Linux) and never share it in logs, screenshots, or issue reports.

### Step 4: Connect explainit to Git

From the repository where you want the automatic quiz, run:

```bash
explainit install
```

Example output:

```text
Installing Git hook
--------------------------------------------
Git hook installed
run-quiz.js created

Every Git commit can now trigger a quick understanding check.
```

You are ready to go. Stage your changes and commit as usual:

```bash
git add .
git commit -m "describe your changes"
```

During the pre-commit step, `explainit` asks a short question. Answer it, or enter `s` to skip. The hook does not block your commit.

To bypass all Git hooks for a single commit, use Git's standard flag:

```bash
git commit --no-verify -m "describe your changes"
```

## How it works

1. You stage changes with `git add`.
2. `explainit` reads the staged diff using `git diff --cached`.
3. If the Git hook is installed, a short quiz is shown during the pre-commit step.
4. You answer the question or skip it, and the commit proceeds.

The quiz may skip small changes and documentation-only edits.

```text
Install explainit
       |
       v
Configure the Gemini API key
       |
       v
Install the Git hook in your repository
       |
       v
Make changes and stage files
       |
       v
Commit your changes
       |
       v
explainit reviews the staged diff
       |
       v
Answer the quiz or skip it
       |
       v
The commit proceeds
```

## Usage

You can run commands directly instead of relying only on the Git hook.

Explain your staged changes:

```bash
explainit explain
```

Explain a specific file:

```bash
explainit explain src/auth.js
```

Generate a commit message from the staged diff:

```bash
explainit msg
```

Run a quiz on your staged changes:

```bash
explainit quiz
```

Run a quiz on a specific file:

```bash
explainit quiz src/auth.js
```

View your quiz history:

```bash
explainit score
```

## Command reference

| Command                  | Alias | Description                                                    |
| ------------------------ | ----- | -------------------------------------------------------------- |
| `explainit setup`        | n/a   | Configure your Gemini API key.                                 |
| `explainit install`      | n/a   | Install the Git hook for the current repository.               |
| `explainit explain [file]` | `exp` | Explain staged changes or a specific file, including key decisions and potential risks. |
| `explainit msg`          | `m`   | Generate a commit message from the staged diff.                |
| `explainit quiz [file]`  | `q`   | Quiz yourself on staged changes or a specified file.           |
| `explainit score`        | `sc`  | View quiz results, history, and streak information.            |
| `explainit scan <file>`  | `s`   | Preview a file and its line statistics.                        |

Run `explainit --help` to see the commands and aliases available in your installed version.

## Tracking your progress

```bash
explainit score
```

The `score` command shows your quiz history and progress, including correct and incorrect answers and streak information.

## API key and privacy

`explainit` uses a bring-your-own-key model: each user configures their own Gemini API key.

- Your API key is stored locally in `~/.explainit/config.json`.
- AI-powered features may send staged diffs or file content to the Gemini API to generate questions, explanations, or commit messages.
- Avoid using the tool on confidential or sensitive code unless your organization's policies allow sending that content to the configured AI provider.
- Never share your API key in logs, screenshots, or issue reports.
- Gemini API quotas and pricing can change. Consult Google's current documentation.

## Project structure

```text
explainit/
├── bin/
│   └── explainit.js    # CLI entry point and commands
├── lib/
│   ├── ai.js           # Gemini API integration
│   ├── diff.js         # Staged Git diff processing
│   ├── quiz.js         # Quiz prompts and answer checking
│   └── scores.js       # Quiz history and streak tracking
├── run-quiz.js         # Git hook bridge, created during install
└── package.json
```

## Technology stack

| Technology                                       | Purpose                                         |
| ------------------------------------------------ | ----------------------------------------------- |
| [Node.js](https://nodejs.org)                    | JavaScript runtime                              |
| [Commander.js](https://github.com/tj/commander.js) | Command-line interface                        |
| [Gemini API](https://ai.google.dev)              | Quiz questions, explanations, and commit messages |
| [Chalk](https://github.com/chalk/chalk)          | Terminal output styling                         |
| [Ora](https://github.com/sindresorhus/ora)       | Terminal spinner                                |

## Troubleshooting

### `explainit` is not recognized

Reinstall the package:

```bash
npm install -g explainit
```

Restart your terminal and run `explainit --help`. If the command is still unavailable, check that npm's global executable directory is in your `PATH`.

### The API key is missing or invalid

Run setup again:

```bash
explainit setup
```

Check that the key was copied correctly and that your Gemini API access is enabled.

### The quiz does not reflect my changes

The quiz uses staged changes. Check what is staged and add the files you want to review:

```bash
git status
git add <file>
git diff --cached
explainit quiz
```

### The Git hook does not run

Run the install command from the repository where you want the hook enabled:

```bash
explainit install
```

Then check your Git hook configuration and read any messages printed by `explainit`.

## Development

To work on the project locally:

```bash
git clone https://github.com/shekharrs/explainit.git
cd explainit
npm install
npm link
```

`npm link` links your local checkout so you can run the development version as a global command. Verify it with:

```bash
explainit --help
```

## Contributing

Contributions, bug reports, and feature requests are welcome.

1. Fork the repository.
2. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature
   ```

3. Make and test your changes.
4. Commit your changes:

   ```bash
   git commit -m "describe your changes"
   ```

5. Push the branch and open a pull request.

When reporting a bug, include your operating system, Node.js version, the command you ran, and the relevant error output. Remove API keys and sensitive code before sharing logs.

## Roadmap

- [ ] Model Context Protocol (MCP) support for AI coding environments
- [ ] Visual Studio Code extension
- [ ] Team leaderboard
- [ ] Optional strict mode with additional commit controls

## Issues and support

Found a bug or have a feature request? [Open an issue on GitHub](https://github.com/shekharrs/explainit/issues).

## License

MIT. See the [LICENSE](./LICENSE) file.

<div align="center">

Built for developers who want to understand the code they ship.

[GitHub repository](https://github.com/shekharrs/explainit) · [npm package](https://www.npmjs.com/package/explainit)

</div>