import { PostHog } from "posthog-node";
import { readFileSync, writeFileSync, mkdirSync, existsSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { homedir } from "node:os";

// ── PostHog project config (injected at build time via tsup env) ──
const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY ?? "";
const POSTHOG_HOST = process.env.POSTHOG_HOST ?? "https://us.i.posthog.com";

// ── Telemetry config persistence ────────────────────────────
const TELEMETRY_DIR = join(homedir(), ".getwired");
const TELEMETRY_FILE = join(TELEMETRY_DIR, "telemetry.json");

interface TelemetryConfig {
  anonymousId: string;
  enabled: boolean;
  noticeShown: boolean;
}

function loadTelemetryConfig(): TelemetryConfig {
  try {
    if (existsSync(TELEMETRY_FILE)) {
      const raw = JSON.parse(readFileSync(TELEMETRY_FILE, "utf-8"));
      // Validate shape — never trust disk data blindly
      if (typeof raw.anonymousId !== "string" || typeof raw.enabled !== "boolean") {
        throw new Error("invalid config");
      }
      return {
        anonymousId: raw.anonymousId,
        enabled: raw.enabled,
        noticeShown: raw.noticeShown === true,
      };
    }
  } catch {
    // corrupted or invalid file — regenerate
  }
  const config: TelemetryConfig = {
    anonymousId: randomUUID(),
    enabled: true,
    noticeShown: false,
  };
  saveTelemetryConfig(config);
  return config;
}

function saveTelemetryConfig(config: TelemetryConfig): void {
  try {
    mkdirSync(TELEMETRY_DIR, { recursive: true });
    writeFileSync(TELEMETRY_FILE, JSON.stringify(config, null, 2) + "\n", { mode: 0o600 });
    // Ensure permissions even if file already existed with wrong perms
    chmodSync(TELEMETRY_FILE, 0o600);
  } catch {
    // best-effort — don't break the CLI
  }
}

// ── First-run notice ────────────────────────────────────────
function showTelemetryNoticeIfNeeded(): void {
  const config = loadTelemetryConfig();
  if (config.noticeShown || !config.enabled) return;

  process.stderr.write(
    "\n" +
    "  ℹ  GetWired collects anonymous usage analytics to improve the product.\n" +
    "     No private data, URLs, code, file paths, or error details are ever sent.\n" +
    "     You can opt out anytime: set GETWIRED_TELEMETRY=0 or DO_NOT_TRACK=1\n" +
    "\n",
  );

  saveTelemetryConfig({ ...config, noticeShown: true });
}

// ── PII scrubbing ───────────────────────────────────────────
const PATH_RE = /(?:\/[^\s/:*?"<>|]+){2,}/g;
const HOME_RE = new RegExp(homedir().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
const WIN_PATH_RE = /[A-Z]:\\(?:[^\s/:*?"<>|\\]+\\){2,}/gi;
const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/g;

function stripPii(text: string): string {
  return text
    .replace(HOME_RE, "~")
    .replace(PATH_RE, "[path]")
    .replace(WIN_PATH_RE, "[path]")
    .replace(EMAIL_RE, "[email]");
}

// ── Opt-out check ───────────────────────────────────────────
let projectTelemetryDisabled = false;

/**
 * Call this early with the project's `settings.telemetry` value
 * so that captures respect the per-project config toggle.
 */
export function setProjectTelemetry(enabled: boolean): void {
  projectTelemetryDisabled = !enabled;
}

function isDisabled(): boolean {
  if (process.env.GETWIRED_TELEMETRY === "0") return true;
  if (process.env.DO_NOT_TRACK === "1") return true;
  if (projectTelemetryDisabled) return true;
  const config = loadTelemetryConfig();
  return !config.enabled;
}

// ── Singleton client ────────────────────────────────────────
let client: PostHog | null = null;
let distinctId: string | null = null;

function getClient(): PostHog | null {
  if (isDisabled()) return null;
  if (!POSTHOG_API_KEY) return null;

  if (!client) {
    showTelemetryNoticeIfNeeded();
    const config = loadTelemetryConfig();
    distinctId = config.anonymousId;
    client = new PostHog(POSTHOG_API_KEY, {
      host: POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return client;
}

function getDistinctId(): string {
  if (!distinctId) {
    distinctId = loadTelemetryConfig().anonymousId;
  }
  return distinctId;
}

// ── Public API ──────────────────────────────────────────────

export function captureEvent(event: string, properties?: Record<string, unknown>): void {
  try {
    const ph = getClient();
    if (!ph) return;
    ph.capture({
      distinctId: getDistinctId(),
      event,
      properties: {
        ...properties,
        $process_person_profile: false,
      },
    });
  } catch {
    // never break the CLI over telemetry
  }
}

export async function shutdownTelemetry(): Promise<void> {
  try {
    if (client) {
      await client.shutdown(3000);
      client = null;
    }
  } catch {
    // best-effort
  }
}

/**
 * Capture a test-started event with provider, persona, and platform info.
 */
export function captureTestStarted(props: {
  provider: string;
  persona: string;
  platform: "web" | "desktop" | "native";
  deviceProfile?: string;
  cliVersion: string;
}): void {
  captureEvent("cli_test_started", props);
}

/**
 * Capture a test-completed event with results summary.
 */
export function captureTestCompleted(props: {
  provider: string;
  persona: string;
  platform: "web" | "desktop" | "native";
  durationMs: number;
  findingsCount: number;
  passed: number;
  failed: number;
  warnings: number;
  cliVersion: string;
}): void {
  captureEvent("cli_test_completed", props);
}

/**
 * Capture a test-errored event when a session throws.
 * Error messages are scrubbed of file paths, home dirs, and emails.
 */
export function captureTestErrored(props: {
  provider: string;
  persona: string;
  platform: "web" | "desktop" | "native";
  error: string;
  cliVersion: string;
}): void {
  captureEvent("cli_test_errored", {
    ...props,
    error: stripPii(props.error).slice(0, 200),
  });
}
