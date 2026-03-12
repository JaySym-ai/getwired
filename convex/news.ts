import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalAction, internalMutation, internalQuery, query } from "./_generated/server";

const MAX_SUMMARY_LENGTH = 320;

function decodeHtml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripHtml(value: string) {
  return decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readTag(block: string, tagName: string) {
  const match = block.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match?.[1]?.trim() ?? null;
}

function readAttribute(block: string, tagName: string, attribute: string) {
  const match = block.match(new RegExp(`<${tagName}[^>]*${attribute}="([^"]+)"[^>]*>`, "i"));
  return match?.[1]?.trim() ?? null;
}

function pickLink(block: string) {
  return (
    readAttribute(block, "link", "href") ??
    readTag(block, "link") ??
    readTag(block, "guid") ??
    null
  );
}

function pickImageUrl(block: string) {
  return (
    readAttribute(block, "media:content", "url") ??
    readAttribute(block, "enclosure", "url") ??
    block.match(/<img[^>]+src="([^"]+)"/i)?.[1] ??
    null
  );
}

function pickTags(block: string) {
  const tagMatches = [
    ...block.matchAll(/<category[^>]*>([\s\S]*?)<\/category>/gi),
    ...block.matchAll(/<category[^>]*term="([^"]+)"[^>]*\/?>/gi),
  ];

  const tags = tagMatches
    .map((match) => stripHtml(match[1] ?? ""))
    .filter(Boolean)
    .map((tag) => tag.toLowerCase().replace(/[^a-z0-9+.#-]+/g, "-"))
    .slice(0, 5);

  return Array.from(new Set(tags));
}

function pickSummary(block: string) {
  const raw =
    readTag(block, "description") ??
    readTag(block, "content:encoded") ??
    readTag(block, "summary") ??
    readTag(block, "content") ??
    "";

  const plainText = stripHtml(raw);
  if (plainText.length <= MAX_SUMMARY_LENGTH) {
    return plainText;
  }

  return `${plainText.slice(0, MAX_SUMMARY_LENGTH - 1).trimEnd()}…`;
}

function pickPublishedAt(block: string) {
  const raw =
    readTag(block, "pubDate") ??
    readTag(block, "published") ??
    readTag(block, "updated");

  if (!raw) {
    return Date.now();
  }

  const timestamp = Date.parse(raw);
  return Number.isNaN(timestamp) ? Date.now() : timestamp;
}

function splitEntries(xml: string) {
  const itemMatches = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((match) => match[0]);
  if (itemMatches.length > 0) {
    return itemMatches;
  }

  return [...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map((match) => match[0]);
}

function parseFeed(xml: string) {
  return splitEntries(xml)
    .map((entry) => {
      const title = stripHtml(readTag(entry, "title") ?? "");
      const url = pickLink(entry);

      if (!title || !url) {
        return null;
      }

      return {
        externalId: stripHtml(readTag(entry, "guid") ?? readTag(entry, "id") ?? url),
        title,
        url: stripHtml(url),
        summary: pickSummary(entry),
        imageUrl: pickImageUrl(entry) ?? undefined,
        tags: pickTags(entry),
        publishedAt: pickPublishedAt(entry),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .slice(0, 25);
}

export const list = query({
  args: {
    limit: v.optional(v.number()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 30;
    const articles = args.source
      ? await ctx.db
          .query("newsArticles")
          .withIndex("by_source_publishedAt", (q) => q.eq("source", args.source!))
          .order("desc")
          .take(limit)
      : await ctx.db
          .query("newsArticles")
          .withIndex("by_publishedAt")
          .order("desc")
          .take(limit);

    return articles.filter((article) => !article.isDemo);
  },
});

export const listSources = query({
  args: {},
  handler: async (ctx) => {
    const feeds = await ctx.db
      .query("rssFeeds")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    return feeds
      .map((feed) => feed.name)
      .sort((left, right) => left.localeCompare(right));
  },
});

export const refreshNow = action({
  args: {},
  handler: async (ctx) => {
    await ctx.runAction(internal.news.refreshAllFeeds, {});
    return { ok: true };
  },
});

export const listActiveFeeds = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("rssFeeds")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();
  },
});

export const upsertArticles = internalMutation({
  args: {
    feedId: v.id("rssFeeds"),
    source: v.string(),
    fetchedAt: v.number(),
    articles: v.array(
      v.object({
        externalId: v.string(),
        title: v.string(),
        url: v.string(),
        summary: v.string(),
        imageUrl: v.optional(v.string()),
        tags: v.array(v.string()),
        publishedAt: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const article of args.articles) {
      const existing =
        (await ctx.db
          .query("newsArticles")
          .withIndex("by_externalId", (q) => q.eq("externalId", article.externalId))
          .first()) ??
        (await ctx.db
          .query("newsArticles")
          .withIndex("by_url", (q) => q.eq("url", article.url))
          .first());

      if (existing) {
        await ctx.db.patch(existing._id, {
          feedId: args.feedId,
          title: article.title,
          url: article.url,
          source: args.source,
          summary: article.summary,
          imageUrl: article.imageUrl,
          tags: article.tags,
          publishedAt: article.publishedAt,
          isDemo: false,
        });
        continue;
      }

      await ctx.db.insert("newsArticles", {
        feedId: args.feedId,
        externalId: article.externalId,
        title: article.title,
        url: article.url,
        source: args.source,
        summary: article.summary,
        imageUrl: article.imageUrl,
        tags: article.tags,
        discussionPostId: undefined,
        publishedAt: article.publishedAt,
        isDemo: false,
        createdAt: args.fetchedAt,
      });
    }

    await ctx.db.patch(args.feedId, {
      lastFetchedAt: args.fetchedAt,
      lastError: undefined,
    });
  },
});

export const markFeedError = internalMutation({
  args: {
    feedId: v.id("rssFeeds"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.feedId, {
      lastError: args.message.slice(0, 500),
    });
  },
});

export const refreshAllFeeds = internalAction({
  args: {},
  handler: async (ctx) => {
    const feeds = await ctx.runQuery(internal.news.listActiveFeeds, {});
    const fetchedAt = Date.now();

    await Promise.all(
      feeds.map(async (feed) => {
        try {
          const response = await fetch(feed.url, {
            headers: {
              "user-agent": "GetWired News Bot/1.0",
              accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
            },
          });

          if (!response.ok) {
            throw new Error(`Feed request failed with ${response.status}`);
          }

          const xml = await response.text();
          const articles = parseFeed(xml);

          if (articles.length === 0) {
            throw new Error("Feed returned no parseable articles");
          }

          await ctx.runMutation(internal.news.upsertArticles, {
            feedId: feed._id,
            source: feed.name,
            fetchedAt,
            articles,
          });
        } catch (error) {
          await ctx.runMutation(internal.news.markFeedError, {
            feedId: feed._id,
            message: error instanceof Error ? error.message : "Unknown feed refresh error",
          });
        }
      }),
    );
  },
});
