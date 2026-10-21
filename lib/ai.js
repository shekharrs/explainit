import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import os from "os";
import path from "path";
import readline from "readline";

const CONFIG_DIR = path.join(os.homedir(), ".explainit");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export function getStoredKey() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return null;
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    return config.apiKey || null;
  } catch {
    return null;
  }
}

export function saveKey(key) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({ apiKey: key }, null, 2));
}

export async function promptForKey() {
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
    process.stderr.write("  → Click 'Create API key in new project'\n");
    process.stderr.write("  → Copy and paste it below\n\n");

    rl.question("  Paste your Gemini API key: ", (key) => {
      rl.close();
      resolve(key.trim());
    });
  });
}

export async function getApiKey() {
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
      const match = env.match(/GEMINI_API_KEY=(.+)/);
      if (match) return match[1].trim();
    }
  } catch {}

  // 3. check process.env
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY.trim();
  }

  // 4. ask user
  const key2 = await promptForKey();
  if (!key2) {
    process.stderr.write("  No key provided — skipping AI generation\n\n");
    return null;
  }

  saveKey(key2);
  process.stderr.write("\n  ✓ Key saved! You won't be asked again.\n\n");
  return key2;
}

/**
 * Helper to get Gemini generative model with fallback
 */
async function generateWithFallback(apiKey, prompt, systemInstruction = "", config = {}) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const models = [
    "gemini-3-flash-preview",
    "gemini-3.5-flash-lite",
    "gemini-flash-latest",
    "gemini-3.8-flash",
  ];

  let lastError = null;
  const timeoutMs = config.timeoutMs || 15000;

  for (const modelName of models) {
    let timer = null;
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstruction || undefined,
        generationConfig: config.generationConfig || undefined,
      });

      const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`Timeout after ${timeoutMs}ms for ${modelName}`));
        }, timeoutMs);
      });

      const result = await Promise.race([
        model.generateContent(prompt),
        timeoutPromise,
      ]);

      if (timer) clearTimeout(timer);
      return result.response.text();
    } catch (err) {
      if (timer) clearTimeout(timer);
      lastError = err;
      // Fast fallback to next model on timeout, 404, or 503
      continue;
    }
  }

  throw lastError || new Error("Failed to generate content with Gemini");
}

function parseJSON(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error("Could not parse AI response as JSON");
  }
}

/**
 * 1. Generate 1-Key MCQ quiz question based on real git diff
 */
export async function generateMCQQuestion(diff, filePath = "staged code") {
  const apiKey = await getApiKey();
  if (!apiKey) return null;

  const prompt = `You are explainit, an AI assistant that verifies developer comprehension before committing code.
Inspect the following git diff for "${filePath}":
\`\`\`diff
${diff}
\`\`\`

Task:
Generate 1 practical multiple-choice question testing whether the developer understands what changed.
Focus on:
- What the changed logic actually does
- Edge cases, error handling, or performance implications
- Why a change was made

Do NOT ask trivial trivia (e.g. "what is line 4?"). Keep questions concise and realistic.

Reply ONLY as valid JSON in this exact structure with no surrounding markdown:
{
  "observation": "Brief 1-sentence note of what changed (e.g. Refresh token rotation was added)",
  "question": "The question to ask",
  "options": [
    "First plausible option",
    "Second plausible option",
    "Third plausible option"
  ],
  "correctIndex": 1,
  "explanation": "1-2 sentence explanation of why this option is correct"
}

Notes:
- correctIndex must be an integer: 1, 2, or 3.
- All 3 options should be plausible and distinct.`;

  const raw = await generateWithFallback(apiKey, prompt, "", {
    generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
    timeoutMs: 10000,
  });
  return parseJSON(raw);
}

/**
 * 2. Explain diff in plain English (explainit explain)
 */
export async function explainDiffContent(diff, contextTitle = "code changes") {
  const apiKey = await getApiKey();
  if (!apiKey) return null;

  const prompt = `You are explainit. Explain the following git diff in plain, conversational English for a developer:
Context: ${contextTitle}
\`\`\`diff
${diff}
\`\`\`

Reply ONLY as valid JSON in this exact structure with no surrounding markdown:
{
  "summary": "1-2 sentence high-level overview of what this diff accomplishes.",
  "details": [
    "Key architectural or logic decision 1",
    "Key architectural or logic decision 2",
    "Key architectural or logic decision 3"
  ],
  "watchOut": [
    "Potential risk, edge case, memory/performance concern, or unhandled scenario"
  ]
}`;

  const raw = await generateWithFallback(apiKey, prompt, "", {
    generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
    timeoutMs: 12000,
  });
  return parseJSON(raw);
}

/**
 * 3. Generate conventional commit message (explainit msg)
 */
export async function generateCommitMessage(diff) {
  const apiKey = await getApiKey();
  if (!apiKey) return "update: changes made";

  const prompt = `Inspect this git diff and write a single-line Conventional Commit message (e.g. feat(auth): ..., fix(api): ..., refactor(...): ...):
\`\`\`diff
${diff}
\`\`\`

Rules:
- Format: <type>(<scope>): <short description in imperative mood>
- Max 72 characters
- Reply ONLY with the plain commit message string. No quotes, no markdown, no explanation.`;

  const raw = await generateWithFallback(apiKey, prompt, "", {
    generationConfig: { temperature: 0.2 },
    timeoutMs: 8000,
  });
  return raw.replace(/^["'`]|["'`]$/g, "").trim();
}

/**
 * Backwards compatibility for v1.0
 */
export async function generateOneQuestion(code) {
  const mcq = await generateMCQQuestion(code, "code");
  if (!mcq) return null;
  return {
    question: mcq.question,
    answer: mcq.options[mcq.correctIndex - 1],
  };
}

export async function evaluateAnswer(question, correctAnswer, devAnswer) {
  const apiKey = await getApiKey();
  if (!apiKey) return { correct: false, explanation: "Could not evaluate" };

  const prompt = `Question: ${question}
Correct: ${correctAnswer}
Developer answered: ${devAnswer}
Evaluate if the developer understood the core concept.
Reply ONLY as JSON: {"correct":true,"explanation":"..."}`;

  const raw = await generateWithFallback(apiKey, prompt);
  return parseJSON(raw);
}