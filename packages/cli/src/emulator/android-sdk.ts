import { accessSync, constants, existsSync } from "node:fs";
import { homedir } from "node:os";
import { basename, delimiter, dirname, join } from "node:path";

export interface AndroidSdkInfo {
  sdkRoot?: string;
  sdkSource?: string;
  adbPath?: string;
  emulatorPath?: string;
}

type AndroidTool = "adb" | "emulator";

let cachedSdkInfo: AndroidSdkInfo | undefined;

function getBinaryName(tool: AndroidTool): string {
  return process.platform === "win32" ? `${tool}.exe` : tool;
}

function isExecutable(path: string): boolean {
  try {
    accessSync(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function findCommandInPath(tool: AndroidTool): string | undefined {
  const pathEnv = process.env.PATH;
  if (!pathEnv) return undefined;

  const binaryName = getBinaryName(tool);
  for (const entry of pathEnv.split(delimiter)) {
    if (!entry) continue;
    const candidate = join(entry, binaryName);
    if (isExecutable(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

function inferSdkRootFromBinary(binaryPath: string, expectedDir: string): string | undefined {
  const binaryDir = dirname(binaryPath);
  if (basename(binaryDir) !== expectedDir) {
    return undefined;
  }

  const sdkRoot = dirname(binaryDir);
  return existsSync(sdkRoot) ? sdkRoot : undefined;
}

function getDefaultSdkRoots(): string[] {
  const home = homedir();

  if (process.platform === "darwin") {
    return [
      join(home, "Library", "Android", "sdk"),
      join(home, "Android", "Sdk"),
      join("/Library", "Android", "sdk"),
    ];
  }

  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA;
    return localAppData ? [join(localAppData, "Android", "Sdk")] : [];
  }

  return [
    join(home, "Android", "Sdk"),
    join(home, "Android", "sdk"),
    "/usr/local/share/android-sdk",
    "/opt/android-sdk",
  ];
}

function resolveSdkTool(sdkRoot: string | undefined, tool: AndroidTool, pathFallback: string | undefined): string | undefined {
  if (sdkRoot) {
    const subdir = tool === "adb" ? "platform-tools" : "emulator";
    const candidate = join(sdkRoot, subdir, getBinaryName(tool));
    if (isExecutable(candidate)) {
      return candidate;
    }
  }

  return pathFallback;
}

export function getAndroidSdkInfo(): AndroidSdkInfo {
  if (cachedSdkInfo) {
    return cachedSdkInfo;
  }

  const adbOnPath = findCommandInPath("adb");
  const emulatorOnPath = findCommandInPath("emulator");
  const envSdkRoot = process.env.ANDROID_HOME?.trim() || process.env.ANDROID_SDK_ROOT?.trim();
  const envSdkSource = process.env.ANDROID_HOME?.trim()
    ? "ANDROID_HOME"
    : process.env.ANDROID_SDK_ROOT?.trim()
      ? "ANDROID_SDK_ROOT"
      : undefined;

  const candidates: Array<{ root: string; source: string }> = [];
  const seen = new Set<string>();

  const addCandidate = (root: string | undefined, source: string) => {
    if (!root || seen.has(root)) return;
    seen.add(root);
    candidates.push({ root, source });
  };

  addCandidate(envSdkRoot, envSdkSource ?? "environment");
  addCandidate(adbOnPath ? inferSdkRootFromBinary(adbOnPath, "platform-tools") : undefined, "PATH");
  addCandidate(emulatorOnPath ? inferSdkRootFromBinary(emulatorOnPath, "emulator") : undefined, "PATH");

  for (const root of getDefaultSdkRoots()) {
    addCandidate(root, "default path");
  }

  const resolvedSdk = candidates.find(({ root }) => existsSync(root));
  const sdkRoot = resolvedSdk?.root;

  cachedSdkInfo = {
    sdkRoot,
    sdkSource: resolvedSdk?.source,
    adbPath: resolveSdkTool(sdkRoot, "adb", adbOnPath),
    emulatorPath: resolveSdkTool(sdkRoot, "emulator", emulatorOnPath),
  };

  return cachedSdkInfo;
}

export function requireAndroidTool(tool: AndroidTool): string {
  const info = getAndroidSdkInfo();
  const resolved = tool === "adb" ? info.adbPath : info.emulatorPath;
  if (resolved) {
    return resolved;
  }

  const installTarget = tool === "adb" ? "platform-tools" : "the emulator component";
  throw new Error(`Android ${tool} not found. Install Android Studio with ${installTarget}, or add it to PATH.`);
}
