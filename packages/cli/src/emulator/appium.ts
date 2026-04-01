import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { createInterface } from "node:readline/promises";
import { createServer } from "node:net";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import type { NativePlatform } from "../providers/types.js";

const execFileAsync = promisify(execFile);
const APPIUM_START_TIMEOUT = 45_000;
const APPIUM_WEBVIEW_TIMEOUT = 20_000;
let appiumHomePromise: Promise<string> | undefined;

export interface AppiumAvailability {
  available: boolean;
  appiumInstalled: boolean;
  driverInstalled: boolean;
  missing: string[];
  driverName: "xcuitest" | "uiautomator2";
}

export interface AppiumSessionOptions {
  platform: NativePlatform;
  deviceId?: string;
  bundleId?: string;
  packageName?: string;
  activity?: string;
}

export interface AppiumElement {
  id: string;
}

export async function detectAppiumAutomationStack(platform: NativePlatform): Promise<AppiumAvailability> {
  const driverName = requiredDriver(platform);
  const appiumInstalled = await hasCommand("appium");
  const appiumHome = appiumInstalled ? await getManagedAppiumHome() : undefined;
  const driverInstalled = appiumInstalled && appiumHome ? await hasInstalledDriver(driverName, appiumHome) : false;
  const missing: string[] = [];
  if (!appiumInstalled) missing.push("Appium CLI");
  if (!driverInstalled) missing.push(`Appium ${driverName} driver`);
  return {
    available: missing.length === 0,
    appiumInstalled,
    driverInstalled,
    missing,
    driverName,
  };
}

export async function ensureAppiumAutomationStack(
  platform: NativePlatform,
  out: (text: string) => void,
  autoInstall?: boolean,
): Promise<AppiumAvailability> {
  let availability = await detectAppiumAutomationStack(platform);
  if (availability.available) return availability;

  out(`> Native automation is missing: ${availability.missing.join(", ")}\n`);
  const consent = autoInstall === undefined
    ? await promptForAutoInstall(platform, availability, out)
    : autoInstall;
  if (autoInstall !== undefined) {
    out(`> ${consent ? "User approved" : "User declined"} native automation auto-install.\n`);
  }
  if (!consent) {
    throw new Error(
      `Native automation stack is missing (${availability.missing.join(", ")}). ` +
      `Install Appium and the ${availability.driverName} driver to continue.`,
    );
  }

  await installAppiumAutomationStack(platform, availability, out);
  availability = await detectAppiumAutomationStack(platform);
  if (!availability.available) {
    throw new Error(
      `Appium installation did not complete successfully. Missing: ${availability.missing.join(", ")}`,
    );
  }
  out(`> Appium native automation is ready (${availability.driverName})\n`);
  return availability;
}

export async function startAppiumServer(out: (text: string) => void): Promise<AppiumServerHandle> {
  const appiumHome = await getManagedAppiumHome();
  const port = await getOpenPort();
  const processHandle = spawn("appium", ["--port", String(port), "--base-path", "/"], {
    stdio: ["ignore", "pipe", "pipe"],
    env: withAppiumEnv(appiumHome),
  });

  processHandle.stdout.on("data", (chunk: Buffer | string) => {
    const text = String(chunk).trim();
    if (text) out(`  ${text}\n`);
  });
  processHandle.stderr.on("data", (chunk: Buffer | string) => {
    const text = String(chunk).trim();
    if (text) out(`  ${text}\n`);
  });

  const handle = new AppiumServerHandle(port, processHandle);
  await handle.waitUntilReady();
  return handle;
}

export class AppiumServerHandle {
  readonly baseUrl: string;

  constructor(
    readonly port: number,
    private readonly child: ReturnType<typeof spawn>,
  ) {
    this.baseUrl = `http://127.0.0.1:${port}`;
  }

  async waitUntilReady(): Promise<void> {
    const startedAt = Date.now();
    while (Date.now() - startedAt < APPIUM_START_TIMEOUT) {
      try {
        const response = await fetch(`${this.baseUrl}/status`);
        if (response.ok) return;
      } catch {
        // keep polling
      }
      await sleep(500);
    }
    throw new Error("Appium server did not become ready in time");
  }

