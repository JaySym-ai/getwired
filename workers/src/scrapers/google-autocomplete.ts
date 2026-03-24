import { getRandomUserAgent } from "../utils/user-agents";

export interface AutocompleteData {
  suggestions: string[];
  keywordPosition: number; // position of exact keyword in suggestions (0 = not found)
  totalSuggestions: number;
}

/**
 * Fetch Google Autocomplete suggestions for a keyword.
 * Uses the public suggestion API (no browser needed).
 * The number and position of suggestions provides signals for volume estimation.
 */
export async function fetchAutocompleteData(
  keyword: string
): Promise<AutocompleteData> {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(keyword)}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": getRandomUserAgent(),
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return { suggestions: [], keywordPosition: 0, totalSuggestions: 0 };
    }

    const data = await response.json();
    // Response format: [query, [suggestions]]
    const suggestions: string[] = Array.isArray(data?.[1]) ? data[1] : [];

    // Find where the exact keyword appears in suggestions
    const normalizedKeyword = keyword.toLowerCase().trim();
    const keywordPosition =
      suggestions.findIndex(
        (s) => s.toLowerCase().trim() === normalizedKeyword
      ) + 1; // 1-based, 0 = not found

    return {
      suggestions,
      keywordPosition,
      totalSuggestions: suggestions.length,
    };
  } catch {
    return { suggestions: [], keywordPosition: 0, totalSuggestions: 0 };
  }
}

