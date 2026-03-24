import { v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

export const getTrackedKeywords = internalQuery({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("keywords")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("tracked"), true))
      .collect();
  },
});

export const updateKeywordMetrics = internalMutation({
  args: {
    keywordId: v.id("keywords"),
    searchVolume: v.optional(v.number()),
    difficulty: v.optional(v.number()),
    seoRank: v.optional(v.number()),
    geoScore: v.optional(v.number()),
    trendDirection: v.optional(
      v.union(
        v.literal("rising"),
        v.literal("stable"),
        v.literal("declining")
      )
    ),
  },
  handler: async (ctx, args) => {
    const { keywordId, ...metrics } = args;
    const filtered = Object.fromEntries(
      Object.entries(metrics).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(keywordId, filtered);

    // Create snapshot
    await ctx.db.insert("keywordSnapshots", {
      keywordId,
      searchVolume: metrics.searchVolume,
      seoRank: metrics.seoRank,
      geoScore: metrics.geoScore,
      trendScore: metrics.trendDirection === "rising" ? 80 :
                  metrics.trendDirection === "stable" ? 50 : 20,
      snapshotDate: Date.now(),
    });
  },
});

export const analyzeKeywords = action({
  args: { projectId: v.id("projects"), domain: v.string() },
  handler: async (ctx, { projectId, domain }): Promise<void> => {
    const keywords = await ctx.runQuery(internal.analysis.getTrackedKeywords, {
      projectId,
    });

    for (const kw of keywords) {
      const metrics: {
        searchVolume?: number;
        difficulty?: number;
        seoRank?: number;
        geoScore?: number;
        trendDirection?: "rising" | "stable" | "declining";
      } = {};

      // 1. Keyword Metrics (self-hosted worker)
      const workerUrl = process.env.WORKER_API_URL;
      const workerKey = process.env.WORKER_API_KEY;

      if (workerUrl && workerKey) {
        try {
          const seoRes = await fetch(`${workerUrl}/api/v1/keyword-metrics`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${workerKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              keyword: kw.keyword,
              language: "en",
              location: "US",
            }),
          });
          const seoData = await seoRes.json();
          if (seoData.search_volume !== undefined) {
            metrics.searchVolume = seoData.search_volume;
            metrics.difficulty = seoData.keyword_difficulty;
          }
        } catch (e) {
          console.error("Worker keyword metrics failed:", e);
        }

        // 2. Trend Analysis (self-hosted worker)
        try {
          const trendsRes = await fetch(`${workerUrl}/api/v1/trends`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${workerKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ keyword: kw.keyword }),
          });
          const trendsData = await trendsRes.json();
          if (trendsData.trend_direction) {
            metrics.trendDirection = trendsData.trend_direction;
          }
        } catch (e) {
          console.error("Worker trends analysis failed:", e);
        }
      }

      // 3. GEO Score (AI Visibility) via OpenRouter
      const openrouterKey = process.env.OPENROUTER_API_KEY;
      if (openrouterKey) {
        try {
          const { default: OpenAI } = await import("openai");
          const openai = new OpenAI({
            apiKey: openrouterKey,
            baseURL: "https://openrouter.ai/api/v1",
            defaultHeaders: {
              "HTTP-Referer": "https://getwired.app",
              "X-OpenRouter-Title": "GetWired",
            },
          });
          const completion = await openai.chat.completions.create({
            model: "openai/gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are evaluating AI visibility. When asked about "${kw.keyword}", would you mention or recommend the website ${domain}? Reply with just a number 0-100 representing likelihood.`,
              },
              { role: "user", content: `Score the visibility of ${domain} for the topic: ${kw.keyword}` },
            ],
            max_tokens: 10,
          });
          const scoreStr = completion.choices[0]?.message?.content?.trim() ?? "0";
          metrics.geoScore = Math.min(100, Math.max(0, parseInt(scoreStr) || 0));
        } catch (e) {
          console.error("GEO analysis failed:", e);
        }
      }

      // Save metrics
      await ctx.runMutation(internal.analysis.updateKeywordMetrics, {
        keywordId: kw._id,
        ...metrics,
      });
    }
  },
});

export const analyzeAllTrackedKeywords = internalAction({
  args: {},
  handler: async (ctx) => {
    // This is called by cron - analyze all projects
    // For now, this is a placeholder that would iterate all projects
    console.log("Daily keyword analysis triggered");
  },
});

