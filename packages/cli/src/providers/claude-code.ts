import { spawn } from "node:child_process";
import type { Readable } from "node:stream";
import {
  TestingProvider,
  ProviderConfig,
  ProviderAuth,
  ProviderMessage,
  ProviderResponse,
  StreamChunk,
  TestContext,
  TestFinding,
} from "./types.js";

export class ClaudeCodeProvider extends TestingProvider {
  readonly config: ProviderConfig = {
    name: "claude-code",
    displayName: "Claude Code",
    authType: "subscription",
    authInstructions:
      "Requires an active Claude Code subscription. Make sure `claude` CLI is installed and authenticated.",
  };

  async validateAuth(auth: ProviderAuth): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = spawn("claude", ["--version"], { stdio: "pipe" });
      proc.on("close", (code) => resolve(code === 0));
      proc.on("error", () => resolve(false));
    });
  }

  async analyze(context: TestContext, messages: ProviderMessage[]): Promise<ProviderResponse> {
    const prompt = messages.map((m) => m.content).join("\n\n");
    const result = await this.execClaude(prompt, context.projectPath);
    return { content: result };
  }

  async *stream(context: TestContext, messages: ProviderMessage[]): AsyncGenerator<StreamChunk> {
    const prompt = messages.map((m) => m.content).join("\n\n");
    const proc = spawn(
      "claude",
      ["--print", "--output-format", "stream-json", "-p", prompt],
      { cwd: context.reportDir, stdio: ["pipe", "pipe", "pipe"] },
    );

    // Capture the exit promise BEFORE consuming the stream to avoid a race
    // where the 'close' event fires before we register the listener.
    const exitPromise = new Promise<number | null>((resolve) => {
      proc.on("close", resolve);
      proc.on("error", () => resolve(null));
    });

    // Event-driven reading for real-time streaming
    const chunks = createChunkQueue(proc.stdout!, proc.stderr!);
    let buffer = "";

    for await (const raw of chunks) {
      buffer += raw;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);
          if (data.type === "assistant" && data.message?.content) {
            for (const block of data.message.content) {
              if (block.type === "text") {
                yield { type: "text", content: block.text };
              } else if (block.type === "tool_use") {
                yield {
                  type: "tool_call",
                  toolCall: { id: block.id, name: block.name, args: block.input },
                };
              }
            }
          } else if (data.type === "content_block_delta" && data.delta?.text) {
            yield { type: "text", content: data.delta.text };
          }
        } catch {
          // Non-JSON line — emit as raw text (stderr output, progress, etc.)
          if (line.trim()) {
            yield { type: "text", content: line + "\n" };
          }
        }
      }
    }

    const exitCode = await exitPromise;

    if (exitCode !== null && exitCode !== 0) {
      yield { type: "text", content: `\n[claude exited with code ${exitCode}]\n` };
    }

    yield { type: "done" };
  }

  async generateTestPlan(context: TestContext, projectInfo: string): Promise<string> {
    const prompt = `You are GetWired, a human-like AI testing expert. Analyze this project and create a comprehensive test plan.

Project path: ${context.projectPath}
URL: ${context.url ?? "not provided"}
Device targets: ${context.deviceProfile}
Test scope: ${context.scope ?? "full"}
${context.commitId ? `Testing against commit: ${context.commitId}` : ""}
${context.prId ? `Testing PR: #${context.prId}` : ""}

Project info:
${projectInfo}

Create a detailed test plan covering:
1. Critical user flows to test
2. UI elements to visually inspect
3. Forms and interactions to validate
4. Responsive/mobile-specific checks (if applicable)
5. Accessibility checks
6. Console error monitoring

Return the plan as a structured JSON array of test steps.`;

    return this.execClaude(prompt, context.projectPath);
  }

  async evaluateScreenshot(
    screenshotBase64: string,
    url: string,
    device: "desktop" | "mobile",
    instructions?: string,
  ): Promise<string> {
    const prompt = `You are GetWired, a human-like AI testing expert examining a screenshot.

URL: ${url}
Device: ${device}
${instructions ? `Instructions: ${instructions}` : ""}

Analyze this screenshot as a human QA tester would. Look for:
- Visual bugs (misalignment, overflow, clipping, z-index issues)
- Missing or broken images
- Text readability issues
- Responsive layout problems
- Accessibility concerns (contrast, touch targets)
- General UX issues

Provide findings as JSON array of objects with: severity, category, title, description.

Screenshot (base64): ${screenshotBase64.slice(0, 100)}... [truncated for prompt, full image passed via tool]`;

    return this.execClaude(prompt);
  }

  async evaluateRegression(
    baselineBase64: string,
    currentBase64: string,
    diffBase64: string,
    url: string,
    device: "desktop" | "mobile",
  ): Promise<TestFinding[]> {
    const prompt = `You are GetWired, a human-like AI testing expert checking for UI regression.

URL: ${url}
Device: ${device}

Compare the baseline screenshot with the current screenshot. A pixel-diff image is also provided highlighting changes.

Determine if the visual changes are:
- Intentional improvements (no finding)
- Regressions that should be flagged (create finding)

For each regression, return a JSON object with: id, severity, category "ui-regression", title, description, device.

Return a JSON array of findings. Return [] if no regressions detected.`;

    const result = await this.execClaude(prompt);
    try {
      return JSON.parse(result);
    } catch {
      return [];
    }
  }

  private execClaude(prompt: string, cwd?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn("claude", ["--print", prompt], {
        cwd,
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      proc.stdout!.on("data", (data: Buffer) => {
        stdout += data.toString();
      });
      proc.stderr!.on("data", (data: Buffer) => {
        stderr += data.toString();
      });

      proc.on("close", (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(`Claude Code exited with code ${code}: ${stderr}`));
        }
      });
      proc.on("error", (err) => reject(err));
    });
  }
}

async function* createChunkQueue(stdout: Readable, stderr: Readable): AsyncGenerator<string> {
  const queue: string[] = [];
  let finished = 0;
  let waiting: (() => void) | null = null;

  function onData(chunk: Buffer) {
    queue.push(chunk.toString());
    if (waiting) { const w = waiting; waiting = null; w(); }
  }
  function onEnd() {
    finished++;
    if (waiting) { const w = waiting; waiting = null; w(); }
  }

  stdout.on("data", onData);
  stderr.on("data", onData);
  stdout.on("end", onEnd);
  stderr.on("end", onEnd);
  stdout.on("error", onEnd);
  stderr.on("error", onEnd);

  while (true) {
    if (queue.length > 0) yield queue.shift()!;
    else if (finished >= 2) break;
    else await new Promise<void>((r) => { waiting = r; });
  }
}
