import { runQuiz } from './lib/quiz.js';

const file = process.argv[2];

if (file) {
  try {
    await runQuiz([file]);
  } catch (err) {
    // never block the commit
  }
}

process.exit(0);