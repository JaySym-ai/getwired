import { spawn } from "node:child_process";
import type { Readable } from "node:stream";
import {
  TestingProvider,
  ProviderConfig,
  ProviderMessage,
  StreamChunk,
  TestContext,
  TestFinding,
} from "./types.js";

export class AuggieProvider extends TestingProvider {
  readonly config: ProviderConfig = {
    name: "auggie",
    displayName: "Auggie",
    authType: "subscription",
    authInstructions:
      "Requires an Augment Code subscription. Make sure `auggie` CLI is installed and authenticated. Run `auggie auth` to set up.",
  };

  async *stream(context: TestContext, messages: ProviderMessage[]): AsyncGenerator<StreamChunk> {
    const prompt = messages.map((m) => m.content).join("\n\n");
    const proc = spawn("auggie", ["--print", "-i", prompt], {
      cwd: context.reportDir,
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Capture the exit promise BEFORE consuming the stream to avoid a race
    // where the 'close' event fires before we register the listener.
    const exitPromise = new Promise<number | null>((resolve) => {
      proc.on("close", resolve);
      proc.on("error", () => resolve(null));
    });

    // Use an event-driven queue instead of `for await` so chunks are
    // yielded as soon as they arrive rather than being batched.
    const chunks = createChunkQueue(proc.stdout!, proc.stderr!);

    for await (const text of chunks) {
      if (text.trim()) {
        yield { type: "text", content: text };
      }
    }

    // Wait for the process to exit and surface errors
    const exitCode = await exitPromise;

    if (exitCode !== null && exitCode !== 0) {
      yield { type: "text", content: `\n[auggie exited with code ${exitCode}]\n` };
    }

    yield { type: "done" };
  }

  async evaluateRegression(
    _baselineBase64: string,
    _currentBase64: string,
    _diffBase64: string,
    url: string,
    device: "desktop" | "mobile",
  ): Promise<TestFinding[]> {
    const prompt = buildRegressionPrompt(url, device);
    const result = await this.execAuggie(prompt);
    try {
      return JSON.parse(result);
    } catch {
      return [];
    }
  }

  private execAuggie(prompt: string, cwd?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn("auggie", ["--print", "--quiet", "-i", prompt], {
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
          reject(new Error(`Auggie exited with code ${code}: ${stderr}`));
        }
      });
      proc.on("error", (err) => reject(err));
    });
  }
}

function buildRegressionPrompt(url: string, device: "desktop" | "mobile"): string {
  return `You are GetWired checking for UI regression.
URL: ${url} | Device: ${device}
Compare baseline vs current screenshot. Return JSON array of regression findings with: id, severity, category "ui-regression", title, description, device. Return [] if none.
CRITICAL: NEVER include API keys, auth tokens, passwords, secrets, or any sensitive data visible in screenshots in your output. If sensitive data is visible, report it as a security finding without repeating the actual value. Redact as [REDACTED].`;
}

export { buildRegressionPrompt };

/**
 * Event-driven chunk queue that merges stdout + stderr and yields each
 * data event immediately — no batching, no waiting for buffer fills.
 */
async function* createChunkQueue(stdout: Readable, stderr: Readable): AsyncGenerator<string> {
  const queue: string[] = [];
  let finished = 0;
  let waiting: (() => void) | null = null;

  function onData(chunk: Buffer) {
    // Split on newlines so partial lines are flushed immediately
    const text = chunk.toString();
    queue.push(text);
    if (waiting) {
      const wake = waiting;
      waiting = null;
      wake();
    }
  }

  function onEnd() {
    finished++;
    if (waiting) {
      const wake = waiting;
      waiting = null;
      wake();
    }
  }

  stdout.on("data", onData);
  stderr.on("data", onData);
  stdout.on("end", onEnd);
  stderr.on("end", onEnd);
  stdout.on("error", onEnd);
  stderr.on("error", onEnd);

  while (true) {
    if (queue.length > 0) {
      yield queue.shift()!;
    } else if (finished >= 2) {
      break;
    } else {
      await new Promise<void>((r) => { waiting = r; });
    }
  }
}
