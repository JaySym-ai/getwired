"use client";

import { useMemo } from "react";
import { ProfilePageClient } from "@/app/profile/[userId]/ProfilePageClient";
import { useAppAuth } from "@/lib/auth";
import { DEMO_USERS, DEMO_POSTS, DEMO_COMMENTS } from "@/lib/demo-data";

/**
 * ProfileApp renders the current user's profile inside a desktop window.
 * It constructs the same props that the profile page.tsx server component would pass.
 */
export function ProfileApp() {
  const { user: authUser } = useAppAuth();

  const { profileUser, posts, comments } = useMemo(() => {
    const demoUser = DEMO_USERS.find((u) => u.username === authUser?.username);
    const userIndex = demoUser ? DEMO_USERS.indexOf(demoUser) : -1;

    const userPosts =
      userIndex >= 0
        ? DEMO_POSTS.filter((p) => p.authorIndex === userIndex).map((p) => ({
            title: p.title,
            category: p.category,
            likes: p.likes,
            commentCount: p.commentCount,
            views: p.views,
            createdAt: p.createdAt,
          }))
        : [];

    const userComments =
      userIndex >= 0
        ? DEMO_COMMENTS.filter((c) => c.authorIndex === userIndex).map((c) => ({
            content: c.content,
            postTitle: DEMO_POSTS[c.postIndex]?.title ?? "Unknown post",
            likes: c.likes,
            createdAt: c.createdAt,
          }))
        : [];

    const profileUser = demoUser ?? {
      clerkId: authUser?.clerkId ?? "guest",
      name: authUser?.displayName ?? "GetWired User",
      username: authUser?.username ?? "guest",
      avatar: authUser?.avatarUrl,
      bio: authUser?.bio,
      location: authUser?.location,
      website: authUser?.website,
      github: authUser?.github,
      linkedin: authUser?.linkedin,
      twitter: authUser?.twitter,
      techStack: authUser?.techStack ?? [],
      aiTools: authUser?.aiTools ?? [],
      experience: authUser?.experience ?? [],
      projects: authUser?.projects ?? [],
      education: authUser?.education ?? [],
      certifications: authUser?.certifications ?? [],
      rank: authUser?.rank ?? "newbie",
      karma: authUser?.karma ?? 0,
      createdAt: authUser ? Date.parse(authUser.joinedAt) : 0,
    };

    return { profileUser, posts: userPosts, comments: userComments };
  }, [authUser]);

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
