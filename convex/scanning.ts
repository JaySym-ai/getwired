import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import * as cheerio from "cheerio";

// Common English stop words to filter out
const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "it", "as", "be", "was", "are",
  "been", "being", "have", "has", "had", "do", "does", "did", "will",
  "would", "could", "should", "may", "might", "can", "shall", "this",
  "that", "these", "those", "i", "you", "he", "she", "we", "they",
  "me", "him", "her", "us", "them", "my", "your", "his", "its", "our",
  "their", "what", "which", "who", "whom", "when", "where", "why", "how",
  "all", "each", "every", "both", "few", "more", "most", "other", "some",
  "such", "no", "not", "only", "own", "same", "so", "than", "too", "very",
  "just", "about", "above", "after", "again", "also", "any", "because",
  "before", "between", "during", "here", "if", "into", "new", "now",
  "over", "then", "there", "through", "under", "up", "out", "get",
]);

function extractText($: cheerio.CheerioAPI): string {
  // Remove script and style elements
  $("script, style, nav, footer, header").remove();

  const parts: string[] = [];

  // Extract title
  const title = $("title").text().trim();
  if (title) parts.push(title, title, title); // Weight title higher

  // Extract meta description
  const metaDesc = $('meta[name="description"]').attr("content")?.trim();
  if (metaDesc) parts.push(metaDesc, metaDesc);

  // Extract meta keywords
  const metaKeywords = $('meta[name="keywords"]').attr("content")?.trim();
  if (metaKeywords) parts.push(metaKeywords, metaKeywords, metaKeywords);

  // Extract headings (weighted)
  $("h1, h2, h3").each((_, el) => {
    const text = $(el).text().trim();
    if (text) parts.push(text, text); // Weight headings
  });

  // Extract paragraph text
  $("p, li, td, span, div").each((_, el) => {
    const text = $(el).clone().children().remove().end().text().trim();
    if (text && text.length > 10) parts.push(text);
  });

  return parts.join(" ");
}

function extractKeywords(text: string): { term: string; score: number }[] {
  // Tokenize and normalize
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  // Count term frequency
  const freq: Record<string, number> = {};
  for (const word of words) {
    freq[word] = (freq[word] || 0) + 1;
  }

  // Also extract 2-word phrases
  for (let i = 0; i < words.length - 1; i++) {
    const phrase = `${words[i]} ${words[i + 1]}`;
    if (!STOP_WORDS.has(words[i]) && !STOP_WORDS.has(words[i + 1])) {
      freq[phrase] = (freq[phrase] || 0) + 1;
    }
  }

  // Sort by frequency and return top 25
  return Object.entries(freq)
    .map(([term, count]) => ({ term, score: count }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 25);
}

async function performScan(
  ctx: { runMutation: (fn: any, args: any) => Promise<any> },
  projectId: Id<"projects">,
  url: string
) {
  try {
    // Fetch HTML
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; GetWired/1.0; +https://getwired.app)",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract text content
    const text = extractText($);

    // Extract keywords using TF-IDF-like scoring
    const keywords = extractKeywords(text);

    // Save keywords
    await ctx.runMutation(internal.keywords.insertBulk, {
      projectId,
      keywords: keywords.map((k) => ({
        keyword: k.term,
        source: "extracted" as const,
      })),
    });

    // Update project status
    await ctx.runMutation(internal.projects.updateStatus, {
      projectId,
      status: "ready",
    });
  } catch (error) {
    console.error("Scan failed:", error);
    await ctx.runMutation(internal.projects.updateStatus, {
      projectId,
      status: "error",
    });
  }
}

export const scanWebsite = action({
  args: { projectId: v.id("projects"), url: v.string() },
  handler: async (ctx, { projectId, url }) => {
    await performScan(ctx, projectId, url);
  },
});

// Internal version that can be scheduled from mutations
export const scanWebsiteInternal = internalAction({
  args: { projectId: v.id("projects"), url: v.string() },
  handler: async (ctx, { projectId, url }) => {
    await performScan(ctx, projectId, url);
  },
});

