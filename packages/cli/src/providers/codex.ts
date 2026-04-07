import { spawn } from "node:child_process";
import {
  TestingProvider,
  ProviderConfig,
  ProviderMessage,
  StreamChunk,
  TestContext,
  TestFinding,
} from "./types.js";
import { buildRegressionPrompt } from "./auggie.js";
import { createStdoutChunkQueue, drainStderr } from "./stream-utils.js";

export class CodexProvider extends TestingProvider {
  readonly config: ProviderConfig = {
    name: "codex",
    displayName: "Codex",
    authType: "subscription",
    authInstructions:
      "Requires an OpenAI subscription. Make sure `codex` CLI is installed and authenticated. Set OPENAI_API_KEY or run `codex login`.",
  };

  async *stream(context: TestContext, messages: ProviderMessage[]): AsyncGenerator<StreamChunk> {
    const prompt = messages.map((m) => m.content).join("\n\n");
    const proc = spawn("codex", ["exec", "-s", "read-only", "--json", prompt], {
      cwd: context.reportDir,
      stdio: ["pipe", "pipe", "pipe"],
    });

    const exitPromise = new Promise<number | null>((resolve) => {
      proc.on("close", resolve);
      proc.on("error", () => resolve(null));
    });

    const stderr = drainStderr(proc.stderr!);

    // Parse JSONL events from stdout
    let buffer = "";
    for await (const raw of createStdoutChunkQueue(proc.stdout!)) {
      buffer += raw;
      const lines = buffer.split("\n");
      buffer = lines.pop()!; // keep incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const event = JSON.parse(trimmed);
          // Extract text from agent_message items
          if (event.type === "item.completed" && event.item?.type === "agent_message" && event.item.text) {
            yield { type: "text", content: event.item.text };
          }
        } catch {
          // Non-JSON line, emit as-is if non-empty
          if (trimmed) {
            yield { type: "text", content: trimmed };
          }
        }
      }
    }

    // Flush remaining buffer
    if (buffer.trim()) {
      try {
        const event = JSON.parse(buffer.trim());
        if (event.type === "item.completed" && event.item?.type === "agent_message" && event.item.text) {
          yield { type: "text", content: event.item.text };
        }
      } catch {
        yield { type: "text", content: buffer.trim() };
      }
    }

    const exitCode = await exitPromise;

    if (exitCode !== null && exitCode !== 0) {
      const stderrBuf = stderr.getBuffer().trim();
      const detail = stderrBuf ? `\n${stderrBuf}` : "";
      yield { type: "text", content: `\n[codex exited with code ${exitCode}]${detail}\n` };
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
    const result = await this.execCodex(prompt);
    try {
      return JSON.parse(result);
    } catch {
      return [];
    }
  }

  private execCodex(prompt: string, cwd?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn("codex", ["exec", "-s", "read-only", "--json", prompt], {
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
          // Parse JSONL output, extract the last agent_message text
          const text = extractAgentText(stdout);
          resolve(text);
        } else {
          reject(new Error(`Codex exited with code ${code}: ${stderr || stdout}`));
        }
      });
      proc.on("error", (err) => reject(err));
    });
  }
}

/**
 * Extract agent message text from JSONL output.
 */
function extractAgentText(jsonl: string): string {
  const parts: string[] = [];
  for (const line of jsonl.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const event = JSON.parse(trimmed);
      if (event.type === "item.completed" && event.item?.type === "agent_message" && event.item.text) {
        parts.push(event.item.text);
      }
    } catch {
      // skip non-JSON lines
    }
  }
  return parts.join("\n").trim();
}
