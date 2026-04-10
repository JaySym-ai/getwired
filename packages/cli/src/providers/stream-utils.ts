import type { Readable } from "node:stream";
import type { StreamChunk } from "./types.js";

/** All providers should use createStdoutChunkQueue for streaming and drainStderr for stderr isolation. */
export const STDERR_CAP = 16_384;

/** Default timeout for provider streams (5 minutes with no output). */
export const STREAM_IDLE_TIMEOUT_MS = 5 * 60 * 1000;

/** Patterns that indicate rate limiting or token exhaustion from various providers. */
const RATE_LIMIT_PATTERNS = [
  /rate.?limit/i,
  /too many requests/i,
  /quota.?exceeded/i,
  /token.?limit/i,
  /context.?length.?exceeded/i,
  /max.?tokens/i,
  /capacity/i,
  /overloaded/i,
  /429/,
  /resource.?exhausted/i,
  /billing/i,
  /insufficient.?credits/i,
  /request.?limit/i,
  /throttl/i,
];

/**
 * Check if a string contains rate limit or token limit error indicators.
 */
export function detectRateLimitError(text: string): string | null {
  for (const pattern of RATE_LIMIT_PATTERNS) {
    if (pattern.test(text)) {
      return text.slice(0, 200);
    }
  }
  return null;
}

/**
 * Wraps a provider stream with idle timeout and rate limit detection.
 * If no chunks arrive for `timeoutMs`, the stream yields an error and stops.
 * If stderr or chunk content indicates a rate/token limit, it yields an error and stops.
 */
export async function* withStreamGuards(
  stream: AsyncGenerator<StreamChunk>,
  stderrGetter?: () => string,
  timeoutMs: number = STREAM_IDLE_TIMEOUT_MS,
): AsyncGenerator<StreamChunk> {
  let lastActivity = Date.now();

  for await (const chunk of raceTimeout(stream, () => {
    const idle = Date.now() - lastActivity;
    return idle >= timeoutMs;
  })) {
    lastActivity = Date.now();

    // Check chunk content for rate limit errors
    if (chunk.type === "text" && chunk.content) {
      const rateLimitMsg = detectRateLimitError(chunk.content);
      if (rateLimitMsg) {
        yield { type: "error", error: `Provider rate/token limit detected: ${rateLimitMsg}` };
        yield { type: "done" };
        return;
      }
    }

    // Check stderr for rate limit errors
    if (stderrGetter) {
      const stderrContent = stderrGetter();
      if (stderrContent) {
        const rateLimitMsg = detectRateLimitError(stderrContent);
        if (rateLimitMsg) {
          yield { type: "error", error: `Provider rate/token limit detected (stderr): ${rateLimitMsg}` };
          yield { type: "done" };
          return;
        }
      }
    }

    yield chunk;
  }

  // If we exited the loop due to timeout
  const idle = Date.now() - lastActivity;
  if (idle >= timeoutMs) {
    const mins = Math.round(timeoutMs / 60_000);
    yield {
      type: "error",
      error: `Provider stream timed out after ${mins} minutes of inactivity. This may indicate a rate limit, token limit, or provider outage.`,
    };
    yield { type: "done" };
  }
}

/**
 * Race an async generator against a timeout check.
 * Yields values from the generator. If the timeout check returns true
 * between iterations, the generator is returned from (abandoned).
 */
async function* raceTimeout<T>(
  gen: AsyncGenerator<T>,
  isTimedOut: () => boolean,
): AsyncGenerator<T> {
  while (true) {
    if (isTimedOut()) return;

    let timerId: ReturnType<typeof setTimeout> | undefined;
    const result = await Promise.race([
      gen.next(),
      new Promise<{ done: true; value: undefined }>((resolve) => {
        const check = () => {
          if (isTimedOut()) {
            resolve({ done: true, value: undefined });
          } else {
            timerId = setTimeout(check, 5000);
          }
        };
        timerId = setTimeout(check, 5000);
      }),
    ]);

    if (timerId !== undefined) clearTimeout(timerId);
    if (result.done) return;
    yield result.value;
  }
}

export function drainStderr(stderr: Readable): { getBuffer: () => string } {
  let stderrBuf = "";

  stderr.on("data", (chunk: Buffer) => {
    let text = chunk.toString();
    if (text.length > STDERR_CAP) {
      text = text.slice(-STDERR_CAP);
    }
    const headRoom = STDERR_CAP - text.length;
    const prefix = headRoom > 0 ? stderrBuf.slice(-headRoom) : "";
    stderrBuf = prefix + text;
  });
  stderr.on("error", () => {});

  return {
    getBuffer: () => stderrBuf,
  };
}

export async function* createStdoutChunkQueue(stdout: Readable): AsyncGenerator<string> {
  const queue: string[] = [];
  let ended = false;
  let waiting: (() => void) | null = null;

  function onData(chunk: Buffer) {
    queue.push(chunk.toString());
    if (waiting) {
      const wake = waiting;
      waiting = null;
      wake();
    }
  }

  function onEnd() {
    ended = true;
    if (waiting) {
      const wake = waiting;
      waiting = null;
      wake();
    }
  }

  stdout.on("data", onData);
  stdout.on("end", onEnd);
  stdout.on("close", onEnd);
  stdout.on("error", onEnd);

  try {
    while (true) {
      if (queue.length > 0) {
        yield queue.shift()!;
      } else if (ended) {
        break;
      } else {
        await new Promise<void>((r) => {
          waiting = r;
        });
      }
    }
  } finally {
    stdout.removeListener("data", onData);
    stdout.removeListener("end", onEnd);
    stdout.removeListener("close", onEnd);
    stdout.removeListener("error", onEnd);
  }
}