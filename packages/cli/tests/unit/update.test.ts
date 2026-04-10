import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { notifyIfUpdateAvailable } from "../../src/update.js";

const UPDATE_SOURCE_URL = new URL("../../src/update.ts", import.meta.url);

type IsNewer = (latest: string, current: string) => boolean;

let isNewer: IsNewer;
const tempDirs: string[] = [];

before(async () => {
  const source = readFileSync(UPDATE_SOURCE_URL, "utf8");
  const tempDir = mkdtempSync(join(tmpdir(), "getwired-update-test-"));
  const exposedModulePath = join(tempDir, "update.exposed.ts");

  writeFileSync(exposedModulePath, `${source}\nexport { isNewer };\n`, "utf8");
  tempDirs.push(tempDir);

  ({ isNewer } = (await import(
    `${pathToFileURL(exposedModulePath).href}?t=${Date.now()}`
  )) as { isNewer: IsNewer });
});

after(() => {
  for (const tempDir of tempDirs) {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

function setEnv(name: "GETWIRED_DISABLE_UPDATE_CHECK" | "CI", value?: string): () => void {
  const previous = process.env[name];

  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }

  return () => {
    if (previous === undefined) {
      delete process.env[name];
      return;
    }

    process.env[name] = previous;
  };
}

function setStdoutIsTTY(value: boolean): () => void {
  const descriptor = Object.getOwnPropertyDescriptor(process.stdout, "isTTY");

  Object.defineProperty(process.stdout, "isTTY", {
    configurable: true,
    value,
  });

  return () => {
    if (descriptor) {
      Object.defineProperty(process.stdout, "isTTY", descriptor);
      return;
    }

    delete (process.stdout as { isTTY?: boolean }).isTTY;
  };
}

async function runUpdateCheck(options: {
  latestVersion?: string;
  disableUpdateCheck?: string;
  ci?: string;
  isTTY?: boolean;
} = {}) {
  const restoreDisableCheck = setEnv(
    "GETWIRED_DISABLE_UPDATE_CHECK",
    options.disableUpdateCheck
  );
  const restoreCI = setEnv("CI", options.ci);
  const restoreTTY = setStdoutIsTTY(options.isTTY ?? true);
  const originalFetch = globalThis.fetch;
  const originalWrite = process.stderr.write;
  const fetchCalls: string[] = [];
  let stderr = "";

  globalThis.fetch = (async (...args: Parameters<typeof fetch>) => {
    fetchCalls.push(String(args[0]));
    return {
      ok: true,
      json: async () => ({ version: options.latestVersion ?? "0.0.19" }),
    } as never;
  }) as typeof fetch;

  process.stderr.write = ((chunk: string | Uint8Array) => {
    stderr += String(chunk);
    return true;
  }) as typeof process.stderr.write;

  try {
    await notifyIfUpdateAvailable();
    return { fetchCalls, stderr };
  } finally {
    globalThis.fetch = originalFetch;
    process.stderr.write = originalWrite;
    restoreTTY();
    restoreCI();
    restoreDisableCheck();
  }
}

describe("update module", () => {
  it("isNewer compares semantic versions numerically", () => {
    assert.equal(isNewer("0.0.19", "0.0.18"), true);
    assert.equal(isNewer("0.10.0", "0.2.0"), true);
    assert.equal(isNewer("1.0.0", "0.99.99"), true);
    assert.equal(isNewer("0.0.18", "0.0.18"), false);
    assert.equal(isNewer("0.0.17", "0.0.18"), false);
  });

  it("skips the update check when GETWIRED_DISABLE_UPDATE_CHECK=1", async () => {
    const result = await runUpdateCheck({ disableUpdateCheck: "1" });

    assert.deepEqual(result.fetchCalls, []);
    assert.equal(result.stderr, "");
  });

  it("skips the update check when CI=true", async () => {
    const result = await runUpdateCheck({ ci: "true" });

    assert.deepEqual(result.fetchCalls, []);
    assert.equal(result.stderr, "");
  });

  it("skips the update check when stdout is not a TTY", async () => {
    const result = await runUpdateCheck({ isTTY: false });

    assert.deepEqual(result.fetchCalls, []);
    assert.equal(result.stderr, "");
  });

  it("only writes a manual upgrade notice when a newer version is available", async () => {
    const result = await runUpdateCheck({ latestVersion: "99.0.0" });
    const source = readFileSync(UPDATE_SOURCE_URL, "utf8");

    assert.equal(result.fetchCalls.length, 1);
    assert.match(result.fetchCalls[0], /registry\.npmjs\.org\/getwired\/latest/);
    assert.match(result.stderr, /Update available: .+ → 99\.0\.0/);
    assert.match(result.stderr, /Run: npm install -g getwired@99\.0\.0/);
    assert.doesNotMatch(source, /\bexecSync\b/);
  });
});