import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Files that should never be analyzed (lockfiles, minified files, media, binaries)
const IGNORED_PATTERNS = [
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
  /bun\.lockb?$/,
  /cargo\.lock$/,
  /composer\.lock$/,
  /Gemfile\.lock$/,
  /\.lock$/,
  /\.min\.(js|css)$/,
  /\.(png|jpe?g|gif|svg|ico|webp|avif|pdf|zip|tar|gz|woff2?|eot|ttf|mp3|mp4)$/i,
  /\.map$/,
];

export function isIgnoredFile(filePath) {
  if (!filePath) return true;
  const normalized = filePath.replace(/\\/g, "/");
  return IGNORED_PATTERNS.some((pattern) => pattern.test(normalized));
}

/**
 * Get staged diff for all files or a specific file
 */
export function getStagedDiff(filePath = null) {
  try {
    const fileArg = filePath ? ` -- "${filePath}"` : "";
    const diff = execSync(`git diff --cached -U3 --no-color${fileArg}`, {
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
      stdio: ["pipe", "pipe", "ignore"],
    });
    return diff || "";
  } catch {
    return "";
  }
}

/**
 * Get working tree (unstaged) diff
 */
export function getWorkingDiff(filePath = null) {
  try {
    const fileArg = filePath ? ` -- "${filePath}"` : "";
    const diff = execSync(`git diff -U3 --no-color${fileArg}`, {
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
      stdio: ["pipe", "pipe", "ignore"],
    });
    return diff || "";
  } catch {
    return "";
  }
}

/**
 * Get list of staged files with their status and line count
 */
export function getStagedFiles() {
  try {
    const output = execSync("git diff --cached --numstat", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    });

    if (!output.trim()) return [];

    const lines = output.trim().split("\n");
    const results = [];

    for (const line of lines) {
      const parts = line.split("\t");
      if (parts.length < 3) continue;

      const added = parseInt(parts[0], 10) || 0;
      const deleted = parseInt(parts[1], 10) || 0;
      const file = parts.slice(2).join("\t").trim();

      if (isIgnoredFile(file)) continue;

      results.push({
        file,
        added,
        deleted,
        totalChanged: added + deleted,
      });
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * Truncate large diff to fit LLM context without losing signal
 */
export function trimDiff(diff, maxChars = 6000) {
  if (!diff) return "";
  if (diff.length <= maxChars) return diff;

  // Keep header and first hunks, add truncation notice
  const sliced = diff.slice(0, maxChars);
  const lastNewline = sliced.lastIndexOf("\n");
  const cleanSlice = lastNewline > 0 ? sliced.slice(0, lastNewline) : sliced;

  return cleanSlice + "\n\n... [diff truncated for length] ...";
}
