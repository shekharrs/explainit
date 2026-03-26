import { runQuiz } from './lib/quiz.js';
const file = process.argv[2];
if (file) await runQuiz([file]);
