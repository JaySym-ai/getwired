import { spawn } from "node:child_process";
import {
  TestingProvider,
  ProviderConfig,
  ProviderMessage,
  StreamChunk,
  TestContext,
  TestFinding,
} from "./types.js";
import { createStdoutChunkQueue, drainStderr } from "./stream-utils.js";

export class ClaudeCodeProvider extends TestingProvider {
  readonly config: ProviderConfig = {
    name: "claude-code",
    displayName: "Claude Code",
    authType: "subscription",
    authInstructions:
      "Requires an active Claude Code subscription. Make sure `claude` CLI is installed and authenticated.",
  };

  async *stream(context: TestContext, messages: ProviderMessage[]): AsyncGenerator<StreamChunk> {
    const prompt = messages.map((m) => m.content).join("\n\n");
    const proc = spawn(
      "claude",
      ["--print", "--verbose", "--output-format", "stream-json", "--permission-mode", "plan", "--tools", "", "-p", prompt],
      { cwd: context.reportDir, stdio: ["pipe", "pipe", "pipe"] },
    );

    // Capture the exit promise BEFORE consuming the stream to avoid a race
    // where the 'close' event fires before we register the listener.
    const exitPromise = new Promise<number | null>((resolve) => {
      proc.on("close", resolve);
      proc.on("error", () => resolve(null));
    });

    const stderr = drainStderr(proc.stderr!);

    // Event-driven reading for real-time streaming
    const chunks = createStdoutChunkQueue(proc.stdout!);
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
          // Non-JSON line — emit as raw text
          if (line.trim()) {
            yield { type: "text", content: line + "\n" };
          }
        }
      }
    }

    const exitCode = await exitPromise;

    if (exitCode !== null && exitCode !== 0) {
      const stderrBuf = stderr.getBuffer().trim();
      const detail = stderrBuf ? `\n${stderrBuf}` : "";
      yield { type: "text", content: `\n[claude exited with code ${exitCode}]${detail}\n` };
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
      const proc = spawn("claude", ["--print", "--permission-mode", "plan", "--tools", "", prompt], {
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
