import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { EmulatorDevice } from "./types.js";

const execFileAsync = promisify(execFile);

const DEFAULT_TIMEOUT = 30_000;

async function exec(cmd: string, args: string[], timeout = DEFAULT_TIMEOUT): Promise<string> {
  const { stdout } = await execFileAsync(cmd, args, { encoding: "utf-8", timeout });
  return stdout.trim();
}

async function simctl(args: string[], timeout = DEFAULT_TIMEOUT): Promise<string> {
  return exec("xcrun", ["simctl", ...args], timeout);
}

// ─── Device Discovery ────────────────────────────────────────

export async function listDevices(): Promise<EmulatorDevice[]> {
  const output = await simctl(["list", "devices", "-j"]);
  const parsed = JSON.parse(output);
  const devices: EmulatorDevice[] = [];
  const deviceMap = parsed.devices || {};
  for (const [runtime, devList] of Object.entries(deviceMap)) {
    if (!runtime.includes("iOS")) continue;
    for (const dev of devList as any[]) {
      if (!dev.isAvailable) continue;
      devices.push({
        id: dev.udid,
        name: `${dev.name} (${runtime.split(".").pop()})`,
        platform: "ios",
        state: dev.state === "Booted" ? "booted" : "shutdown",
      });
    }
  }
  return devices;
}

export async function listBootedDevices(): Promise<EmulatorDevice[]> {
  const all = await listDevices();
  return all.filter((d) => d.state === "booted");
}

// ─── Lifecycle ───────────────────────────────────────────────

export async function boot(udid: string): Promise<string> {
  return simctl(["boot", udid]);
}

export async function shutdown(udid: string): Promise<string> {
  return simctl(["shutdown", udid]);
}

// ─── Interaction ─────────────────────────────────────────────

export async function openUrl(url: string, udid?: string): Promise<string> {
  const args = udid ? ["openurl", udid, url] : ["openurl", "booted", url];
  return simctl(args);
}

export async function screenshot(path: string, udid?: string): Promise<string> {
  const args = udid
    ? ["io", udid, "screenshot", path]
    : ["io", "booted", "screenshot", path];
  return simctl(args);
}

// Status bar override — fixed in Xcode 15.3+ (xcrun 68) but was broken iOS 16.1–17.
// Still flaky on some Xcode/iOS combos — always call inside try/catch.
export async function overrideStatusBar(udid?: string): Promise<string> {
  const device = udid ?? "booted";
  return simctl([
    "status_bar", device, "override",
    "--time", "9:41",
    "--dataNetwork", "wifi",
    "--wifiMode", "active",
    "--wifiBars", "3",
    "--cellularMode", "active",
    "--cellularBars", "4",
    "--batteryState", "charged",
    "--batteryLevel", "100",
  ]);
}

export async function clearStatusBar(udid?: string): Promise<string> {
  const device = udid ?? "booted";
  return simctl(["status_bar", device, "clear"]);
}

// ─── Appearance (Dark/Light Mode) ────────────────────────────

export async function setAppearance(mode: "light" | "dark", udid?: string): Promise<string> {
  const device = udid ?? "booted";
  return simctl(["ui", device, "appearance", mode]);
}

export async function getAppearance(udid?: string): Promise<string> {
  const device = udid ?? "booted";
  return simctl(["ui", device, "appearance"]);
}

// ─── App Management ──────────────────────────────────────────

export async function installApp(appPath: string, udid?: string): Promise<string> {
  const device = udid ?? "booted";
  return simctl(["install", device, appPath], 60_000);
}

export async function uninstallApp(bundleId: string, udid?: string): Promise<string> {
  const device = udid ?? "booted";
  return simctl(["uninstall", device, bundleId]);
}

export async function launchApp(bundleId: string, udid?: string): Promise<string> {
  const device = udid ?? "booted";
  return simctl(["launch", device, bundleId]);
}

export async function terminateApp(bundleId: string, udid?: string): Promise<string> {
  const device = udid ?? "booted";
  try {
    return await simctl(["terminate", device, bundleId]);
  } catch {
    return ""; // App may not be running
  }
}

export async function listApps(udid?: string): Promise<string> {
  const device = udid ?? "booted";
  return simctl(["listapps", device]);
}

// ─── Privacy & Permissions ───────────────────────────────────
// Services: all, calendar, contacts-limited, contacts, location,
//           location-always, photos-add, photos, media-library,
//           microphone, motion, reminders, siri

export async function grantPermission(
  service: string, bundleId: string, udid?: string,
): Promise<string> {
  const device = udid ?? "booted";
  return simctl(["privacy", device, "grant", service, bundleId]);
}

export async function revokePermission(
  service: string, bundleId: string, udid?: string,
): Promise<string> {
  const device = udid ?? "booted";
  return simctl(["privacy", device, "revoke", service, bundleId]);
}

export async function resetPermissions(
  service: string, bundleId?: string, udid?: string,
): Promise<string> {
  const device = udid ?? "booted";
  const args = ["privacy", device, "reset", service];
  if (bundleId) args.push(bundleId);
  return simctl(args);
}

// ─── Keychain ────────────────────────────────────────────────

export async function addRootCert(certPath: string, udid?: string): Promise<string> {
  const device = udid ?? "booted";
  return simctl(["keychain", device, "add-root-cert", certPath]);
}

export async function addCert(certPath: string, udid?: string): Promise<string> {
  const device = udid ?? "booted";
  return simctl(["keychain", device, "add-cert", certPath]);
}

