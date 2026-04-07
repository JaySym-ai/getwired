import assert from "node:assert/strict";
import { chmod, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

import { ClaudeCodeProvider } from "../../src/providers/claude-code.js";
import type { ProviderMessage, StreamChunk, TestContext } from "../../src/providers/types.js";

const STDERR_CAP = 16_384;
const LARGE_STDERR_HEAD = "LARGE-STDERR-HEAD";
const LARGE_STDERR_TAIL = "LARGE-STDERR-TAIL";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = resolve(__dirname, "../fixtures/fake-claude.mjs");

const TEST_MESSAGES: ProviderMessage[] = [{ role: "user", content: "Check the page for stdout-only provider output." }];

const MCP_NOISE_FRAGMENTS = [
  "Loading MCP server",
  "Initializing tool",
  "Connected to 2 MCP servers",
  "All MCP tools ready",
];

type FixtureMode = "default" | "large-stderr" | "stderr-error";

function getTextChunks(chunks: StreamChunk[]): string[] {
  return chunks
    .filter((chunk): chunk is StreamChunk & { type: "text" } => chunk.type === "text")
    .map((chunk) => chunk.content ?? "");
}

function joinText(chunks: StreamChunk[]): string {
  return getTextChunks(chunks).join("");
}

function assertNoMcpNoise(output: string) {
  for (const fragment of MCP_NOISE_FRAGMENTS) {
    assert.ok(!output.includes(fragment), `expected streamed output to exclude stderr fragment: ${fragment}`);
  }
}

function buildFakeClaudeCommand(): string {
  const quotedNode = JSON.stringify(process.execPath);
  const quotedFixture = JSON.stringify(FIXTURE_PATH);
  return `#!/bin/sh\nexec ${quotedNode} ${quotedFixture} "$@"\n`;
}

async function installFakeClaudeBinary(binDir: string): Promise<void> {
  const scriptPath = join(binDir, "claude");
  await writeFile(scriptPath, buildFakeClaudeCommand());
  await chmod(scriptPath, 0o755);
}

async function createTestContext(): Promise<{ cleanup: () => Promise<void>; context: TestContext }> {
  const rootDir = await mkdtemp(join(tmpdir(), "claude-provider-test-"));
  const baselineDir = join(rootDir, "baseline");
  const reportDir = join(rootDir, "report");
  await Promise.all([mkdir(baselineDir), mkdir(reportDir)]);
  return {
    cleanup: () => rm(rootDir, { recursive: true, force: true }),
    context: { projectPath: rootDir, url: "http://localhost:3000", deviceProfile: "desktop", baselineDir, reportDir },
  };
}

async function withFakeClaudeMode<T>(mode: FixtureMode, run: () => Promise<T>): Promise<T> {
  const originalPath = process.env.PATH;
  const originalMode = process.env.FAKE_CLAUDE_MODE;
  const binDir = await mkdtemp(join(tmpdir(), "fake-claude-bin-"));
  await installFakeClaudeBinary(binDir);
  process.env.PATH = [binDir, originalPath].filter(Boolean).join(delimiter);
  process.env.FAKE_CLAUDE_MODE = mode;
  try {
    return await run();
  } finally {
    if (originalPath === undefined) delete process.env.PATH;
    else process.env.PATH = originalPath;
    if (originalMode === undefined) delete process.env.FAKE_CLAUDE_MODE;
    else process.env.FAKE_CLAUDE_MODE = originalMode;
    await rm(binDir, { recursive: true, force: true });
  }
}

async function collectStream(
  mode: FixtureMode,
  provider: ClaudeCodeProvider = new ClaudeCodeProvider(),
): Promise<StreamChunk[]> {
  return withFakeClaudeMode(mode, async () => {
    const { cleanup, context } = await createTestContext();
    try {
      const chunks: StreamChunk[] = [];
      for await (const chunk of provider.stream(context, TEST_MESSAGES)) {
        chunks.push(chunk);
      }
      return chunks;
    } finally {
      await cleanup();
    }
  });
}

describe("ClaudeCodeProvider stderr isolation", () => {
  it("stderr MCP noise does not appear in stream output", async () => {
    const chunks = await collectStream("default");
    const output = joinText(chunks);
    assertNoMcpNoise(output);
    assert.equal(chunks.at(-1)?.type, "done");
  });

  it("stdout content is yielded as parsed text chunks", async () => {
    const chunks = await collectStream("default");
    const textChunks = getTextChunks(chunks);
    const output = textChunks.join("");
    assert.ok(textChunks.length > 0, "expected at least one text chunk");
    assert.match(output, /Analyzing page structure at localhost:3000\.\.\./);
    assert.match(output, /Found 3 interactive elements\./);
    assert.match(output, /Test plan: check form validation, nav links, footer\./);
    assert.ok(!output.includes('"type":"assistant"'), "expected parsed text rather than raw Claude JSON");
  });

  it("multiple sequential stream() calls produce clean output", async () => {
    const provider = new ClaudeCodeProvider();
    for (let index = 0; index < 3; index += 1) {
      const chunks = await collectStream("default", provider);
      const output = joinText(chunks);
      assertNoMcpNoise(output);
      assert.match(output, /Found 3 interactive elements\./);
      assert.equal(chunks.at(-1)?.type, "done");
    }
  });

  it("large stderr output is bounded by STDERR_CAP", async () => {
    const chunks = await collectStream("large-stderr");
    const output = joinText(chunks);
    const diagnostic = getTextChunks(chunks).find((chunk) => chunk.includes("[claude exited with code 23]"));
    assert.match(output, /Analyzing page structure at localhost:3000\.\.\./);
    assert.ok(diagnostic, "expected non-zero exit diagnostics");
    assert.ok(diagnostic.startsWith("\n[claude exited with code 23]\n"));
    assert.ok(diagnostic.includes(LARGE_STDERR_TAIL), "expected stderr tail to be preserved");
    assert.ok(!diagnostic.includes(LARGE_STDERR_HEAD), "expected stderr head to be truncated");
    assert.ok(diagnostic.endsWith(`${LARGE_STDERR_TAIL}\n`));
    assert.ok(!diagnostic.endsWith("\n\n"));
    assert.ok(diagnostic.length <= STDERR_CAP + 64, `expected diagnostic chunk to stay near the ${STDERR_CAP}-character cap`);
    assert.equal(chunks.at(-1)?.type, "done");
  });

  it("stderr errors do not crash the stream", async () => {
    const chunks = await collectStream("stderr-error");
    const output = joinText(chunks);
    assert.match(output, /Analyzing page structure at localhost:3000\.\.\./);
    assert.ok(!output.includes("Preparing stderr failure simulation..."));
    assert.ok(!output.includes("Unhandled 'error' event"));
    assert.equal(chunks.at(-1)?.type, "done");
  });
});