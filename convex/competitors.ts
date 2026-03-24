import { v } from "convex/values";
import { action, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthenticatedUser } from "./helpers";

export const insertCompetitor = internalMutation({
  args: {
    projectId: v.id("projects"),
    domain: v.string(),
    name: v.optional(v.string()),
    overlapScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("competitors", {
      projectId: args.projectId,
      domain: args.domain,
      name: args.name,
      overlapScore: args.overlapScore,
      discoveredAt: Date.now(),
    });
  },
});

export const insertCompetitorKeyword = internalMutation({
  args: {
    competitorId: v.id("competitors"),
    keywordId: v.id("keywords"),
    rank: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("competitorKeywords", {
      competitorId: args.competitorId,
      keywordId: args.keywordId,
      rank: args.rank,
    });
  },
});

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== user._id) {
      throw new Error("Project not found");
    }
    return await ctx.db
      .query("competitors")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const getCompetitorKeywords = query({
  args: { competitorId: v.id("competitors") },
  handler: async (ctx, args) => {
    const joins = await ctx.db
      .query("competitorKeywords")
      .withIndex("by_competitor", (q) => q.eq("competitorId", args.competitorId))
      .collect();

    const keywords = await Promise.all(
      joins.map(async (j) => {
        const kw = await ctx.db.get(j.keywordId);
        return kw ? { ...kw, rank: j.rank } : null;
      })
    );
    return keywords.filter(Boolean);
  },
});

export const discoverCompetitors = action({
  args: { projectId: v.id("projects"), domain: v.string() },
  handler: async (ctx, { projectId, domain }) => {
    const workerUrl = process.env.WORKER_API_URL;
    const workerKey = process.env.WORKER_API_KEY;

    if (!workerUrl || !workerKey) {
      console.warn("Worker not configured, using mock data");
      // Insert mock competitors for development
      const mockCompetitors = [
        { domain: "competitor1.com", name: "Competitor One", overlapScore: 72 },
        { domain: "competitor2.com", name: "Competitor Two", overlapScore: 58 },
        { domain: "competitor3.com", name: "Competitor Three", overlapScore: 45 },
      ];
      for (const comp of mockCompetitors) {
        await ctx.runMutation(internal.competitors.insertCompetitor, {
          projectId,
          ...comp,
        });
      }
      return;
    }

    const response = await fetch(`${workerUrl}/api/v1/competitors`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${workerKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ domain }),
    });

    const data = await response.json();
    const competitors = data?.competitors ?? [];

    for (const comp of competitors.slice(0, 10)) {
      await ctx.runMutation(internal.competitors.insertCompetitor, {
        projectId,
        domain: comp.domain,
        name: comp.name || comp.domain,
        overlapScore: comp.overlapScore,
      });
    }
  },
});

