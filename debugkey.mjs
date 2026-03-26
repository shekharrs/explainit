import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

const env = fs.readFileSync('.env', 'utf-8');
const match = env.match(/GEMINI_API_KEY=(.+)/);
const key = match ? match[1].trim() : 'NOT FOUND';

console.log('Length:', key.length);
console.log('First 12 chars:', key.slice(0, 12));
console.log('Last 4 chars:', key.slice(-4));
console.log('Has quotes?', key.startsWith('"') || key.startsWith("'"));
console.log('Has spaces?', key.includes(' '));
console.log('Has \\r?', key.includes('\r'));
console.log('---');
console.log('Testing API call...');

try {
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent('Say hello in one word');
  console.log('SUCCESS:', result.response.text());
} catch (err) {
  console.log('FAILED:', err.message.slice(0, 120));
}
