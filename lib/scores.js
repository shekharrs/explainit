import fs from 'fs'
import os from 'os'
import path from 'path'

const SCORES_DIR = path.join(os.homedir(), '.explainit')
const SCORES_FILE = path.join(SCORES_DIR, 'scores.json')

// ensure the ~/.explainit folder exists
function ensureDir() {
  if (!fs.existsSync(SCORES_DIR)) {
    fs.mkdirSync(SCORES_DIR, { recursive: true })
  }
}

// save one quiz result
export function saveScore({ file, correct, question }) {
  ensureDir()

  let scores = []
  if (fs.existsSync(SCORES_FILE)) {
    scores = JSON.parse(fs.readFileSync(SCORES_FILE, 'utf-8'))
  }

  scores.push({
    file,
    correct,
    question,
    date: new Date().toISOString()
  })

  fs.writeFileSync(SCORES_FILE, JSON.stringify(scores, null, 2))
  console.log("DEBUG: Written to", SCORES_FILE);
}

// read all scores for explainit score command
export function readScores() {
  ensureDir()
  if (!fs.existsSync(SCORES_FILE)) return []
  return JSON.parse(fs.readFileSync(SCORES_FILE, 'utf-8'))
}

// calculate streak — consecutive days used
export function getStreak(scores) {
  if (!scores.length) return 0

  const days = [...new Set(
    scores.map(s => new Date(s.date).toDateString())
  )].reverse()

  let streak = 1
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1])
    const curr = new Date(days[i])
    const diff = (prev - curr) / (1000 * 60 * 60 * 24)
    if (diff === 1) streak++
    else break
  }

  return streak
}