  async stop(): Promise<void> {
    if (this.child.killed) return;
    await new Promise<void>((resolve) => {
      this.child.once("exit", () => resolve());
      this.child.kill("SIGTERM");
      setTimeout(() => {
        if (!this.child.killed) this.child.kill("SIGKILL");
      }, 3_000);
    }).catch(() => {});
  }
}

export class AppiumSession {
  private contextName = "NATIVE_APP";

  constructor(
    readonly server: AppiumServerHandle,
    readonly sessionId: string,
    readonly options: AppiumSessionOptions,
  ) {}

  static async create(server: AppiumServerHandle, options: AppiumSessionOptions): Promise<AppiumSession> {
    const body = {
      capabilities: {
        alwaysMatch: buildCapabilities(options),
        firstMatch: [{}],
      },
    };

    const response = await fetch(`${server.baseUrl}/session`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json() as any;
    if (!response.ok) {
      throw new Error(payload?.value?.message ?? `Appium session creation failed (${response.status})`);
    }

    const sessionId = payload.sessionId ?? payload.value?.sessionId;
    if (!sessionId) throw new Error("Appium did not return a session id");
    return new AppiumSession(server, sessionId, options);
  }

  async delete(): Promise<void> {
    await this.request("DELETE", `/session/${this.sessionId}`).catch(() => {});
  }

  async screenshot(path: string): Promise<string> {
    const base64 = await this.request<string>("GET", `/session/${this.sessionId}/screenshot`);
    await writeFile(path, Buffer.from(base64, "base64"));
    return path;
  }

  async getPageSource(): Promise<string> {
    return this.request("GET", `/session/${this.sessionId}/source`);
  }

  async getContexts(): Promise<string[]> {
    try {
      return await this.request("GET", `/session/${this.sessionId}/contexts`);
    } catch {
      return ["NATIVE_APP"];
    }
  }

  async waitForWebviewContext(timeout = APPIUM_WEBVIEW_TIMEOUT): Promise<string | undefined> {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeout) {
      const contexts = await this.getContexts();
      const webview = contexts.find((name) => name.startsWith("WEBVIEW"));
      if (webview) return webview;
      await sleep(500);
    }
    return undefined;
  }

  async setContext(name: string): Promise<void> {
    await this.request("POST", `/session/${this.sessionId}/context`, { name });
    this.contextName = name;
  }

  async setNativeContext(): Promise<void> {
    await this.setContext("NATIVE_APP");
  }

  async setWebviewContext(timeout = APPIUM_WEBVIEW_TIMEOUT): Promise<boolean> {
    const webview = await this.waitForWebviewContext(timeout);
    if (!webview) return false;
    await this.setContext(webview);
    return true;
  }

  async getCurrentUrl(): Promise<string> {
    try {
      return String(await this.executeScript("return window.location.href;", []));
    } catch {
      return "";
    }
  }

  async executeScript(script: string, args: unknown[] = []): Promise<unknown> {
    return this.request("POST", `/session/${this.sessionId}/execute/sync`, { script, args });
  }

  async findWebElement(selector: string): Promise<AppiumElement | null> {
    try {
      return await this.findElement("css selector", selector);
    } catch {
      if (selector.startsWith("text=")) {
        const text = selector.slice(5);
        return this.findElement("xpath", `//*[contains(normalize-space(.), ${xpathString(text)})]`).catch(() => null);
      }
      return null;
    }
  }

  async findNativeElement(selector: string): Promise<AppiumElement | null> {
    const attempts: Array<[string, string]> = [
      ["accessibility id", selector],
      ["id", selector],
      ["xpath", `//*[@name=${xpathString(selector)} or @label=${xpathString(selector)} or @value=${xpathString(selector)} or @text=${xpathString(selector)} or @content-desc=${xpathString(selector)}]`],
      ["xpath", `//*[contains(@name, ${xpathString(selector)}) or contains(@label, ${xpathString(selector)}) or contains(@value, ${xpathString(selector)}) or contains(@text, ${xpathString(selector)}) or contains(@content-desc, ${xpathString(selector)})]`],
    ];
    for (const [using, value] of attempts) {
      try {
        return await this.findElement(using, value);
      } catch {
        // try next
      }
    }
    return null;
  }

