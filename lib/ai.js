import fs from "fs";
import os from "os";
import path from "path";
import readline from "readline";

const CONFIG_DIR = path.join(os.homedir(), ".explainit");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

function getStoredKey() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return null;
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    return config.apiKey || null;
  } catch {
    return null;
  }
}

function saveKey(key) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({ apiKey: key }, null, 2));
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
    process.stderr.write("  You need a free OpenRouter API key to continue.\n\n");
    process.stderr.write("  Get yours free in 30 seconds:\n");
    process.stderr.write("  → Go to: https://openrouter.ai/keys\n");
    process.stderr.write("  → Sign in with Google\n");
    process.stderr.write("  → Click 'Create Key'\n");
    process.stderr.write("  → Copy and paste it below\n\n");

    rl.question("  Paste your OpenRouter API key: ", (key) => {
      rl.close();
      resolve(key.trim());
    });
  });
}

async function getApiKey() {
  // 1. check config file
  let key = getStoredKey();
  if (key) return key;

  // 2. check .env
  try {
    const envPath = path.join(
      path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")),
      "../.env"
    );
    if (fs.existsSync(envPath)) {
      const env = fs.readFileSync(envPath, "utf-8");
      const match = env.match(/OPENROUTER_API_KEY=(.+)/);
      if (match) return match[1].trim();
    }
  } catch {}

  // 3. ask user
  const key2 = await promptForKey();
  if (!key2) {
    process.stderr.write("  No key provided — skipping quiz\n\n");
    return null;
  }

  saveKey(key2);
  process.stderr.write("\n  ✓ Key saved! You won't be asked again.\n\n");
  return key2;
}

async function callOpenRouter(apiKey, messages) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/explainit",
      "X-Title": "explainit",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.2-3b-instruct:free",
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter error: ${response.status} ${err.slice(0, 100)}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

export async function generateOneQuestion(code) {
  const apiKey = await getApiKey();
  if (!apiKey) return null;

  const snippet = code.slice(0, 300).trim();
  const raw = await callOpenRouter(apiKey, [
    {
      role: "user",
      content: `Here is a code snippet:\n\`\`\`\n${snippet}\n\`\`\`\nWrite 1 quiz question about it.\nReply ONLY as JSON, no markdown:\n{"question":"...","answer":"..."}`,
    },
  ]);

  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

export async function evaluateAnswer(question, correctAnswer, devAnswer) {
  const apiKey = await getApiKey();
  if (!apiKey) return { correct: false, explanation: "Could not evaluate" };

  const raw = await callOpenRouter(apiKey, [
    {
      role: "user",
      content: `Question: ${question}\nCorrect: ${correctAnswer}\nStudent said: ${devAnswer}\nReply ONLY as JSON: {"correct":true,"explanation":"..."}`,
    },
  ]);

  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}