import { _electron as electron, type ElectronApplication, type Page } from "playwright";
import type { ResolvedElectronLaunchTarget } from "./types.js";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

export interface ElectronSession {
  app: ElectronApplication;
  page: Page;
}

function findElectronBinary(projectDir: string): string | undefined {
  // Check common locations for the electron binary
  const candidates = [
    join(projectDir, "node_modules", ".bin", "electron"),
    join(projectDir, "node_modules", "electron", "dist", "Electron.app", "Contents", "MacOS", "Electron"), // macOS
    join(projectDir, "node_modules", "electron", "dist", "electron"), // Linux
    join(projectDir, "node_modules", "electron", "dist", "electron.exe"), // Windows
  ];
  
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  
  return undefined;
}

async function getActiveWindow(app: ElectronApplication): Promise<Page> {
  // Get all windows and pick the last one (most recently created = likely the main window)
  const windows = app.windows();
  
  if (windows.length === 0) {
    // No windows yet — wait for one to appear
    const page = await app.waitForEvent("window", { timeout: 15000 });
    await page.waitForLoadState("domcontentloaded").catch(() => {});
    // Give the page a moment to render
    await new Promise((r) => setTimeout(r, 1000));
    return page;
  }
  
  // Pick the last window (most recent) that isn't closed
  for (let i = windows.length - 1; i >= 0; i--) {
    const win = windows[i];
    try {
      // Test if the window is still alive by checking the URL
      await win.url();
      await win.waitForLoadState("domcontentloaded").catch(() => {});
      return win;
    } catch {
      // Window is closed, try the next one
      continue;
    }
  }
  
  // All windows closed — wait for a new one
  const page = await app.waitForEvent("window", { timeout: 15000 });
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await new Promise((r) => setTimeout(r, 1000));
  return page;
}

async function ensureActivePage(session: ElectronSession): Promise<Page> {
  try {
    // Quick check if the current page is still alive
    await session.page.url();
    return session.page;
  } catch {
    // Page is closed — get the new active window
    const page = await getActiveWindow(session.app);
    session.page = page;
    return page;
  }
}

export async function launchElectronApp(target: ResolvedElectronLaunchTarget): Promise<ElectronSession> {
  const projectDir = target.workingDirectory || process.cwd();
  const electronPath = findElectronBinary(projectDir);
  
  if (!electronPath) {
    throw new Error(
      `Electron binary not found in ${projectDir}/node_modules. \n` +
      `Make sure the target project has electron installed: cd ${projectDir} && npm install\n` +
      `Or install electron as a dev dependency: cd ${projectDir} && npm install -D electron`
    );
  }
  
  const app = await electron.launch({
    executablePath: electronPath,
    args: [target.appPath],
    cwd: projectDir,
  });
  
  // Wait for the app to stabilize — Electron apps often create/destroy windows during startup
  // Give the app time to finish initialization
  await new Promise((r) => setTimeout(r, 3000));
  
  // Get the most recent window (the main window, not a splash screen)
  const page = await getActiveWindow(app);
  
  return { app, page };
}

export async function captureElectronScreenshot(session: ElectronSession): Promise<Buffer> {
  const page = await ensureActivePage(session);
  const buffer = await page.screenshot();
  return Buffer.from(buffer);
}

