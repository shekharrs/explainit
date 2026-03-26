import { runQuiz } from './lib/quiz.js';

const file = process.argv[2];

if (file) {
  try {
    await runQuiz([file]);
  } catch {
    // never block commit
  }
}

process.exit(0);