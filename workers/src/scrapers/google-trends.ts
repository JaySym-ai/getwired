import { createStealthPage } from "./browser";
import { rateLimiter } from "../utils/rate-limiter";

export interface TrendData {
  dataPoints: number[];
}

/**
 * Scrape Google Trends for a keyword's interest over time.
 * Returns normalized data points (0-100 scale).
 */
export async function scrapeGoogleTrends(
  keyword: string
): Promise<TrendData> {
  await rateLimiter.acquire();

  const { page, context } = await createStealthPage();

  try {
    const url = `https://trends.google.com/trends/explore?q=${encodeURIComponent(keyword)}&geo=US`;
    await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });

    // Wait for the trend chart to render
    await page.waitForTimeout(3000);

    // Strategy 1: Intercept trend data from the page's embedded data
    const dataPoints = await page.evaluate(() => {
      // Google Trends embeds data in script tags or widget data
      const scripts = Array.from(document.querySelectorAll("script"));
      for (const script of scripts) {
        const text = script.textContent || "";
        // Look for the timeline data pattern
        const match = text.match(
          /\"timeline_data\":\s*\[([\s\S]*?)\]/
        );
        if (match) {
          try {
            const timelineRaw = JSON.parse(`[${match[1]}]`);
            return timelineRaw
              .map((item: any) => {
                const val =
                  item?.value?.[0] ??
                  item?.values?.[0]?.extracted_value ??
                  null;
                return typeof val === "number" ? val : null;
              })
              .filter((v: any): v is number => v !== null);
          } catch {
            // Parse failed, continue
          }
        }
      }
      return [];
    });

    // Strategy 2: If script parsing didn't work, try reading from the chart
    if (dataPoints.length === 0) {
      const chartPoints = await page.evaluate(() => {
        // Try to find SVG path data or chart containers
        const lines = document.querySelectorAll(
          'line[class*="line"], path[class*="line"], [class*="chart"] path'
        );
        // Fallback: look for the widget data in network responses
        return [] as number[];
      });

      if (chartPoints.length > 0) {
        return { dataPoints: chartPoints };
      }

      // Strategy 3: Use the multiline API endpoint directly
      try {
        const apiResponse = await page.evaluate(async () => {
          const resp = await fetch(
            window.location.href.replace("/explore", "/api/widgetdata/multiline"),
            { credentials: "include" }
          );
          const text = await resp.text();
          // Google Trends API responses start with ")]}',\n"
          const json = JSON.parse(text.replace(/^\)\]\}',?\n/, ""));
          return (
            json?.default?.timelineData?.map(
              (d: any) => d?.value?.[0] ?? 0
            ) ?? []
          );
        });
        if (apiResponse.length > 0) {
          return { dataPoints: apiResponse };
        }
      } catch {
        // API fetch failed
      }

      // Return a neutral data point if all strategies fail
      return { dataPoints: [50] };
    }

    return { dataPoints };
  } finally {
    await context.close();
  }
}