export async function getElectronUIStructure(session: ElectronSession): Promise<string> {
  const page = await ensureActivePage(session);
  const snapshot = await page.evaluate(() => {
    const normalizeText = (value: unknown) => (value || "").toString().trim().replace(/\s+/g, " ").slice(0, 80);
    const toXPathLiteral = (value: string | null) => {
      if (!value) return null;
      if (!value.includes("'")) return "'" + value + "'";
      if (!value.includes('"')) return '"' + value + '"';
      return null;
    };

    const selectorFor = (element: Element) => {
      const attrNames = ["data-testid", "data-test", "data-qa", "id", "name", "aria-label", "placeholder"];
      for (const attr of attrNames) {
        const value = element.getAttribute(attr);
        if (!value) continue;
        if (attr === "id") return "#" + CSS.escape(value);
        return "[" + attr + "=\"" + value.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + "\"]";
      }
      if (element.tagName === "A" && element.getAttribute("href")) {
        return "a[href=\"" + element.getAttribute("href")!.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + "\"]";
      }
      return null;
    };

    const xpathFor = (element: Element) => {
      const text = normalizeText((element as HTMLElement).innerText || element.textContent || "");
      const role = element.getAttribute("role");
      const roleLiteral = toXPathLiteral(role);
      const textLiteral = toXPathLiteral(text);
      if (roleLiteral && textLiteral) {
        return "//*[@role=" + roleLiteral + " and normalize-space(.)=" + textLiteral + "]";
      }
      if (element.tagName === "BUTTON" && textLiteral) {
        return "//button[normalize-space(.)=" + textLiteral + "]";
      }
      if (element.tagName === "A" && textLiteral) {
        return "//a[normalize-space(.)=" + textLiteral + "]";
      }
      const placeholder = element.getAttribute("placeholder");
      const placeholderLiteral = toXPathLiteral(placeholder);
      if ((element.tagName === "INPUT" || element.tagName === "TEXTAREA") && placeholderLiteral) {
        return "//" + element.tagName.toLowerCase() + "[@placeholder=" + placeholderLiteral + "]";
      }
      return null;
    };

    const collect = (selector: string) => Array.from(document.querySelectorAll(selector))
      .slice(0, 40)
      .map((element) => {
        const cssSelector = selectorFor(element);
        const xpathSelector = xpathFor(element);
        return {
          tag: element.tagName.toLowerCase(),
          text: normalizeText((element as HTMLElement).innerText || element.textContent || ""),
          selector: cssSelector || xpathSelector,
          selectorCandidates: Array.from(new Set([cssSelector, xpathSelector].filter(Boolean))).slice(0, 3),
          role: element.getAttribute("role") || undefined,
          name: element.getAttribute("name") || undefined,
          ariaLabel: element.getAttribute("aria-label") || undefined,
          placeholder: element.getAttribute("placeholder") || undefined,
          href: element.getAttribute("href") || undefined,
          type: element.getAttribute("type") || undefined,
        };
      });

    return {
      url: window.location.href,
      title: document.title,
      readyState: document.readyState,
      textSnippet: (document.body?.innerText || "").replace(/\s+/g, " ").slice(0, 2000),
      buttons: collect("button, [role=button]"),
      links: collect("a[href]"),
      inputs: collect("input, textarea"),
      selects: collect("select"),
      forms: collect("form"),
      iframes: Array.from(document.querySelectorAll("iframe"))
        .slice(0, 20)
        .map((frame) => ({
          src: frame.getAttribute("src") || undefined,
          title: frame.getAttribute("title") || undefined,
        })),
    };
  });
  
  const snapshotJson = JSON.stringify(snapshot, null, 2);
  const title = await page.title();
  const url = page.url();
  
  return `Page: ${title}\nURL: ${url}\n\nAccessibility Tree:\n${snapshotJson}`;
}

export async function getElectronPageHTML(session: ElectronSession): Promise<string> {
  const page = await ensureActivePage(session);
  return page.content();
}

export async function clickElectronElement(session: ElectronSession, selector: string): Promise<void> {
  const page = await ensureActivePage(session);
  await page.click(selector);
}

export async function fillElectronElement(session: ElectronSession, selector: string, value: string): Promise<void> {
  const page = await ensureActivePage(session);
  await page.fill(selector, value);
}

export async function pressElectronKey(session: ElectronSession, key: string): Promise<void> {
  const page = await ensureActivePage(session);
  await page.keyboard.press(key);
}

export async function scrollElectron(session: ElectronSession, distance: number): Promise<void> {
  const page = await ensureActivePage(session);
  await page.mouse.wheel(0, distance);
}

export async function closeElectronApp(session: ElectronSession): Promise<void> {
  await session.app.close();
}
