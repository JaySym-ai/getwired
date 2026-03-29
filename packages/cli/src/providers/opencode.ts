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
import { buildTestPlanPrompt, buildScreenshotEvalPrompt, buildRegressionPrompt } from "./auggie.js";

export class OpenCodeProvider extends TestingProvider {
  readonly config: ProviderConfig = {
    name: "opencode",
    displayName: "OpenCode",
    authType: "subscription",
    authInstructions:
      "Requires OpenCode CLI installed and authenticated. Install via `npm install -g opencode-ai` or `brew install anomalyco/tap/opencode`. Run `opencode auth login` to configure your provider.",
  };

  async validateAuth(auth: ProviderAuth): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = spawn("opencode", ["--version"], { stdio: "pipe" });
      proc.on("close", (code) => resolve(code === 0));
      proc.on("error", () => resolve(false));
    });
  }

  async analyze(context: TestContext, messages: ProviderMessage[]): Promise<ProviderResponse> {
    const prompt = messages.map((m) => m.content).join("\n\n");
    const result = await this.execOpenCode(prompt, context.projectPath);
    return { content: result };
  }

  async *stream(context: TestContext, messages: ProviderMessage[]): AsyncGenerator<StreamChunk> {
    const prompt = messages.map((m) => m.content).join("\n\n");
    const proc = spawn("opencode", ["run", prompt], {
      cwd: context.reportDir,
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Capture the exit promise BEFORE consuming the stream to avoid a race
    // where the 'close' event fires before we register the listener.
    const exitPromise = new Promise<number | null>((resolve) => {
      proc.on("close", resolve);
      proc.on("error", () => resolve(null));
    });

    const chunks = createChunkQueue(proc.stdout!, proc.stderr!);

    for await (const text of chunks) {
      if (text.trim()) {
        yield { type: "text", content: text };
      }
    }

    const exitCode = await exitPromise;

    if (exitCode !== null && exitCode !== 0) {
      yield { type: "text", content: `\n[opencode exited with code ${exitCode}]\n` };
    }

    yield { type: "done" };
  }

  async generateTestPlan(context: TestContext, projectInfo: string): Promise<string> {
    const prompt = buildTestPlanPrompt(context, projectInfo);
    return this.execOpenCode(prompt, context.projectPath);
  }

  async evaluateScreenshot(
    screenshotBase64: string,
    url: string,
    device: "desktop" | "mobile",
    instructions?: string,
  ): Promise<string> {
    const prompt = buildScreenshotEvalPrompt(url, device, instructions);
    return this.execOpenCode(prompt);
  }

  async evaluateRegression(
    baselineBase64: string,
    currentBase64: string,
    diffBase64: string,
    url: string,
    device: "desktop" | "mobile",
  ): Promise<TestFinding[]> {
    const prompt = buildRegressionPrompt(url, device);
    const result = await this.execOpenCode(prompt);
    try {
      return JSON.parse(result);
    } catch {
      return [];
    }
  }

  private execOpenCode(prompt: string, cwd?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn("opencode", ["run", "--format", "json", prompt], {
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
          // opencode run --format json returns structured output;
          // extract the text content from the response
          try {
            const parsed = JSON.parse(stdout.trim());
            resolve(typeof parsed.content === "string" ? parsed.content : stdout.trim());
          } catch {
            resolve(stdout.trim());
          }
        } else {
          reject(new Error(`OpenCode exited with code ${code}: ${stderr}`));
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
