import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import os from "os";
import path from "path";
import readline from "readline";

// store key in ~/.explainit/config.json — not in project folder
const CONFIG_DIR = path.join(os.homedir(), ".explainit");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

function getStoredKey() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return null;
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    return config.geminiApiKey || null;
  } catch {
    return null;
  }
}

function saveKey(key) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({ geminiApiKey: key }, null, 2));
}

async function promptForKey() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });

  return new Promise((resolve) => {
    process.stderr.write("\n");
    process.stderr.write("  Welcome to explainit!\n");
    process.stderr.write("  ─────────────────────────────────────────\n");
    process.stderr.write("  You need a free Gemini API key to continue.\n\n");
    process.stderr.write("  Get yours free in 30 seconds:\n");
    process.stderr.write("  → Go to: https://aistudio.google.com/apikey\n");
    process.stderr.write("  → Sign in with Google\n");
    process.stderr.write("  → Click 'Create API key'\n");
    process.stderr.write("  → Copy and paste it below\n\n");

    rl.question("  Paste your Gemini API key: ", (key) => {
      rl.close();
      resolve(key.trim());
    });
  });
}

async function getApiKey() {
  // 1. check config file first
  let key = getStoredKey();
  if (key) return key;

  // 2. check .env using absolute path relative to ai.js — not cwd
  try {
    const envPath = path.join(
      path.dirname(
        new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"),
      ),
      "../.env",
    );
    console.log("  Looking for .env at:", envPath); // temporary debug line
    if (fs.existsSync(envPath)) {
      const env = fs.readFileSync(envPath, "utf-8");
      const match = env.match(/GEMINI_API_KEY=(.+)/);
      if (match) return match[1].trim();
    }
  } catch {}

  // 3. ask user to enter key — first time setup
  const key2 = await promptForKey();
  if (!key2) {
    process.stderr.write("  No key provided — skipping quiz\n\n");
    return null;
  }

  saveKey(key2);
  process.stderr.write("\n  ✓ Key saved! You won't be asked again.\n\n");
  return key2;
}

export async function generateOneQuestion(code) {
  const apiKey = await getApiKey();
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

  const snippet = code.slice(0, 300).trim();
  const prompt = `Here is a code snippet:
\`\`\`
${snippet}
\`\`\`
Write 1 quiz question about it.
Reply ONLY as JSON, no markdown:
{"question":"...","answer":"..."}`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim();
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

export async function evaluateAnswer(question, correctAnswer, devAnswer) {
  const apiKey = await getApiKey();
  if (!apiKey) return { correct: false, explanation: "Could not evaluate" };

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

  const prompt = `Question: ${question}
Correct: ${correctAnswer}
Student said: ${devAnswer}
Reply ONLY as JSON: {"correct":true,"explanation":"..."}`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim();
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}
