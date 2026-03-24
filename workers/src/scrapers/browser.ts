import { chromium, Browser, BrowserContext, Page } from "playwright";
import { getRandomUserAgent } from "../utils/user-agents";

let browser: Browser | null = null;

/**
 * Get or create a shared browser instance.
 * Reuses a single browser process to avoid repeated cold starts.
 */
export async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-blink-features=AutomationControlled",
      ],
    });
  }
  return browser;
}

/**
 * Create a new browser context with anti-detection settings.
 * Each request should use its own context for isolation.
 */
export async function createContext(): Promise<BrowserContext> {
  const b = await getBrowser();

  // Randomize viewport slightly
  const width = 1920 + Math.floor(Math.random() * 100) - 50;
  const height = 1080 + Math.floor(Math.random() * 100) - 50;

  const context = await b.newContext({
    userAgent: getRandomUserAgent(),
    viewport: { width, height },
    locale: "en-US",
    timezoneId: "America/New_York",
    javaScriptEnabled: true,
  });

  return context;
}

/**
 * Create a new page with stealth tweaks applied.
 */
export async function createStealthPage(): Promise<{
  page: Page;
  context: BrowserContext;
}> {
  const context = await createContext();
  const page = await context.newPage();

  // Override navigator.webdriver to avoid detection
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
    });
    // Override chrome detection
    (window as any).chrome = { runtime: {} };
    // Override permissions
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters: any) =>
      parameters.name === "notifications"
        ? Promise.resolve({
            state: Notification.permission,
          } as PermissionStatus)
        : originalQuery(parameters);
  });

  return { page, context };
}

/**
 * Close the shared browser instance.
 */
export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

