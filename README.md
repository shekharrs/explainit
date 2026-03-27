# explainit

> Quiz yourself on code before you commit it.

41% of code today is AI-generated. Most developers commit it without understanding it.
explainit sits in your git workflow and asks you one quick question before every commit.

## install
```bash
npm install -g explainit
```

## setup

Get a free Gemini API key at https://aistudio.google.com/apikey then run:
```bash
explainit setup
```

## hook into git
```bash
explainit install
```

That's it. Every `git commit` will now trigger a quick quiz on your changed files.

## commands

| command | description |
|---|---|
| `explainit setup` | save your Gemini API key |
| `explainit install` | hook into git |
| `explainit scan <file>` | preview a file |
| `explainit quiz <file>` | quiz yourself manually |
| `explainit score` | view your progress |

## how it works

1. You stage files with `git add`
2. You run `git commit`
3. explainit detects changed files
4. Gemini generates 1 question about your code
5. You answer in the terminal
6. Commit goes through — you just learned something

## license

MIT