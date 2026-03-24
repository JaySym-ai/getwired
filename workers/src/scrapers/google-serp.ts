import { createStealthPage } from "./browser";
import { rateLimiter } from "../utils/rate-limiter";

export interface SerpResult {
  url: string;
  title: string;
  snippet: string;
  position: number;
}

export interface SerpMeta {
  totalResults: string;
  hasAds: boolean;
  hasFeaturedSnippet: boolean;
  hasPeopleAlsoAsk: boolean;
}

export interface SerpData {
  results: SerpResult[];
  meta: SerpMeta;
}

interface ScrapeOptions {
  language?: string;
  location?: string;
}

/**
 * Scrape Google SERP for a keyword and return organic results + meta.
 * Returns just the results array for backward compat; use scrapeGoogleSerpFull for meta.
 */
export async function scrapeGoogleSerp(
  keyword: string,
  options: ScrapeOptions = {}
): Promise<SerpResult[]> {
  const data = await scrapeGoogleSerpFull(keyword, options);
  return data.results;
}

/**
 * Full SERP scrape returning results + metadata for difficulty estimation.
 */
export async function scrapeGoogleSerpFull(
  keyword: string,
  options: ScrapeOptions = {}
): Promise<SerpData> {
  await rateLimiter.acquire();

  const { page, context } = await createStealthPage();

  try {
    const hl = options.language || "en";
    const gl = options.location || "US";
    const url = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&hl=${hl}&gl=${gl}&num=10`;

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });

    // Dismiss cookie consent if present
    try {
      const consentButton = page.locator('button:has-text("Accept all")');
      if (await consentButton.isVisible({ timeout: 2000 })) {
        await consentButton.click();
        await page.waitForTimeout(1000);
      }
    } catch {
      // No consent dialog, continue
    }

    // Extract organic results
    const results: SerpResult[] = await page.evaluate(() => {
      const items: any[] = [];
      const resultElements = document.querySelectorAll("#search .g");

      resultElements.forEach((el, index) => {
        const linkEl = el.querySelector("a[href]");
        const titleEl = el.querySelector("h3");
        const snippetEl = el.querySelector('[data-sncf], [style*="-webkit-line-clamp"], .VwiC3b');

        if (linkEl && titleEl) {
          const href = linkEl.getAttribute("href") || "";
          if (href.startsWith("http")) {
            items.push({
              url: href,
              title: titleEl.textContent?.trim() || "",
              snippet: snippetEl?.textContent?.trim() || "",
              position: index + 1,
            });
          }
        }
      });

      return items.slice(0, 10);
    });

    // Extract metadata
    const meta: SerpMeta = await page.evaluate(() => {
      const statsEl = document.querySelector("#result-stats");
      const totalResults = statsEl?.textContent?.match(/[\d,]+/)?.[0] || "0";

      const hasAds = document.querySelectorAll('[data-text-ad], .uEierd').length > 0;
      const hasFeaturedSnippet = document.querySelector('.xpdopen, .ifM9O') !== null;
      const hasPeopleAlsoAsk = document.querySelector('[data-sgrd], .related-question-pair') !== null;

      return { totalResults, hasAds, hasFeaturedSnippet, hasPeopleAlsoAsk };
    });

    return { results, meta };
  } finally {
    await context.close();
  }
}

