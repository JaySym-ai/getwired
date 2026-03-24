import { SerpResult } from "../scrapers/google-serp";

/**
 * High-authority domains that indicate competitive SERPs.
 */
const HIGH_AUTHORITY_DOMAINS = new Set([
  "wikipedia.org",
  "amazon.com",
  "youtube.com",
  "facebook.com",
  "twitter.com",
  "x.com",
  "linkedin.com",
  "reddit.com",
  "apple.com",
  "microsoft.com",
  "google.com",
  "github.com",
  "nytimes.com",
  "bbc.com",
  "cnn.com",
  "forbes.com",
  "bloomberg.com",
  "healthline.com",
  "webmd.com",
  "mayoclinic.org",
  "nih.gov",
  "walmart.com",
  "target.com",
  "bestbuy.com",
  "etsy.com",
  "shopify.com",
]);

const AUTHORITY_TLDS = new Set([".gov", ".edu", ".org"]);

/**
 * Estimate keyword difficulty (0-100) from SERP analysis.
 *
 * Scores based on surface-level signals from the top 10 results:
 * - Presence of high-authority domains
 * - Government/education sites (.gov, .edu)
 * - Paid ads (competition indicator)
 * - Featured snippets (Google trusts existing answers)
 * - Brand dominance in results
 *
 * This is a rough proxy — no backlink data available.
 */
export function estimateDifficulty(serpResults: SerpResult[]): number {
  let score = 0;

  if (serpResults.length === 0) return 0;

  // Factor 1: High-authority domains in top 3 (+30 max)
  const top3 = serpResults.slice(0, 3);
  const authorityInTop3 = top3.filter((r) => {
    try {
      const host = new URL(r.url).hostname.replace(/^www\./, "");
      return HIGH_AUTHORITY_DOMAINS.has(host);
    } catch {
      return false;
    }
  }).length;
  score += authorityInTop3 * 10; // 0-30

  // Factor 2: Authority TLDs (.gov, .edu) anywhere in results (+15 max)
  const authorityTldCount = serpResults.filter((r) => {
    try {
      const host = new URL(r.url).hostname;
      return Array.from(AUTHORITY_TLDS).some((tld) => host.endsWith(tld));
    } catch {
      return false;
    }
  }).length;
  score += Math.min(authorityTldCount * 5, 15);

  // Factor 3: All top 10 are established/recognizable brands (+20 max)
  const brandCount = serpResults.filter((r) => {
    try {
      const host = new URL(r.url).hostname.replace(/^www\./, "");
      return HIGH_AUTHORITY_DOMAINS.has(host);
    } catch {
      return false;
    }
  }).length;
  if (brandCount >= 8) score += 20;
  else if (brandCount >= 5) score += 12;
  else if (brandCount >= 3) score += 5;

  // Factor 4: Number of results (full SERP = competitive keyword)
  if (serpResults.length >= 10) score += 5;

  // Factor 5: Long snippets indicate well-optimized pages
  const avgSnippetLength =
    serpResults.reduce((sum, r) => sum + r.snippet.length, 0) /
    serpResults.length;
  if (avgSnippetLength > 150) score += 10;
  else if (avgSnippetLength > 100) score += 5;

  // Clamp to 0-100
  return Math.min(100, Math.max(0, score));
}

