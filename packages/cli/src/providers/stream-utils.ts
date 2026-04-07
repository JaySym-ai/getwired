import type { Readable } from "node:stream";

/** All providers should use createStdoutChunkQueue for streaming and drainStderr for stderr isolation. */
export const STDERR_CAP = 16_384;

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