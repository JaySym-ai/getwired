import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import type { EmulatorDevice } from "./types.js";
import { requireAndroidTool } from "./android-sdk.js";

const execFileAsync = promisify(execFile);

const DEFAULT_TIMEOUT = 30_000;
const BOOT_TIMEOUT = 120_000;

async function exec(cmd: string, args: string[], timeout = DEFAULT_TIMEOUT): Promise<string> {
  const { stdout } = await execFileAsync(cmd, args, { encoding: "utf-8", timeout });
  return stdout.trim();
}

function execAdb(args: string[], timeout = DEFAULT_TIMEOUT): Promise<string> {
  return exec(requireAndroidTool("adb"), args, timeout);
}

function getEmulatorPath(): string {
  return requireAndroidTool("emulator");
}

// ─── Device Discovery ────────────────────────────────────────

export async function listAvds(): Promise<string[]> {
  const output = await exec(getEmulatorPath(), ["-list-avds"]);
  return output.split("\n").filter((l) => l.trim().length > 0);
}

export async function listRunningDevices(): Promise<EmulatorDevice[]> {
  const output = await execAdb(["devices"]);
  return output
    .split("\n")
    .slice(1)
    .filter((l) => l.includes("device") && !l.includes("offline"))
    .map((l) => {
      const id = l.split("\t")[0].trim();
      return { id, name: id, platform: "android" as const, state: "booted" as const };
    });
}

// ─── Lifecycle ───────────────────────────────────────────────

export function boot(avdName: string): ReturnType<typeof spawn> {
  return spawn(getEmulatorPath(), ["-avd", avdName, "-no-snapshot-save"], {
    stdio: "ignore",
    detached: true,
  });
}

export async function waitForBoot(timeout = BOOT_TIMEOUT): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const result = await execAdb(["shell", "getprop", "sys.boot_completed"], 5_000);
      if (result.trim() === "1") return;
    } catch { /* not ready yet */ }
    await new Promise((r) => setTimeout(r, 2_000));
  }
  throw new Error("Android emulator did not boot within timeout");
}

export async function shutdown(deviceId?: string): Promise<string> {
  const args = deviceId ? ["-s", deviceId, "emu", "kill"] : ["emu", "kill"];
  return execAdb(args);
}

// ─── Interaction ─────────────────────────────────────────────

