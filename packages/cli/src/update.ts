import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_NAME = "getwired";
const UPDATE_CHECK_TIMEOUT_MS = 5000;

export function getLocalVersion(): string {
  const pkg = JSON.parse(
    readFileSync(join(__dirname, "..", "package.json"), "utf-8")
  );
  return pkg.version;
}

async function getLatestVersion(packageName: string): Promise<string | null> {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}/latest`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(UPDATE_CHECK_TIMEOUT_MS),
    });

    if (!response.ok) {
      return null;
    }

    const pkg = (await response.json()) as { version?: unknown };
    return typeof pkg.version === "string" ? pkg.version : null;
  } catch {
    // Network error or package not published yet — skip silently
    return null;
  }
}

function isNewer(latest: string, current: string): boolean {
  const parse = (v: string) => v.split(".").map(Number);
  const [lMaj, lMin, lPat] = parse(latest);
  const [cMaj, cMin, cPat] = parse(current);
  if (lMaj !== cMaj) return lMaj > cMaj;
  if (lMin !== cMin) return lMin > cMin;
  return lPat > cPat;
}

function shouldSkipUpdateCheck(): boolean {
  return (
    process.env.GETWIRED_DISABLE_UPDATE_CHECK === "1" ||
    Boolean(process.env.CI) ||
    !process.stdout.isTTY
  );
}

/**
 * Check for a newer version on npm and notify the user.
 * Designed to fail silently and avoid blocking the event loop.
 */
export async function notifyIfUpdateAvailable(): Promise<void> {
  if (shouldSkipUpdateCheck()) {
    return;
  }

  const current = getLocalVersion();
  const latest = await getLatestVersion(PACKAGE_NAME);

  if (!latest || !isNewer(latest, current)) {
    return;
  }

  process.stderr.write(
    `\n⬆  Update available: ${current} → ${latest}\n` +
      `   Run: npm install -g ${PACKAGE_NAME}@${latest}\n\n`
  );
}

export async function checkForUpdates(): Promise<void> {
  await notifyIfUpdateAvailable();
}
