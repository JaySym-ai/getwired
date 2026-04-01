import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import type { GetwiredSettings } from "../config/settings.js";
import type { NativePlatform } from "../providers/types.js";

const SEARCH_FILE_NAMES = new Set([
  "app.json",
  "app.config.json",
  "package.json",
  "capacitor.config.json",
  "capacitor.config.ts",
  "capacitor.config.js",
  "build.gradle",
  "build.gradle.kts",
  "AndroidManifest.xml",
  "Info.plist",
  "project.pbxproj",
]);

const IGNORED_DIRS = new Set([
  ".git",
  ".next",
  ".turbo",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
]);

interface NativeLaunchMemoryHints {
  ios: {
    bundleId?: string;
    launchCommand?: string;
    launchUrl?: string;
    workingDirectory?: string;
    source?: string;
  };
  android: {
    packageName?: string;
    activity?: string;
    launchCommand?: string;
    launchUrl?: string;
    workingDirectory?: string;
    source?: string;
  };
}

export interface ResolvedIosLaunchTarget {
  platform: "ios";
  bundleId: string;
  launchCommand?: string;
  launchUrl?: string;
  workingDirectory?: string;
  source: "memory" | "config" | "project";
  detectedFrom: string;
}

export interface ResolvedAndroidLaunchTarget {
  platform: "android";
  packageName: string;
  activity?: string;
  launchCommand?: string;
  launchUrl?: string;
  workingDirectory?: string;
  source: "memory" | "config" | "project";
  detectedFrom: string;
}

export type ResolvedNativeLaunchTarget = ResolvedIosLaunchTarget | ResolvedAndroidLaunchTarget;

interface DetectedCandidate {
  value: string;
  detectedFrom: string;
  confidence: number;
  launchCommand?: string;
  workingDirectory?: string;
}

interface DetectedAndroidCandidate extends DetectedCandidate {
  activity?: string;
}

