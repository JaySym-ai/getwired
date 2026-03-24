import { createStealthPage } from "./browser";

/**
 * Extract seed keywords from a domain by scraping its homepage and key pages.
 * Returns a list of keywords that likely represent the site's main topics.
 */
export async function extractSiteKeywords(
  domain: string
): Promise<string[]> {
  const { page, context } = await createStealthPage();

  try {
    const url = domain.startsWith("http") ? domain : `https://${domain}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });

    const keywords = await page.evaluate(() => {
      const collected = new Set<string>();

      // 1. Meta keywords tag
      const metaKeywords = document.querySelector(
        'meta[name="keywords"]'
      ) as HTMLMetaElement | null;
      if (metaKeywords?.content) {
        metaKeywords.content
          .split(",")
          .map((k) => k.trim().toLowerCase())
          .filter((k) => k.length > 2 && k.length < 50)
          .forEach((k) => collected.add(k));
      }

      // 2. Meta description
      const metaDesc = document.querySelector(
        'meta[name="description"]'
      ) as HTMLMetaElement | null;
      if (metaDesc?.content) {
        // Extract meaningful phrases (2-4 word combinations)
        const words = metaDesc.content
          .toLowerCase()
          .replace(/[^\w\s]/g, "")
          .split(/\s+/)
          .filter((w) => w.length > 3);
        for (let i = 0; i < words.length - 1; i++) {
          collected.add(`${words[i]} ${words[i + 1]}`);
          if (i < words.length - 2) {
            collected.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
          }
        }
      }

      // 3. Page title
      const title = document.title.toLowerCase().replace(/[^\w\s]/g, "");
      const titleWords = title.split(/\s+/).filter((w) => w.length > 3);
      for (let i = 0; i < titleWords.length - 1; i++) {
        collected.add(`${titleWords[i]} ${titleWords[i + 1]}`);
      }

      // 4. H1 and H2 headings
      const headings = document.querySelectorAll("h1, h2");
      headings.forEach((h) => {
        const text = h.textContent?.trim().toLowerCase();
        if (text && text.length > 3 && text.length < 60) {
          collected.add(text);
        }
      });

      // 5. Navigation links text (often represent key topics)
      const navLinks = document.querySelectorAll("nav a, header a");
      navLinks.forEach((a) => {
        const text = a.textContent?.trim().toLowerCase();
        if (
          text &&
          text.length > 3 &&
          text.length < 40 &&
          !text.includes("login") &&
          !text.includes("sign") &&
          !text.includes("contact")
        ) {
          collected.add(text);
        }
      });

      return Array.from(collected).slice(0, 20);
    });

    // Filter and deduplicate
    return keywords
      .filter((k) => k.length >= 3 && k.split(" ").length <= 5)
      .slice(0, 15);
  } catch (error) {
    // If we can't scrape the site, generate keywords from the domain name
    const parts = domain
      .replace(/^www\./, "")
      .replace(/\.(com|io|app|co|net|org)$/, "")
      .split(/[-._]/);
    return parts.filter((p) => p.length > 2);
  } finally {
    await context.close();
  }
}