export async function openUrl(url: string, deviceId?: string): Promise<string> {
  const args = deviceId ? ["-s", deviceId] : [];
  return execAdb([...args, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", url]);
}

export async function launchApp(packageName: string, deviceId?: string, activity?: string): Promise<string> {
  const args = deviceId ? ["-s", deviceId] : [];
  if (activity) {
    const qualifiedActivity = activity.includes("/") ? activity : `${packageName}/${activity}`;
    return execAdb([...args, "shell", "am", "start", "-n", qualifiedActivity]);
  }
  return execAdb([...args, "shell", "monkey", "-p", packageName, "-c", "android.intent.category.LAUNCHER", "1"]);
}

export async function openDeepLink(url: string, packageName: string, deviceId?: string): Promise<string> {
  const args = deviceId ? ["-s", deviceId] : [];
  return execAdb([
    ...args,
    "shell",
    "am",
    "start",
    "-a",
    "android.intent.action.VIEW",
    "-d",
    url,
    packageName,
  ]);
}

// Uses exec-out for direct binary pipe — faster than shell+pull (Emulator 36+)
export async function screenshot(path: string, deviceId?: string): Promise<string> {
  const args = deviceId ? ["-s", deviceId] : [];
  const { writeFile } = await import("node:fs/promises");
  const adbPath = requireAndroidTool("adb");
  try {
    // exec-out streams raw PNG directly — single command, no temp file on device
    const { stdout } = await execFileAsync(adbPath, [...args, "exec-out", "screencap", "-p"], {
      encoding: "buffer" as any,
      maxBuffer: 20 * 1024 * 1024,
      timeout: DEFAULT_TIMEOUT,
    });
    await writeFile(path, stdout);
    return path;
  } catch {
    // Fallback for older emulator versions: screencap to device then pull
    const remotePath = "/sdcard/screenshot.png";
    await execAdb([...args, "shell", "screencap", "-p", remotePath]);
    return execAdb([...args, "pull", remotePath, path]);
  }
}

// ─── Input: Touch & Gestures ─────────────────────────────────

export async function tap(x: number, y: number, deviceId?: string): Promise<string> {
  const args = deviceId ? ["-s", deviceId] : [];
  return execAdb([...args, "shell", "input", "tap", String(x), String(y)]);
}

export async function longPress(x: number, y: number, durationMs = 1000, deviceId?: string): Promise<string> {
  const args = deviceId ? ["-s", deviceId] : [];
  // Long press is a swipe to the same point with duration
  return execAdb([...args, "shell", "input", "swipe", String(x), String(y), String(x), String(y), String(durationMs)]);
}

export async function swipe(
  x1: number, y1: number, x2: number, y2: number, durationMs = 300, deviceId?: string,
): Promise<string> {
  const args = deviceId ? ["-s", deviceId] : [];
  return execAdb([
    ...args, "shell", "input", "swipe",
    String(x1), String(y1), String(x2), String(y2), String(durationMs),
  ]);
}

export async function typeText(text: string, deviceId?: string): Promise<string> {
  const args = deviceId ? ["-s", deviceId] : [];
  // Escape spaces for adb input text
  const escaped = text.replace(/ /g, "%s");
  return execAdb([...args, "shell", "input", "text", escaped]);
}

export async function pressKey(keycode: string, deviceId?: string): Promise<string> {
  const args = deviceId ? ["-s", deviceId] : [];
  return execAdb([...args, "shell", "input", "keyevent", keycode]);
}

// Common keycodes: HOME=3, BACK=4, POWER=26, ENTER=66, DEL=67,
// MENU=82, VOLUME_UP=24, VOLUME_DOWN=25, CAMERA=27, TAB=61

// ─── UI Mode (Dark/Light) ────────────────────────────────────
// Available on API 29+ (Android 10+)

export async function setDarkMode(enabled: boolean, deviceId?: string): Promise<string> {
  const args = deviceId ? ["-s", deviceId] : [];
  return execAdb([...args, "shell", "cmd", "uimode", "night", enabled ? "yes" : "no"]);
}

// ─── Screen Recording ────────────────────────────────────────

export function startRecording(outputPath: string, deviceId?: string): ReturnType<typeof spawn> {
  const args = deviceId ? ["-s", deviceId] : [];
  // Returns child process — call .kill("SIGINT") to stop, then pull the file
  return spawn(requireAndroidTool("adb"), [...args, "shell", "screenrecord", "/sdcard/recording.mp4"], {
    stdio: "ignore",
  });
}

export async function pullRecording(localPath: string, deviceId?: string): Promise<string> {
  const args = deviceId ? ["-s", deviceId] : [];
  return execAdb([...args, "pull", "/sdcard/recording.mp4", localPath]);
}

// ─── Accessibility / UI Dump ─────────────────────────────────

export async function uiDump(deviceId?: string): Promise<string> {
  const args = deviceId ? ["-s", deviceId] : [];
  const remotePath = "/sdcard/uidump.xml";
  await execAdb([...args, "shell", "uiautomator", "dump", remotePath]);
  return execAdb([...args, "shell", "cat", remotePath]);
}

// ─── Foldable Device Support (Emulator 33.1+) ───────────────

export async function fold(deviceId?: string): Promise<string> {
  const args = deviceId ? ["-s", deviceId] : [];
  return execAdb([...args, "emu", "fold"]);
}

export async function unfold(deviceId?: string): Promise<string> {
  const args = deviceId ? ["-s", deviceId] : [];
  return execAdb([...args, "emu", "unfold"]);
}

// ─── AVD Info (Emulator 36+) ─────────────────────────────────

export async function getAvdPath(deviceId?: string): Promise<string> {
  const args = deviceId ? ["-s", deviceId] : [];
  return execAdb([...args, "emu", "avd", "path"]);
}

export async function getSnapshotPath(deviceId?: string): Promise<string> {
  const args = deviceId ? ["-s", deviceId] : [];
  return execAdb([...args, "emu", "avd", "snapshotpath"]);
}

// ─── Shell, Install & Permissions ────────────────────────────

export async function shell(command: string, deviceId?: string): Promise<string> {
  const args = deviceId ? ["-s", deviceId] : [];
  return execAdb([...args, "shell", command]);
}

export async function installApk(apkPath: string, deviceId?: string): Promise<string> {
  const args = deviceId ? ["-s", deviceId] : [];
  return execAdb([...args, "install", "-r", apkPath], 60_000);
}

export async function uninstallApp(packageName: string, deviceId?: string): Promise<string> {
  const args = deviceId ? ["-s", deviceId] : [];
  return execAdb([...args, "uninstall", packageName]);
}

export async function grantPermission(packageName: string, permission: string, deviceId?: string): Promise<string> {
  const args = deviceId ? ["-s", deviceId] : [];
  return execAdb([...args, "shell", "pm", "grant", packageName, permission]);
}

export async function revokePermission(packageName: string, permission: string, deviceId?: string): Promise<string> {
  const args = deviceId ? ["-s", deviceId] : [];
  return execAdb([...args, "shell", "pm", "revoke", packageName, permission]);
}

// ─── Location ────────────────────────────────────────────────

export async function setLocation(lat: number, lon: number, deviceId?: string): Promise<string> {
  const args = deviceId ? ["-s", deviceId] : [];
  return execAdb([...args, "emu", "geo", "fix", String(lon), String(lat)]);
}

// ─── Device Properties ───────────────────────────────────────

export async function getProperty(prop: string, deviceId?: string): Promise<string> {
  const args = deviceId ? ["-s", deviceId] : [];
  return execAdb([...args, "shell", "getprop", prop]);
}

export async function getApiLevel(deviceId?: string): Promise<number> {
  const level = await getProperty("ro.build.version.sdk", deviceId);
  return parseInt(level, 10);
}

export async function getDeviceName(deviceId?: string): Promise<string> {
  return getProperty("ro.product.model", deviceId);
}
