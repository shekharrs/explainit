// explainit pre-commit runner
try {
  const { runQuiz } = await import("./lib/quiz.js");
  await runQuiz();
} catch {
  try {
    const { runQuiz } = await import("explainit/lib/quiz.js");
    await runQuiz();
  } catch {
    const { execSync } = await import("child_process");
    try {
      execSync("explainit pre-commit", { stdio: "inherit" });
    } catch {}
  }
}
