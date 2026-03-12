import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

export function normalizeUsername(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized.slice(0, 24) || "user";
}

export async function getAvailableUsername(
  ctx: QueryCtx | MutationCtx,
  preferred: string,
  currentUserId?: Id<"users">,
) {
  const base = normalizeUsername(preferred);

  for (let attempt = 0; attempt < 100; attempt++) {
    const suffix = attempt === 0 ? "" : `_${attempt}`;
    const candidate = `${base.slice(0, Math.max(1, 24 - suffix.length))}${suffix}`;
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", candidate))
      .first();

    if (!existing || existing._id === currentUserId) {
      return candidate;
    }
  }

  return `${base.slice(0, 20)}_${Date.now().toString().slice(-3)}`;
}

export async function requireCurrentUser(
  ctx: QueryCtx | MutationCtx,
) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .first();

  if (!user) {
    throw new Error("Current user not found");
  }

  return { identity, user };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.filter((user) => !user.isDemo);
  },
});

export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
  },
});

export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
  },
});

export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

export const getLeaderboard = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const users = await ctx.db
      .query("users")
      .withIndex("by_karma")
      .order("desc")
      .take(limit);

    return users.filter((user) => !user.isDemo);
  },
});

export const listSuggestions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const currentUser = identity
      ? await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
          .first()
      : null;

    const users = await ctx.db
      .query("users")
      .withIndex("by_karma")
      .order("desc")
      .take((args.limit ?? 4) + 1);

    return users
      .filter((user) => !user.isDemo && user._id !== currentUser?._id)
      .slice(0, args.limit ?? 4);
  },
});

export const getProfileByIdentifier = query({
  args: { identifier: v.string() },
  handler: async (ctx, args) => {
    const byUsername = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.identifier))
      .first();

    if (byUsername && !byUsername.isDemo) {
      return byUsername;
    }

    const byClerkId = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.identifier))
      .first();

    return byClerkId && !byClerkId.isDemo ? byClerkId : null;
  },
});

export const syncFromClerk = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    username: v.optional(v.string()),
    email: v.string(),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || identity.subject !== args.clerkId) {
      throw new Error("Unauthenticated");
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      await ctx.db.patch("users", existing._id, {
        name: args.name,
        email: args.email,
        avatar: existing.avatarStorageId ? existing.avatar : args.avatar,
      });
      return existing._id;
    }

    const emailPrefix = args.email.split("@")[0] ?? "user";
    const username = await getAvailableUsername(
      ctx,
      args.username ?? emailPrefix,
    );

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      username,
      email: args.email,
      avatar: args.avatar,
      avatarStorageId: undefined,
      bio: "",
      location: "",
      website: "",
      github: "",
      linkedin: "",
      twitter: "",
      techStack: [],
      aiTools: [],
      tags: [],
      experience: [],
      projects: [],
      education: [],
      certifications: [],
      rank: "newbie",
      karma: 0,
      role: "user",
      isDemo: false,
      createdAt: Date.now(),
    });
  },
});

export const generateAvatarUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireCurrentUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveCurrentAvatar = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const avatarUrl = await ctx.storage.getUrl(args.storageId);

    if (!avatarUrl) {
      throw new Error("Uploaded avatar is no longer available");
    }

    const existingAvatarFile = await ctx.db
      .query("mediaFiles")
      .withIndex("by_owner_folder", (q) => q.eq("ownerId", user._id).eq("folder", "avatars"))
      .first();

    if (user.avatarStorageId) {
      await ctx.storage.delete(user.avatarStorageId);
    }

    if (existingAvatarFile) {
      await ctx.db.patch(existingAvatarFile._id, {
        storageId: args.storageId,
        createdAt: Date.now(),
      });
    } else {
      await ctx.db.insert("mediaFiles", {
        storageId: args.storageId,
        folder: "avatars",
        kind: "avatar",
        ownerId: user._id,
        createdAt: Date.now(),
      });
    }

    await ctx.db.patch(user._id, {
      avatar: avatarUrl,
      avatarStorageId: args.storageId,
    });

    return avatarUrl;
  },
});

export const updateCurrentProfile = mutation({
  args: {
    name: v.string(),
    username: v.string(),
    bio: v.string(),
    location: v.string(),
    website: v.string(),
    github: v.string(),
    linkedin: v.string(),
    twitter: v.string(),
    techStack: v.array(v.string()),
    aiTools: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const username = await getAvailableUsername(ctx, args.username, user._id);

    await ctx.db.patch("users", user._id, {
      name: args.name,
      username,
      bio: args.bio,
      location: args.location,
      website: args.website,
      github: args.github,
      linkedin: args.linkedin,
      twitter: args.twitter,
      techStack: args.techStack,
      aiTools: args.aiTools,
    });

    return user._id;
  },
});
