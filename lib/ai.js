import { GoogleGenerativeAI } from "@google/generative-ai"; // Gemini API SDK
import dotenv from "dotenv"; // loads environment variables from .env

dotenv.config({quiet: true}); // load the env variable

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // creates a connection to Gemini using API KEY
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" }); // gemini-1.5-flash -> model

export async function generateOneQuestion(code) {
  const prompt = `
    You are reviewing code written by a developer.

    Code:
    ${code}

    Generate exactly 1 question.
    Return ONLY JSON:
    {
      "question": "...",
      "answer": "..."
    }
    `;
  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim();
  const cleaned = raw.replace(/```json|```/g, "").trim();

  return JSON.parse(cleaned);
}

export async function evaluateAnswer(question, correctAnswer, devAnswer) {
  const prompt = `
Question: ${question}
Correct: ${correctAnswer}
User: ${devAnswer}

Return JSON:
{"correct": true, "explanation": "..."}
    `;
  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim();
  const cleaned = raw.replace(/```json|```/g, "").trim();

  return JSON.parse(cleaned);
}
