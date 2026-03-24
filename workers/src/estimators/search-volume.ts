import { AutocompleteData } from "../scrapers/google-autocomplete";
import { SerpResult } from "../scrapers/google-serp";

/**
 * Estimate monthly search volume from autocomplete and SERP signals.
 *
 * This is a heuristic-based estimation (Method B from the plan).
 * Uses autocomplete suggestion count/position, SERP result count,
 * and keyword characteristics to produce an order-of-magnitude estimate.
 *
 * Accuracy: Low-Medium. Good enough for directional/relative comparisons.
 */
export function estimateSearchVolume(
  keyword: string,
  autocomplete: AutocompleteData,
  serpResults: SerpResult[]
): number {
  let score = 0;

  // Signal 1: Autocomplete suggestion count (0-10 suggestions)
  // More suggestions → higher search volume
  score += autocomplete.totalSuggestions * 5; // 0-50 points

  // Signal 2: Keyword appears in autocomplete suggestions
  // If the exact keyword appears early, it's a popular search
  if (autocomplete.keywordPosition > 0) {
    score += Math.max(0, 30 - autocomplete.keywordPosition * 5); // 0-25 points
  }

  // Signal 3: Number of organic results returned
  // Full page of results suggests established topic
  score += serpResults.length * 3; // 0-30 points

  // Signal 4: Keyword length (shorter keywords tend to have higher volume)
  const wordCount = keyword.split(/\s+/).length;
  if (wordCount === 1) score += 30;
  else if (wordCount === 2) score += 20;
  else if (wordCount === 3) score += 10;
  // Long-tail keywords get no bonus

  // Signal 5: Title match quality
  // If many results have the exact keyword in their title, it's competitive
  const titleMatches = serpResults.filter((r) =>
    r.title.toLowerCase().includes(keyword.toLowerCase())
  ).length;
  score += titleMatches * 4; // 0-40 points

  // Map score (0-175 range) to estimated volume using a lookup table
  // These are rough calibration ranges
  if (score >= 140) return 50000;
  if (score >= 120) return 30000;
  if (score >= 100) return 15000;
  if (score >= 80) return 8000;
  if (score >= 60) return 4000;
  if (score >= 40) return 2000;
  if (score >= 25) return 800;
  if (score >= 15) return 300;
  if (score >= 5) return 100;
  return 50;
}

