"use client";

import { useQuery } from "convex/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { TechStack } from "@/components/profile/TechStack";
import { TechCV } from "@/components/profile/TechCV";
import { ActivityFeed } from "@/components/profile/ActivityFeed";
import { useAppAuth } from "@/lib/auth";
import { api } from "../../../convex/_generated/api";

export function ProfilePageClient({ userId }: { userId: string }) {
  const { user: currentUser } = useAppAuth();
  const user = useQuery(api.users.getProfileByIdentifier, { identifier: userId });
  const posts = useQuery(
    api.posts.getDetailedByAuthor,
    user ? { authorId: user._id, limit: 50 } : "skip",
  ) ?? [];
  const comments = useQuery(
    api.comments.getByAuthor,
    user ? { authorId: user._id, limit: 50 } : "skip",
  ) ?? [];

  if (user === undefined) {
    return null;
  }

  if (!user) {
    return (
      <main className="space-y-6 px-4 py-6">
        <p className="text-sm text-muted-foreground">Profile not found.</p>
      </main>
    );
  }

  const isOwnProfile = currentUser?.username === user.username;

  return (
    <main className="space-y-6 px-4 py-6">
      <ProfileHeader
        user={{
          name: user.name,
          username: user.username,
          avatar: user.avatar,
          bio: user.bio,
          location: user.location,
          website: user.website,
          github: user.github,
          linkedin: user.linkedin,
          twitter: user.twitter,
          rank: user.rank,
          karma: user.karma,
          createdAt: user.createdAt,
          postCount: posts.length,
        }}
        isOwnProfile={isOwnProfile}
      />

      <Tabs defaultValue="overview">
        <TabsList className="h-auto w-full justify-start rounded-full border border-border bg-muted/50 p-1">
          <TabsTrigger value="overview" className="rounded-full px-4 py-1.5 text-xs data-active:bg-[#3B82F6] data-active:text-white data-active:shadow-lg data-active:shadow-blue-500/20">
            Overview
          </TabsTrigger>
          <TabsTrigger value="posts" className="rounded-full px-4 py-1.5 text-xs data-active:bg-[#3B82F6] data-active:text-white data-active:shadow-lg data-active:shadow-blue-500/20">
            Posts ({posts.length})
          </TabsTrigger>
          <TabsTrigger value="comments" className="rounded-full px-4 py-1.5 text-xs data-active:bg-[#3B82F6] data-active:text-white data-active:shadow-lg data-active:shadow-blue-500/20">
            Comments ({comments.length})
          </TabsTrigger>
          <TabsTrigger value="cv" className="rounded-full px-4 py-1.5 text-xs data-active:bg-[#3B82F6] data-active:text-white data-active:shadow-lg data-active:shadow-blue-500/20">
            Tech CV
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-6 pt-6 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <TechStack techStack={user.techStack} aiTools={user.aiTools} />
            </div>
            <div>
              <ActivityFeed
                posts={posts.map((post) => ({
                  id: post._id,
                  title: post.title,
                  category: post.categoryInfo?.name ?? post.category,
                  categorySlug: post.category ?? undefined,
                  likes: post.likes,
                  commentCount: post.commentCount,
                  views: post.views,
                  createdAt: post.createdAt,
                }))}
                comments={comments.map((comment) => ({
                  id: comment._id,
                  content: comment.content,
                  postId: comment.postId,
                  postTitle: comment.postTitle,
                  likes: comment.likes,
                  createdAt: comment.createdAt,
                }))}
                mode="all"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="posts">
          <div className="pt-6">
            <ActivityFeed
              posts={posts.map((post) => ({
                id: post._id,
                title: post.title,
                category: post.categoryInfo?.name ?? post.category,
                categorySlug: post.category ?? undefined,
                likes: post.likes,
                commentCount: post.commentCount,
                views: post.views,
                createdAt: post.createdAt,
              }))}
              comments={[]}
              mode="posts"
            />
          </div>
        </TabsContent>

        <TabsContent value="comments">
          <div className="pt-6">
            <ActivityFeed
              posts={[]}
              comments={comments.map((comment) => ({
                id: comment._id,
                content: comment.content,
                postId: comment.postId,
                postTitle: comment.postTitle,
                likes: comment.likes,
                createdAt: comment.createdAt,
              }))}
              mode="comments"
            />
          </div>
        </TabsContent>

        <TabsContent value="cv">
          <div className="pt-6">
            <TechCV
              experience={user.experience}
              projects={user.projects}
              education={user.education}
              certifications={user.certifications}
            />
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
