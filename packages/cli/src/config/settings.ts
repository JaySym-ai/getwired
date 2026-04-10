import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { DeviceProfile, ProviderAuth } from "../providers/types.js";
import type { PayloadCategory } from "../security/payloads.js";

const DEFAULT_SHOW_BROWSER = process.env.CI !== "true"
  && (process.platform !== "linux" || Boolean(process.env.DISPLAY || process.env.WAYLAND_DISPLAY));

export interface AuthCookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
}

export interface AuthConfig {
  /** Cookies to inject into the browser before testing. Values starting with $ are resolved from env vars. */
  cookies: AuthCookie[];
  /** localStorage key/value pairs to inject. Values starting with $ are resolved from env vars. */
  localStorage: Record<string, string>;
  /** If set, the orchestrator navigates here first and runs the login flow before testing. */
  loginUrl?: string;
  /** Credentials for login form fill. Values starting with $ are resolved from env vars. */
  credentials: {
    username?: string;
    password?: string;
  };
}

export interface GetwiredSettings {
  provider: string;
  auth: Record<string, ProviderAuth>;
  authentication: AuthConfig;
  native: {
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
    electron?: {
      appPath?: string;
      launchCommand?: string;
      workingDirectory?: string;
      source?: string;
    };
  };
  testing: {
    deviceProfile: DeviceProfile;
    viewports: {
      desktop: { width: number; height: number };
      mobile: { width: number; height: number };
    };
    screenshotFullPage: boolean;
    screenshotDelay: number;
    diffThreshold: number;
    maxConcurrency: number;
    showBrowser: boolean;
  };
  project: {
    name: string;
    url?: string;
    notes: string[];
    pages: string[];
    ignorePatterns: string[];
  };
  reporting: {
    outputFormat: "json" | "html" | "markdown";
    includeScreenshots: boolean;
    autoOpen: boolean;
  };
  security: {
    enabledCategories: PayloadCategory[];
    customPayloadsPath?: string;
    injectPayloads: boolean;
  };
  telemetry: boolean;
}

const DEFAULT_AUTH: AuthConfig = {
  cookies: [],
  localStorage: {},
  credentials: {},
};

const DEFAULT_SETTINGS: GetwiredSettings = {
  provider: "claude-code",
  auth: {},
  authentication: DEFAULT_AUTH,
  native: {
    ios: {},
    android: {},
    electron: {},
  },
  testing: {
    deviceProfile: "both",
    viewports: {
      desktop: { width: 1920, height: 1080 },
      mobile: { width: 390, height: 844 },
    },
    screenshotFullPage: true,
    screenshotDelay: 1000,
    diffThreshold: 0.01,
    maxConcurrency: 3,
    showBrowser: DEFAULT_SHOW_BROWSER,
  },
  project: {
    name: "",
    url: undefined,
    notes: [],
    pages: [],
    ignorePatterns: ["node_modules", ".git", "dist", ".next"],
  },
  reporting: {
    outputFormat: "json",
    includeScreenshots: true,
    autoOpen: false,
  },
  security: {
    enabledCategories: ["xss", "sqli", "path-traversal", "template-injection", "header-injection"],
    injectPayloads: true,
  },
  telemetry: true,
};

function getConfigDir(projectPath: string): string {
  return join(projectPath, ".getwired");
}

function getConfigPath(projectPath: string): string {
  return join(getConfigDir(projectPath), "config.json");
}

export function getBaselineDir(projectPath: string): string {
  return join(getConfigDir(projectPath), "baselines");
}

export function getReportDir(projectPath: string): string {
  return join(getConfigDir(projectPath), "reports");
}

export function getNotesDir(projectPath: string): string {
  return join(getConfigDir(projectPath), "notes");
}

export function getMemoryPath(projectPath: string): string {
  return join(getConfigDir(projectPath), "memory.md");
}

export function getHybridScenarioCachePath(projectPath: string): string {
  return join(getConfigDir(projectPath), "hybrid-scenarios.json");
}

export function getWebScenarioCachePath(projectPath: string): string {
  return join(getConfigDir(projectPath), "web-scenarios.json");
}

export function getDesktopScenarioCachePath(projectPath: string): string {
  return join(getConfigDir(projectPath), "desktop-scenarios.json");
}