  async clickElement(element: AppiumElement): Promise<void> {
    await this.request("POST", `/session/${this.sessionId}/element/${element.id}/click`, {});
  }

  async clearElement(element: AppiumElement): Promise<void> {
    await this.request("POST", `/session/${this.sessionId}/element/${element.id}/clear`, {});
  }

  async typeElement(element: AppiumElement, text: string): Promise<void> {
    await this.request("POST", `/session/${this.sessionId}/element/${element.id}/value`, {
      text,
      value: Array.from(text),
    });
  }

  async pressKey(key: string): Promise<void> {
    const normalized = webdriverKey(key);
    await this.request("POST", `/session/${this.sessionId}/actions`, {
      actions: [{
        type: "key",
        id: "keyboard",
        actions: [
          { type: "keyDown", value: normalized },
          { type: "keyUp", value: normalized },
        ],
      }],
    });
    await this.request("DELETE", `/session/${this.sessionId}/actions`).catch(() => {});
  }

  async scrollWeb(distance: number): Promise<void> {
    await this.executeScript("window.scrollBy(0, arguments[0]);", [distance]);
  }

  async navigateWeb(url: string): Promise<void> {
    await this.executeScript("window.location.href = arguments[0];", [url]);
  }

  async activateApp(): Promise<void> {
    const appId = this.options.platform === "ios" ? this.options.bundleId : this.options.packageName;
    if (!appId) return;
    await this.request("POST", `/session/${this.sessionId}/appium/device/activate_app`, {
      bundleId: appId,
      appId,
    }).catch(() => {});
  }

  get currentContext(): string {
    return this.contextName;
  }

  private async findElement(using: string, value: string): Promise<AppiumElement> {
    const result = await this.request<any>("POST", `/session/${this.sessionId}/element`, { using, value });
    const elementId = result[ELEMENT_KEY] ?? result["ELEMENT"];
    if (!elementId) throw new Error(`Appium did not return an element id for ${using}=${value}`);
    return { id: elementId };
  }

