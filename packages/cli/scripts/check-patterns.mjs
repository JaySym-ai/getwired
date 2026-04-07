#!/usr/bin/env node
/**
 * Cross-platform banned-pattern check for provider files.
 * Fails if any provider source file (excluding stream-utils.ts)
 * contains a call to the legacy createChunkQueue function.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const PROVIDERS_DIR = join(import.meta.dirname, "../src/providers");
const BANNED = /createChunkQueue\s*\(/;
const EXCLUDE = "stream-utils.ts";

const files = readdirSync(PROVIDERS_DIR).filter(
  (f) => f.endsWith(".ts") && f !== EXCLUDE,
);

let found = false;
for (const file of files) {
  const content = readFileSync(join(PROVIDERS_DIR, file), "utf-8");
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (BANNED.test(lines[i])) {
      console.error(`\x1b[31mBANNED PATTERN\x1b[0m ${file}:${i + 1}: ${lines[i].trim()}`);
      found = true;
    }
  }
}

if (found) {
  console.error("\nUse createStdoutChunkQueue from stream-utils.ts instead.");
  process.exit(1);
}