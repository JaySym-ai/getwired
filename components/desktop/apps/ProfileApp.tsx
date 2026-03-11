"use client";

import { useMemo } from "react";
import { ProfilePageClient } from "@/app/profile/[userId]/ProfilePageClient";
import { useDemoAuth } from "@/lib/demo-auth";
import { DEMO_USERS, DEMO_POSTS, DEMO_COMMENTS } from "@/lib/demo-data";

/**
 * ProfileApp renders the current user's profile inside a desktop window.
 * It constructs the same props that the profile page.tsx server component would pass.
 */
export function ProfileApp() {
  const { user: authUser } = useDemoAuth();

  const { profileUser, posts, comments } = useMemo(() => {
    const demoUser =
      DEMO_USERS.find((u) => u.username === authUser?.username) ?? DEMO_USERS[0]!;
    const userIndex = DEMO_USERS.indexOf(demoUser);

    const userPosts = DEMO_POSTS
      .filter((p) => p.authorIndex === userIndex)
      .map((p) => ({
        title: p.title,
        category: p.category,
        likes: p.likes,
        commentCount: p.commentCount,
        views: p.views,
        createdAt: p.createdAt,
      }));

    const userComments = DEMO_COMMENTS
      .filter((c) => c.authorIndex === userIndex)
      .map((c) => ({
        content: c.content,
        postTitle: DEMO_POSTS[c.postIndex]?.title ?? "Unknown post",
        likes: c.likes,
        createdAt: c.createdAt,
      }));

    return { profileUser: demoUser, posts: userPosts, comments: userComments };
  }, [authUser?.username]);

  return (
    <div className="p-4">
      <ProfilePageClient
        user={profileUser}
        posts={posts}
        comments={comments}
      />
    </div>
  );
}