export async function resetKeychain(udid?: string): Promise<string> {
  const device = udid ?? "booted";
  return simctl(["keychain", device, "reset"]);
}

// ─── Video Recording ─────────────────────────────────────────

export async function startRecording(outputPath: string, udid?: string): Promise<ReturnType<typeof import("node:child_process").spawn>> {
  const device = udid ?? "booted";
  const { spawn: spawnProcess } = await import("node:child_process");
  // Returns the child process — call .kill("SIGINT") to stop recording
  return spawnProcess("xcrun", ["simctl", "io", device, "recordVideo", outputPath], {
    stdio: "ignore",
  });
}

// ─── Device Management ───────────────────────────────────────

export async function eraseDevice(udid: string): Promise<string> {
  return simctl(["erase", udid]);
}

export async function cloneDevice(udid: string, newName: string): Promise<string> {
  return simctl(["clone", udid, newName]);
}

export async function deleteDevice(udid: string): Promise<string> {
  return simctl(["delete", udid]);
}

export async function deleteUnavailable(): Promise<string> {
  return simctl(["delete", "unavailable"]);
}

// ─── Utilities ───────────────────────────────────────────────

export async function setLocation(lat: number, lon: number, udid?: string): Promise<string> {
  const device = udid ?? "booted";
  return simctl(["location", device, "set", `${lat},${lon}`]);
}

export async function clearLocation(udid?: string): Promise<string> {
  const device = udid ?? "booted";
  return simctl(["location", device, "clear"]);
}

export async function pushNotification(
  bundleId: string,
  payload: Record<string, unknown>,
  udid?: string,
): Promise<string> {
  const device = udid ?? "booted";
  const payloadJson = JSON.stringify({
    "Simulator Target Bundle": bundleId,
    aps: payload,
  });
  const { writeFile, unlink } = await import("node:fs/promises");
  const tmpPath = `/tmp/gw-push-${Date.now()}.json`;
  await writeFile(tmpPath, payloadJson, "utf-8");
  try {
    return await simctl(["push", device, bundleId, tmpPath]);
  } finally {
    await unlink(tmpPath).catch(() => {});
  }
}

export async function addMedia(mediaPath: string, udid?: string): Promise<string> {
  const device = udid ?? "booted";
  return simctl(["addmedia", device, mediaPath]);
}

export async function icloudSync(udid?: string): Promise<string> {
  const device = udid ?? "booted";
  return simctl(["icloud_sync", device]);
}

// ─── Diagnostics ─────────────────────────────────────────────

export async function diagnose(outputDir?: string): Promise<string> {
  const args = ["diagnose", "-l"]; // -l for lightweight (no logs)
  if (outputDir) args.push("--output", outputDir);
  return simctl(args, 60_000);
}

export async function getBootStatus(udid: string): Promise<string> {
  return simctl(["bootstatus", udid, "-b"]);
}

// ─── AXe CLI: Touch, Type, Swipe, Gestures ─────────────────
// AXe uses Apple's Accessibility APIs + HID injection for native interaction.
// Install via: brew tap cameroncooke/axe && brew install axe

async function axe(args: string[], timeout = DEFAULT_TIMEOUT): Promise<string> {
  return exec("axe", args, timeout);
}

export async function hasAxe(): Promise<boolean> {
  try {
    await exec("which", ["axe"], 5_000);
    return true;
  } catch {
    return false;
  }
}

export async function tap(x: number, y: number, udid?: string): Promise<string> {
  const args = ["-x", String(Math.round(x)), "-y", String(Math.round(y))];
  if (udid) args.push("--udid", udid);
  return axe(["tap", ...args]);
}

export async function longPress(x: number, y: number, durationMs = 1000, udid?: string): Promise<string> {
  const args = ["-x", String(Math.round(x)), "-y", String(Math.round(y)), "--duration", String(durationMs / 1000)];
  if (udid) args.push("--udid", udid);
  return axe(["tap", "--long-press", ...args]);
}

export async function swipe(
  startX: number, startY: number, endX: number, endY: number, durationMs = 300, udid?: string,
): Promise<string> {
  const args = [
    "--start-x", String(Math.round(startX)),
    "--start-y", String(Math.round(startY)),
    "--end-x", String(Math.round(endX)),
    "--end-y", String(Math.round(endY)),
    "--duration", String(durationMs / 1000),
  ];
  if (udid) args.push("--udid", udid);
  return axe(["swipe", ...args]);
}

export async function typeText(text: string, udid?: string): Promise<string> {
  const args = [text];
  if (udid) args.push("--udid", udid);
  return axe(["type", ...args]);
}

export async function gesture(name: string, udid?: string): Promise<string> {
  const args = [name];
  if (udid) args.push("--udid", udid);
  return axe(["gesture", ...args]);
}

export async function pressKey(key: string, udid?: string): Promise<string> {
  const args = [key];
  if (udid) args.push("--udid", udid);
  return axe(["key", ...args]);
}

// ─── UI Dump (Accessibility Tree) ───────────────────────────

export async function uiDump(udid?: string): Promise<string> {
  // Use accessibility inspector via simctl or axe to get the UI tree
  // axe provides accessibility queries; fall back to simctl accessibility audit
  try {
    const args = udid ? ["--udid", udid] : [];
    return await axe(["list", ...args]);
  } catch {
    // Fallback: use simctl's accessibility audit for a UI overview
    const device = udid ?? "booted";
    return simctl(["accessibility_audit", device]).catch(() => "");
  }
}
