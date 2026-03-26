import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

// retry once if Gemini fails
async function callWithRetry(fn) {
  try {
    return await fn();
  } catch (err) {
    // wait 3 seconds and retry once
    await new Promise(r => setTimeout(r, 3000));
    return await fn();
  }
}

export async function generateOneQuestion(code) {
  return callWithRetry(async () => {
    const prompt = `
You are reviewing code written by a developer.

Code:
\`\`\`
${code.slice(0, 1500)}
\`\`\`

Generate exactly 1 short quiz question about this code.
Return ONLY valid JSON, no markdown, no backticks:
{"question": "...", "answer": "..."}
`;
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  });
}

export async function evaluateAnswer(question, correctAnswer, devAnswer) {
  return callWithRetry(async () => {
    const prompt = `
Question: ${question}
Correct answer: ${correctAnswer}
Developer answered: ${devAnswer}

Is the developer's answer correct or close enough?
Return ONLY valid JSON:
{"correct": true, "explanation": "one sentence feedback"}
`;
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  });
}