export function parseNativeLaunchMemory(memory: string): NativeLaunchMemoryHints {
  const hints: NativeLaunchMemoryHints = {
    ios: {},
    android: {},
  };
  if (!memory) return hints;

  const sectionMatch = memory.match(/## Native Launch\n([\s\S]*?)(?=\n## |\n*$)/);
  if (!sectionMatch) return hints;

  const lines = sectionMatch[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "));

  for (const line of lines) {
    const match = line.match(/^- ([a-z]+)\.([a-zA-Z]+):\s*(.+)$/);
    if (!match) continue;
    const [, platform, key, value] = match;
    if (platform !== "ios" && platform !== "android") continue;
    if (platform === "ios") {
      const target = hints.ios;
      switch (key) {
        case "bundleId":
          target.bundleId = value.trim();
          break;
        case "launchUrl":
          target.launchUrl = value.trim();
          break;
        case "launchCommand":
          target.launchCommand = value.trim();
          break;
        case "workingDirectory":
          target.workingDirectory = value.trim();
          break;
        case "source":
          target.source = value.trim();
          break;
        default:
          break;
      }
      continue;
    }

    const target = hints.android;
    switch (key) {
      case "packageName":
        target.packageName = value.trim();
        break;
      case "activity":
        target.activity = value.trim();
        break;
      case "launchUrl":
        target.launchUrl = value.trim();
        break;
      case "launchCommand":
        target.launchCommand = value.trim();
        break;
      case "workingDirectory":
        target.workingDirectory = value.trim();
        break;
      case "source":
        target.source = value.trim();
        break;
      default:
        break;
    }
  }

  return hints;
}

export function upsertNativeLaunchMemory(
  memory: string,
  target: ResolvedNativeLaunchTarget,
): string {
  const hints = parseNativeLaunchMemory(memory);
  if (target.platform === "ios") {
    hints.ios.bundleId = target.bundleId;
    hints.ios.launchCommand = target.launchCommand;
    hints.ios.launchUrl = target.launchUrl;
    hints.ios.workingDirectory = target.workingDirectory;
    hints.ios.source = target.detectedFrom;
  } else {
    hints.android.packageName = target.packageName;
    hints.android.activity = target.activity;
    hints.android.launchCommand = target.launchCommand;
    hints.android.launchUrl = target.launchUrl;
    hints.android.workingDirectory = target.workingDirectory;
    hints.android.source = target.detectedFrom;
  }

  const sectionLines = ["## Native Launch"];
  if (hints.ios.bundleId) sectionLines.push(`- ios.bundleId: ${hints.ios.bundleId}`);
  if (hints.ios.launchCommand) sectionLines.push(`- ios.launchCommand: ${hints.ios.launchCommand}`);
  if (hints.ios.launchUrl) sectionLines.push(`- ios.launchUrl: ${hints.ios.launchUrl}`);
  if (hints.ios.workingDirectory) sectionLines.push(`- ios.workingDirectory: ${hints.ios.workingDirectory}`);
  if (hints.ios.source) sectionLines.push(`- ios.source: ${hints.ios.source}`);
  if (hints.android.packageName) sectionLines.push(`- android.packageName: ${hints.android.packageName}`);
  if (hints.android.activity) sectionLines.push(`- android.activity: ${hints.android.activity}`);
  if (hints.android.launchCommand) sectionLines.push(`- android.launchCommand: ${hints.android.launchCommand}`);
  if (hints.android.launchUrl) sectionLines.push(`- android.launchUrl: ${hints.android.launchUrl}`);
  if (hints.android.workingDirectory) sectionLines.push(`- android.workingDirectory: ${hints.android.workingDirectory}`);
  if (hints.android.source) sectionLines.push(`- android.source: ${hints.android.source}`);
  const newSection = `${sectionLines.join("\n")}\n`;

  if (!memory.trim()) return `${newSection}\n`;

  if (/## Native Launch\n/.test(memory)) {
    return memory.replace(/## Native Launch\n[\s\S]*?(?=\n## |\n*$)/, newSection.trimEnd());
  }

  const trimmed = memory.trimEnd();
  return `${trimmed}\n\n${newSection}`;
}

export function persistNativeLaunchTarget(
  settings: GetwiredSettings,
  target: ResolvedNativeLaunchTarget,
): GetwiredSettings {
  const native = settings.native ?? { ios: {}, android: {} };
  if (target.platform === "ios") {
    return {
      ...settings,
      native: {
        ...native,
        ios: {
          ...native.ios,
          bundleId: target.bundleId,
          launchCommand: target.launchCommand ?? native.ios.launchCommand,
          launchUrl: target.launchUrl ?? native.ios.launchUrl,
          workingDirectory: target.workingDirectory ?? native.ios.workingDirectory,
          source: target.detectedFrom,
        },
      },
    };
  }

  return {
    ...settings,
    native: {
      ...native,
      android: {
        ...native.android,
        packageName: target.packageName,
        activity: target.activity ?? native.android.activity,
        launchCommand: target.launchCommand ?? native.android.launchCommand,
        launchUrl: target.launchUrl ?? native.android.launchUrl,
        workingDirectory: target.workingDirectory ?? native.android.workingDirectory,
        source: target.detectedFrom,
      },
    },
  };
}

export async function resolveNativeLaunchTarget(
  projectPath: string,
  settings: GetwiredSettings,
  memory: string,
  platform: NativePlatform,
  options?: { skipCache?: boolean },
): Promise<ResolvedNativeLaunchTarget> {
  const memoryHints = parseNativeLaunchMemory(memory);
  const configHints = settings.native ?? { ios: {}, android: {} };
  const cachedAndroidPackageName = normalizeAndroidPackageName(memoryHints.android.packageName);
  const configuredAndroidPackageName = normalizeAndroidPackageName(configHints.android.packageName);

  if (!options?.skipCache) {
    if (platform === "ios" && memoryHints.ios.bundleId) {
      return {
        platform: "ios",
        bundleId: memoryHints.ios.bundleId,
        launchCommand: memoryHints.ios.launchCommand ?? configHints.ios.launchCommand,
        launchUrl: memoryHints.ios.launchUrl ?? configHints.ios.launchUrl,
        workingDirectory: memoryHints.ios.workingDirectory ?? configHints.ios.workingDirectory,
        source: "memory",
        detectedFrom: memoryHints.ios.source ?? "memory",
      };
    }

    if (platform === "android" && cachedAndroidPackageName) {
      return {
        platform: "android",
        packageName: cachedAndroidPackageName,
        activity: memoryHints.android.activity ?? configHints.android.activity,
        launchCommand: memoryHints.android.launchCommand ?? configHints.android.launchCommand,
        launchUrl: memoryHints.android.launchUrl ?? configHints.android.launchUrl,
        workingDirectory: memoryHints.android.workingDirectory ?? configHints.android.workingDirectory,
        source: "memory",
        detectedFrom: memoryHints.android.source ?? "memory",
      };
    }

    if (platform === "ios" && configHints.ios.bundleId) {
      return {
        platform: "ios",
        bundleId: configHints.ios.bundleId,
        launchCommand: configHints.ios.launchCommand,
        launchUrl: configHints.ios.launchUrl,
        workingDirectory: configHints.ios.workingDirectory,
        source: "config",
        detectedFrom: configHints.ios.source ?? ".getwired/config.json",
      };
    }

    if (platform === "android" && configuredAndroidPackageName) {
      return {
        platform: "android",
        packageName: configuredAndroidPackageName,
        activity: configHints.android.activity,
        launchCommand: configHints.android.launchCommand,
        launchUrl: configHints.android.launchUrl,
        workingDirectory: configHints.android.workingDirectory,
        source: "config",
        detectedFrom: configHints.android.source ?? ".getwired/config.json",
      };
    }
  }

  const detected = await inspectProjectNativeLaunchTarget(projectPath, platform);
  if (!detected) {
    const configPath = ".getwired/config.json";
    if (platform === "ios") {
      throw new Error(
        `Unable to determine which iOS app to launch. Add native.ios.bundleId to ${configPath} or run a project that exposes a detectable iOS bundle identifier.`,
      );
    }
    throw new Error(
      `Unable to determine which Android app to launch. Add native.android.packageName to ${configPath} or run a project that exposes a detectable Android applicationId/package.`,
    );
  }

  if (platform === "ios") {
    return {
      platform: "ios",
      bundleId: detected.value,
      launchCommand: detected.launchCommand ?? memoryHints.ios.launchCommand ?? configHints.ios.launchCommand,
      launchUrl: memoryHints.ios.launchUrl ?? configHints.ios.launchUrl,
      workingDirectory: detected.workingDirectory ?? memoryHints.ios.workingDirectory ?? configHints.ios.workingDirectory,
      source: "project",
      detectedFrom: detected.detectedFrom,
    };
  }

  const androidDetected = detected as DetectedAndroidCandidate;
  return {
    platform: "android",
    packageName: androidDetected.value,
    activity: androidDetected.activity ?? memoryHints.android.activity ?? configHints.android.activity,
    launchCommand: androidDetected.launchCommand ?? memoryHints.android.launchCommand ?? configHints.android.launchCommand,
    launchUrl: memoryHints.android.launchUrl ?? configHints.android.launchUrl,
    workingDirectory: androidDetected.workingDirectory ?? memoryHints.android.workingDirectory ?? configHints.android.workingDirectory,
    source: "project",
    detectedFrom: androidDetected.detectedFrom,
  };
}

export function describeNativeLaunchTarget(target: ResolvedNativeLaunchTarget): string {
  const commandSummary = target.launchCommand
    ? `; command ${target.launchCommand}${target.workingDirectory ? ` @ ${target.workingDirectory}` : ""}`
    : "";
  if (target.platform === "ios") {
    return `bundle ${target.bundleId} (${target.detectedFrom}${commandSummary})`;
  }
  return target.activity
    ? `package ${target.packageName} / ${target.activity} (${target.detectedFrom}${commandSummary})`
    : `package ${target.packageName} (${target.detectedFrom}${commandSummary})`;
}

async function inspectProjectNativeLaunchTarget(
  projectPath: string,
  platform: NativePlatform,
): Promise<DetectedCandidate | DetectedAndroidCandidate | undefined> {
  const files = await collectCandidateFiles(projectPath, projectPath, 0, 4);
  if (platform === "ios") {
    const candidates = await Promise.all([
      ...files
        .filter((filePath) => filePath.endsWith("package.json"))
        .map((filePath) => detectLaunchFromPackageJson(projectPath, filePath, "ios")),
      ...files
        .filter((filePath) => filePath.endsWith("project.pbxproj"))
        .map((filePath) => detectIosBundleFromPbxproj(projectPath, filePath)),
      ...files
        .filter((filePath) => filePath.endsWith("Info.plist"))
        .map((filePath) => detectIosBundleFromInfoPlist(projectPath, filePath)),
      ...files
        .filter((filePath) => filePath.endsWith("app.json") || filePath.endsWith("app.config.json"))
        .map((filePath) => detectExpoIosBundleId(projectPath, filePath)),
      ...files
        .filter((filePath) => filePath.includes("capacitor.config."))
        .map((filePath) => detectCapacitorAppId(projectPath, filePath, "ios")),
    ]);
    const winner = candidates
      .filter((candidate): candidate is DetectedCandidate => Boolean(candidate?.value))
      .sort((a, b) => b.confidence - a.confidence)[0];
    return attachBestLaunchCommand(winner, candidates);
  }

  const candidates = await Promise.all([
    ...files
      .filter((filePath) => filePath.endsWith("package.json"))
      .map((filePath) => detectLaunchFromPackageJson(projectPath, filePath, "android")),
    ...files
      .filter((filePath) => /android\/app\/build\.gradle(\.kts)?$/.test(normalizeSlashes(relative(projectPath, filePath))))
      .map((filePath) => detectAndroidPackageFromGradle(projectPath, filePath)),
    ...files
      .filter((filePath) => filePath.endsWith("AndroidManifest.xml"))
      .map((filePath) => detectAndroidPackageFromManifest(projectPath, filePath)),
    ...files
      .filter((filePath) => filePath.endsWith("app.json") || filePath.endsWith("app.config.json"))
      .map((filePath) => detectExpoAndroidPackage(projectPath, filePath)),
    ...files
      .filter((filePath) => filePath.includes("capacitor.config."))
      .map((filePath) => detectCapacitorAppId(projectPath, filePath, "android")),
  ]);
  const winner = candidates
    .filter((candidate): candidate is DetectedAndroidCandidate => Boolean(candidate?.value))
    .sort((a, b) => b.confidence - a.confidence)[0];
  return attachBestLaunchCommand(winner, candidates);
}

async function collectCandidateFiles(
  projectPath: string,
  currentDir: string,
  depth: number,
  maxDepth: number,
): Promise<string[]> {
  if (depth > maxDepth || !existsSync(currentDir)) return [];
  const entries = await readdir(currentDir, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      results.push(...await collectCandidateFiles(projectPath, join(currentDir, entry.name), depth + 1, maxDepth));
      continue;
    }

    if (SEARCH_FILE_NAMES.has(entry.name)) {
      results.push(join(currentDir, entry.name));
      continue;
    }

    if (entry.name.endsWith(".xcodeproj")) {
      const pbxproj = join(currentDir, entry.name, "project.pbxproj");
      if (existsSync(pbxproj)) results.push(pbxproj);
    }
  }

  return Array.from(new Set(results.filter((filePath) => filePath.startsWith(projectPath))));
}

async function detectExpoIosBundleId(projectPath: string, filePath: string): Promise<DetectedCandidate | undefined> {
  const parsed = await safeReadJson(filePath);
  const bundleId = parsed?.expo?.ios?.bundleIdentifier;
  if (typeof bundleId !== "string" || !bundleId.trim()) return undefined;
  return {
    value: bundleId.trim(),
    detectedFrom: normalizeSlashes(relative(projectPath, filePath)),
    launchCommand: "npx expo run:ios",
    workingDirectory: toWorkingDirectory(projectPath, filePath),
    confidence: 70,
  };
}

async function detectExpoAndroidPackage(projectPath: string, filePath: string): Promise<DetectedAndroidCandidate | undefined> {
  const parsed = await safeReadJson(filePath);
  const packageName = parsed?.expo?.android?.package;
  if (typeof packageName !== "string" || !packageName.trim()) return undefined;
  return {
    value: packageName.trim(),
    detectedFrom: normalizeSlashes(relative(projectPath, filePath)),
    launchCommand: "npx expo run:android",
    workingDirectory: toWorkingDirectory(projectPath, filePath),
    confidence: 70,
  };
}

async function detectCapacitorAppId(
  projectPath: string,
  filePath: string,
  platform?: NativePlatform,
): Promise<DetectedCandidate | undefined> {
  const content = await safeReadText(filePath);
  if (!content) return undefined;
  const match = content.match(/appId\s*[:=]\s*["']([^"']+)["']/);
  if (!match) return undefined;
  return {
    value: match[1].trim(),
    detectedFrom: normalizeSlashes(relative(projectPath, filePath)),
    launchCommand: platform ? `npx cap run ${platform}` : undefined,
    workingDirectory: toWorkingDirectory(projectPath, filePath),
    confidence: 60,
  };
}

async function detectAndroidPackageFromGradle(projectPath: string, filePath: string): Promise<DetectedAndroidCandidate | undefined> {
  const content = await safeReadText(filePath);
  if (!content) return undefined;
  const applicationId = content.match(/applicationId\s*[= ]\s*["']([^"']+)["']/);
  if (!applicationId) return undefined;
  return {
    value: applicationId[1].trim(),
    detectedFrom: normalizeSlashes(relative(projectPath, filePath)),
    confidence: 100,
  };
}

async function detectAndroidPackageFromManifest(projectPath: string, filePath: string): Promise<DetectedAndroidCandidate | undefined> {
  const content = await safeReadText(filePath);
  if (!content) return undefined;
  const pkg = content.match(/\spackage="([^"]+)"/);
  if (!pkg) return undefined;
  return {
    value: pkg[1].trim(),
    detectedFrom: normalizeSlashes(relative(projectPath, filePath)),
    confidence: 80,
  };
}

async function detectIosBundleFromPbxproj(projectPath: string, filePath: string): Promise<DetectedCandidate | undefined> {
  const content = await safeReadText(filePath);
  if (!content) return undefined;
  const matches = Array.from(content.matchAll(/PRODUCT_BUNDLE_IDENTIFIER = ([^;]+);/g))
    .map((match) => match[1].trim().replace(/^"(.*)"$/, "$1"))
    .filter((value) => value && !value.includes("$("));
  const bundleId = matches.find((value) => value.includes("."));
  if (!bundleId) return undefined;
  return {
    value: bundleId,
    detectedFrom: normalizeSlashes(relative(projectPath, filePath)),
    confidence: 100,
  };
}

async function detectIosBundleFromInfoPlist(projectPath: string, filePath: string): Promise<DetectedCandidate | undefined> {
  const content = await safeReadText(filePath);
  if (!content) return undefined;
  const match = content.match(/<key>CFBundleIdentifier<\/key>\s*<string>([^<]+)<\/string>/);
  if (!match) return undefined;
  const bundleId = match[1].trim();
  if (!bundleId || bundleId.includes("$(")) return undefined;
  return {
    value: bundleId,
    detectedFrom: normalizeSlashes(relative(projectPath, filePath)),
    confidence: 90,
  };
}

async function detectLaunchFromPackageJson(
  projectPath: string,
  filePath: string,
  platform: NativePlatform,
): Promise<DetectedCandidate | undefined> {
  const parsed = await safeReadJson(filePath);
  if (!parsed || typeof parsed !== "object") return undefined;

  const scripts = typeof parsed.scripts === "object" && parsed.scripts ? parsed.scripts : {};
  const dependencies = {
    ...(typeof parsed.dependencies === "object" && parsed.dependencies ? parsed.dependencies : {}),
    ...(typeof parsed.devDependencies === "object" && parsed.devDependencies ? parsed.devDependencies : {}),
  } as Record<string, string>;

  const platformScripts = platform === "ios"
    ? ["ios", "run:ios", "native:ios"]
    : ["android", "run:android", "native:android"];
  for (const scriptName of platformScripts) {
    if (typeof scripts[scriptName] === "string") {
      return {
        value: "",
        detectedFrom: normalizeSlashes(relative(projectPath, filePath)),
        launchCommand: `npm run ${scriptName}`,
        workingDirectory: toWorkingDirectory(projectPath, filePath),
        confidence: 85,
      };
    }
  }

  if (dependencies.expo) {
    return {
      value: "",
      detectedFrom: normalizeSlashes(relative(projectPath, filePath)),
      launchCommand: platform === "ios" ? "npx expo run:ios" : "npx expo run:android",
      workingDirectory: toWorkingDirectory(projectPath, filePath),
      confidence: 55,
    };
  }

  if (dependencies["@capacitor/core"]) {
    return {
      value: "",
      detectedFrom: normalizeSlashes(relative(projectPath, filePath)),
      launchCommand: platform === "ios" ? "npx cap run ios" : "npx cap run android",
      workingDirectory: toWorkingDirectory(projectPath, filePath),
      confidence: 50,
    };
  }

  if (dependencies["react-native"]) {
    return {
      value: "",
      detectedFrom: normalizeSlashes(relative(projectPath, filePath)),
      launchCommand: platform === "ios" ? "npx react-native run-ios" : "npx react-native run-android",
      workingDirectory: toWorkingDirectory(projectPath, filePath),
      confidence: 45,
    };
  }

  return undefined;
}

function attachBestLaunchCommand<T extends DetectedCandidate | DetectedAndroidCandidate>(
  winner: T | undefined,
  candidates: Array<T | undefined>,
): T | undefined {
  if (!winner || winner.launchCommand) return winner;
  const launchHint = candidates
    .filter((candidate): candidate is T => Boolean(candidate && candidate.launchCommand))
    .sort((a, b) => b.confidence - a.confidence)[0];
  if (!launchHint) return winner;
  return {
    ...winner,
    launchCommand: launchHint.launchCommand,
    workingDirectory: launchHint.workingDirectory ?? winner.workingDirectory,
  };
}

async function safeReadJson(filePath: string): Promise<any> {
  try {
    return JSON.parse(await readFile(filePath, "utf-8"));
  } catch {
    return undefined;
  }
}

async function safeReadText(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, "utf-8");
  } catch {
    return "";
  }
}

function normalizeSlashes(value: string): string {
  return value.split("\\").join("/");
}

function normalizeAndroidPackageName(value?: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (/unknown/i.test(trimmed) || /needs verification/i.test(trimmed)) return undefined;
  return /^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z0-9_]+)+$/.test(trimmed) ? trimmed : undefined;
}

function toWorkingDirectory(projectPath: string, filePath: string): string {
  const dir = normalizeSlashes(relative(projectPath, dirname(filePath)));
  return dir || ".";
}
