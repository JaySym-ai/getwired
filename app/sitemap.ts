import type { MetadataRoute } from "next";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { getRequiredConvexUrl } from "@/lib/env";

const BASE_URL = "https://getwired.dev";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/forums`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/news`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/chat`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/discover`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/marketplace`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/newsletter`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/search`, lastModified: now, changeFrequency: "daily", priority: 0.5 },
    { url: `${BASE_URL}/sign-in`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/sign-up`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  try {
    const client = new ConvexHttpClient(getRequiredConvexUrl());
    const [categories, posts, users] = await Promise.all([
      client.query(api.forums.listCategories, {}),
      client.query(api.posts.listDetailed, { limit: 200 }),
      client.query(api.users.list, {}),
    ]);

    return [
      ...staticRoutes,
      ...categories.map((category) => ({
        url: `${BASE_URL}/forums/${category.slug}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
      ...posts.map((post) => ({
        url: `${BASE_URL}/forums/${post.category ?? "off-topic"}/${post._id}`,
        lastModified: new Date(post.createdAt),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
      ...users.map((user) => ({
        url: `${BASE_URL}/profile/${user.username}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