  private async request<T = any>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.server.baseUrl}${path}`, {
      method,
      headers: { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    let payload: any = undefined;
    const text = await response.text();
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    }

    if (!response.ok) {
      throw new Error(payload?.value?.message ?? payload?.message ?? `Appium request failed (${response.status})`);
    }

    if (payload && typeof payload === "object" && "value" in payload) {
      return payload.value as T;
    }
    return payload as T;
  }
}

function buildCapabilities(options: AppiumSessionOptions): Record<string, unknown> {
  if (options.platform === "ios") {
    return {
      platformName: "iOS",
      "appium:automationName": "XCUITest",
      "appium:udid": options.deviceId,
      "appium:bundleId": options.bundleId,
      "appium:noReset": true,
      "appium:newCommandTimeout": 600,
      "appium:webviewConnectTimeout": 20000,
      "appium:includeSafariInWebviews": false,
    };
  }

  return {
    platformName: "Android",
    "appium:automationName": "UiAutomator2",
    "appium:udid": options.deviceId,
    "appium:appPackage": options.packageName,
    ...(options.activity ? { "appium:appActivity": options.activity } : {}),
    "appium:noReset": true,
    "appium:newCommandTimeout": 600,
    "appium:autoGrantPermissions": true,
  };
}

function requiredDriver(platform: NativePlatform): "xcuitest" | "uiautomator2" {
  return platform === "ios" ? "xcuitest" : "uiautomator2";
}

function driverPackageName(driverName: "xcuitest" | "uiautomator2"): string {
  return driverName === "xcuitest" ? "appium-xcuitest-driver" : "appium-uiautomator2-driver";
}

async function hasCommand(command: string): Promise<boolean> {
  try {
    await execFileAsync("/bin/zsh", ["-lc", `command -v ${command}`], { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

async function hasInstalledDriver(
  driverName: "xcuitest" | "uiautomator2",
  appiumHome: string,
): Promise<boolean> {
  const packageName = driverPackageName(driverName);

  try {
    await access(join(appiumHome, "node_modules", packageName));
    return true;
  } catch {
    // Fall back to package.json inspection.
  }

  try {
    const packageJson = JSON.parse(
      await readFile(join(appiumHome, "package.json"), "utf-8"),
    ) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    return Boolean(packageJson.dependencies?.[packageName] || packageJson.devDependencies?.[packageName]);
  } catch {
    return false;
  }
}

async function installAppiumAutomationStack(
  platform: NativePlatform,
  availability: AppiumAvailability,
  out: (text: string) => void,
): Promise<void> {
  const appiumHome = await getManagedAppiumHome();
  if (!availability.appiumInstalled) {
    out(`> Installing Appium CLI via npm...\n`);
    await runShellCommand("npm install -g appium", out, withAppiumEnv(appiumHome));
  }
  if (!availability.driverInstalled) {
    out(`> Installing Appium ${availability.driverName} driver...\n`);
    await runShellCommand(`appium driver install ${requiredDriver(platform)}`, out, withAppiumEnv(appiumHome));
  }
}

async function promptForAutoInstall(
  platform: NativePlatform,
  availability: AppiumAvailability,
  out: (text: string) => void,
): Promise<boolean> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) return false;
  const label = platform === "ios" ? "iOS" : "Android";
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    const answer = await rl.question(
      `\nGetWired needs ${availability.missing.join(", ")} for ${label} native automation. Auto-install now? [y/N] `,
    );
    const accepted = /^y(es)?$/i.test(answer.trim());
    out(`> ${accepted ? "User approved" : "User declined"} native automation auto-install.\n`);
    return accepted;
  } finally {
    rl.close();
  }
}

async function runShellCommand(
  command: string,
  out: (text: string) => void,
  env?: NodeJS.ProcessEnv,
): Promise<void> {
  const shell = process.env.SHELL ?? "/bin/zsh";
  await new Promise<void>((resolve, reject) => {
    const child = spawn(shell, ["-lc", command], {
      env: env ?? process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    child.stdout.on("data", (chunk: Buffer | string) => {
      const text = String(chunk).trim();
      if (text) out(`  ${text}\n`);
    });
    child.stderr.on("data", (chunk: Buffer | string) => {
      const text = String(chunk).trim();
      if (text) out(`  ${text}\n`);
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed (${code ?? "unknown"}): ${command}`));
      }
    });
  });
}

async function getManagedAppiumHome(): Promise<string> {
  if (!appiumHomePromise) {
    appiumHomePromise = (async () => {
      const configured = process.env.GETWIRED_APPIUM_HOME?.trim();
      const candidates = [
        configured,
        join(homedir(), ".getwired", "appium"),
        join(tmpdir(), "getwired-appium"),
      ].filter((value): value is string => Boolean(value));

      for (const candidate of candidates) {
        try {
          await mkdir(candidate, { recursive: true });
          return candidate;
        } catch {
          // try the next location
        }
      }

      throw new Error("Unable to prepare a writable Appium home directory.");
    })();
  }

  return appiumHomePromise;
}

function withAppiumEnv(appiumHome: string): NodeJS.ProcessEnv {
  return {
    ...process.env,
    APPIUM_HOME: appiumHome,
  };
}

async function getOpenPort(): Promise<number> {
  return await new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Unable to allocate port for Appium"));
        return;
      }
      const port = address.port;
      server.close((error) => {
        if (error) reject(error);
        else resolve(port);
      });
    });
    server.on("error", reject);
  });
}

function webdriverKey(key: string): string {
  switch (key.toLowerCase()) {
    case "enter":
      return "\uE007";
    case "tab":
      return "\uE004";
    case "escape":
      return "\uE00C";
    case "backspace":
      return "\uE003";
    default:
      return key;
  }
}

function xpathString(value: string): string {
  if (!value.includes("'")) return `'${value}'`;
  if (!value.includes("\"")) return `"${value}"`;
  return `concat('${value.replace(/'/g, `', "'", '`)}')`;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

const ELEMENT_KEY = "element-6066-11e4-a52e-4f735466cecf";