export async function initConfig(projectPath: string, projectName: string): Promise<GetwiredSettings> {
  const configDir = getConfigDir(projectPath);
  await mkdir(configDir, { recursive: true });
  await mkdir(getBaselineDir(projectPath), { recursive: true });
  await mkdir(getReportDir(projectPath), { recursive: true });
  await mkdir(getNotesDir(projectPath), { recursive: true });

  const settings: GetwiredSettings = {
    ...DEFAULT_SETTINGS,
    project: { ...DEFAULT_SETTINGS.project, name: projectName },
  };

  await saveConfig(projectPath, settings);
  return settings;
}

export async function loadConfig(projectPath: string): Promise<GetwiredSettings> {
  const configPath = getConfigPath(projectPath);
  if (!existsSync(configPath)) {
    throw new Error(
      `No .getwired/config.json found in ${projectPath}. Run \`getwired init\` first.`,
    );
  }
  const raw = await readFile(configPath, "utf-8");
  const saved = JSON.parse(raw);
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    auth: {
      ...DEFAULT_SETTINGS.auth,
      ...(saved.auth ?? {}),
    },
    authentication: {
      ...DEFAULT_AUTH,
      ...(saved.authentication ?? {}),
      credentials: {
        ...DEFAULT_AUTH.credentials,
        ...(saved.authentication?.credentials ?? {}),
      },
    },
    native: {
      ...DEFAULT_SETTINGS.native,
      ...(saved.native ?? {}),
      ios: {
        ...DEFAULT_SETTINGS.native.ios,
        ...(saved.native?.ios ?? {}),
      },
      android: {
        ...DEFAULT_SETTINGS.native.android,
        ...(saved.native?.android ?? {}),
      },
      electron: {
        ...DEFAULT_SETTINGS.native.electron,
        ...(saved.native?.electron ?? {}),
      },
    },
    testing: {
      ...DEFAULT_SETTINGS.testing,
      ...(saved.testing ?? {}),
      viewports: {
        ...DEFAULT_SETTINGS.testing.viewports,
        ...(saved.testing?.viewports ?? {}),
        desktop: {
          ...DEFAULT_SETTINGS.testing.viewports.desktop,
          ...(saved.testing?.viewports?.desktop ?? {}),
        },
        mobile: {
          ...DEFAULT_SETTINGS.testing.viewports.mobile,
          ...(saved.testing?.viewports?.mobile ?? {}),
        },
      },
    },
    project: {
      ...DEFAULT_SETTINGS.project,
      ...(saved.project ?? {}),
    },
    reporting: {
      ...DEFAULT_SETTINGS.reporting,
      ...(saved.reporting ?? {}),
    },
    security: {
      ...DEFAULT_SETTINGS.security,
      ...(saved.security ?? {}),
    },
    telemetry: typeof saved.telemetry === "boolean" ? saved.telemetry : DEFAULT_SETTINGS.telemetry,
  };
}

export async function saveConfig(projectPath: string, settings: GetwiredSettings): Promise<void> {
  const configPath = getConfigPath(projectPath);
  await writeFile(configPath, JSON.stringify(settings, null, 2) + "\n");
}

export function configExists(projectPath: string): boolean {
  return existsSync(getConfigPath(projectPath));
}

/**
 * Resolve a value that may be an env var reference (e.g. "$MY_SECRET").
 * Returns the env var value if it starts with $, otherwise returns as-is.
 * Throws if the env var is referenced but not set.
 */
export function resolveEnvValue(value: string): string {
  if (!value.startsWith("$")) return value;
  const envName = value.slice(1);
  const envValue = process.env[envName];
  if (envValue === undefined) {
    throw new Error(
      `Environment variable ${envName} is referenced in .getwired/config.json but is not set. ` +
      `Set it before running: export ${envName}=<value>`,
    );
  }
  return envValue;
}

/**
 * Return the authentication config with all env var references resolved.
 * Call this at runtime — never persist resolved values.
 */
export function resolveAuth(auth: AuthConfig): AuthConfig {
  return {
    cookies: auth.cookies.map((c) => ({ ...c, value: resolveEnvValue(c.value) })),
    localStorage: Object.fromEntries(
      Object.entries(auth.localStorage).map(([k, v]) => [k, resolveEnvValue(v)]),
    ),
    loginUrl: auth.loginUrl,
    credentials: {
      username: auth.credentials.username ? resolveEnvValue(auth.credentials.username) : undefined,
      password: auth.credentials.password ? resolveEnvValue(auth.credentials.password) : undefined,
    },
  };
}
