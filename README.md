<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=28&pause=1000&color=A78BFA&center=true&vCenter=true&width=435&lines=explainit" alt="explainit" />

<br />
<br />

[![npm version](https://img.shields.io/npm/v/explainit?color=A78BFA&style=flat-square&logo=npm)](https://www.npmjs.com/package/explainit)
[![npm downloads](https://img.shields.io/npm/dm/explainit?color=34D399&style=flat-square&logo=npm)](https://www.npmjs.com/package/explainit)
[![license](https://img.shields.io/npm/l/explainit?color=FB923C&style=flat-square)](./LICENSE)
[![node](https://img.shields.io/node/v/explainit?color=60A5FA&style=flat-square&logo=node.js)](https://nodejs.org)
[![stars](https://img.shields.io/github/stars/shekharrs/explainit?color=A78BFA&style=flat-square&logo=github)](https://github.com/shekharrs/explainit/stargazers)

<br/>

<p align="center">
  <b>41% of code written today is AI-generated.</b><br/>
  Most developers commit it without understanding it.<br/>
  <br/>
  <code>explainit</code> sits in your git workflow and asks you <b>one question</b> before every commit.<br/>
  No setup friction. No workflow changes. Just accountability.
</p>

<br/>

</div>

---

## 🎯 the problem
```bash
# you copy this from ChatGPT
function generateToken(user, secret, expiresIn) {
  return jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn })
}

# it works. you commit it.
git commit -m "add auth"

# 6 months later — production is down.
# nobody can explain what expiresIn does.
# including you.
```

**explainit fixes this.**

---

## ✨ how it works
```bash
git add .
git commit -m "add auth"
```
```
🧠 explainit — quick check before commit
──────────────────────────────────────────
  lib/auth.js — 18 lines changed

  What does the expiresIn parameter control in generateToken?

  Your answer: it sets how long the JWT token stays valid

  ✓ Exactly right — expiresIn defines the token lifetime in seconds.
    A high value means stolen tokens stay valid longer.

[main 3f2a1] add auth
```

One question. Fifteen seconds. You just learned something about the code you're shipping.

---

## 🚀 install
```bash
npm install -g explainit
```

> requires **Node.js 18+**

---

## ⚡ quick start

**step 1 — get a free Gemini API key**

> [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → sign in with Google → **Create API key** → copy it

completely free · no credit card required · 1,500 requests/day per user

**step 2 — connect your key**
```bash
explainit setup
```

**step 3 — hook into git**
```bash
explainit install
```

**that's it.** every `git commit` now triggers a quiz automatically.

---

## 📦 commands

| command | description |
|---|---|
| `explainit setup` | connect your free Gemini API key |
| `explainit install` | hook into git (run once per project) |
| `explainit scan <file>` | preview a file and its contents |
| `explainit quiz <file>` | manually quiz yourself on any file |
| `explainit score` | view your progress, history and streak |

---

## 🔄 full workflow
```
git add .
    ↓
git commit
    ↓
explainit detects changed files
    ↓
skips small changes (< 15 lines) ──→ commit goes through silently ✓
    ↓
Gemini reads your code
    ↓
1 question appears in terminal
    ↓
you type your answer
    ↓
instant AI feedback
    ↓
commit goes through regardless ✓
```

> **explainit never blocks your commit.**
> it only teaches. adoption comes from being useful, not forceful.

---

## 📊 track your progress
```bash
explainit score
```
```
  ███████╗██╗  ██╗██████╗ ██╗      █████╗ ██╗███╗   ██╗██╗████████╗
  ...

  total quizzes  12     correct  9      wrong  3

  score  75%   streak  4 days

  ████████████████████████░░░░░░  75%

▸ recent activity
  ─────────────────────────────────────────────────────────
  ✓  auth.js         27 Mar, 14:32    What does bcrypt.compare do?
  ✓  quiz.js         27 Mar, 12:10    Why is snippet sliced to 300...
  ✗  scores.js       26 Mar, 09:44    What does getStreak return?
  ✓  ai.js           25 Mar, 18:21    Why is code sliced to 300 chars?

▸ most quizzed files
  ─────────────────────────────────────────────────────────
  ◆  auth.js                   5 quizzes      80% correct
  ◆  quiz.js                   4 quizzes      75% correct
  ◆  ai.js                     3 quizzes      66% correct
```

---

## 🏗️ architecture
```
explainit/
├── bin/
│   └── explainit.js      ← CLI entry point — all commands
├── lib/
│   ├── ai.js             ← Gemini API — generate & evaluate
│   ├── quiz.js           ← quiz loop — questions & answers
│   └── scores.js         ← local score storage & streak logic
├── run-quiz.js           ← git hook bridge (auto-created)
└── package.json
```

scores are saved locally at `~/.explainit/scores.json` — nothing leaves your machine except API calls to Gemini.

---

## 🔑 api key — per user, always free

explainit uses a **bring your own key** model.

each user provides their own free Gemini API key. this means:

- ✓ no shared quota — your usage never affects anyone else
- ✓ completely free — 1,500 requests/day is more than enough
- ✓ scales to any number of users
- ✓ your key is stored locally at `~/.explainit/config.json`

get your free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

---

## 🛠️ tech stack

| tool | purpose |
|---|---|
| [Node.js](https://nodejs.org) | runtime |
| [Commander.js](https://github.com/tj/commander.js) | CLI framework |
| [Gemini API](https://aistudio.google.com) | AI question generation & evaluation |
| [Chalk](https://github.com/chalk/chalk) | terminal colours & styling |
| [Ora](https://github.com/sindresorhus/ora) | terminal spinner |

---

## 🤝 contributing

contributions, issues and feature requests are welcome!
```bash
# clone the repo
git clone https://github.com/shekharrs/explainit.git
cd explainit

# install dependencies
npm install

# link locally for development
npm link

# test your changes
explainit scan bin/explainit.js
explainit quiz bin/explainit.js
explainit score
```

**to contribute:**

1. fork the project
2. create your branch &nbsp;`git checkout -b feature/amazing-feature`
3. commit your changes &nbsp;`git commit -m "add amazing feature"`
4. push to the branch &nbsp;`git push origin feature/amazing-feature`
5. open a pull request

---

## 📋 roadmap

- [x] auto-quiz on git commit via pre-commit hook
- [x] AI question generation with Gemini
- [x] answer evaluation with instant feedback
- [x] local score tracking and streak system
- [x] per-user API key — bring your own key model
- [ ] VS Code extension
- [ ] support for more languages (Go, Rust, Java)
- [ ] team leaderboard mode
- [ ] weekly email digest of your weakest files
- [ ] `--strict` mode that requires 70%+ to commit

---

## 🐛 issues & support

found a bug? have a feature idea?

→ [open an issue](https://github.com/shekharrs/explainit/issues)

---

## 📄 license

MIT © [Shekhar](https://github.com/shekharrs)

---

<div align="center">

<br/>

**built for developers who actually want to understand their code**

<br/>

if explainit helped you — drop a ⭐ on the repo. it means a lot.

<br/>

[![github](https://img.shields.io/badge/github-shekharrs%2Fexplainit-A78BFA?style=flat-square&logo=github)](https://github.com/shekharrs/explainit)
[![npm](https://img.shields.io/badge/npm-explainit-34D399?style=flat-square&logo=npm)](https://www.npmjs.com/package/explainit)

</div>