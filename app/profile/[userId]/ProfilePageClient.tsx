"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { TechStack } from "@/components/profile/TechStack";
import { TechCV } from "@/components/profile/TechCV";
import { ActivityFeed } from "@/components/profile/ActivityFeed";

import { useDemoAuth } from "@/lib/demo-auth";
import type { UserRank } from "@/lib/types";
import type { Experience, Project, Education, Certification } from "@/lib/types";

interface ProfileUser {
  clerkId: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  techStack: string[];
  aiTools: string[];
  experience: Experience[];
  projects: Project[];
  education: Education[];
  certifications: Certification[];
  rank: UserRank;
  karma: number;
  createdAt: number;
}

interface PostItem {
  title: string;
  category?: string;
  likes: number;
  commentCount: number;
  views: number;
  createdAt: number;
}

interface CommentItem {
  content: string;
  postTitle: string;
  likes: number;
  createdAt: number;
}

interface ProfilePageClientProps {
  user: ProfileUser;
  posts: PostItem[];
  comments: CommentItem[];
}

export function ProfilePageClient({ user, posts, comments }: ProfilePageClientProps) {
  const { user: currentUser } = useDemoAuth();
  const isOwnProfile = currentUser?.username === user.username;

  return (
    <main className="px-4 py-6 space-y-6">
      <ProfileHeader user={{ ...user, postCount: posts.length }} isOwnProfile={isOwnProfile} />

      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start bg-zinc-900/40 border border-white/[0.06] rounded-full p-1 h-auto">
          <TabsTrigger value="overview" className="rounded-full text-xs px-4 py-1.5 data-active:bg-[#3B82F6] data-active:text-white data-active:shadow-lg data-active:shadow-blue-500/20">
            Overview
          </TabsTrigger>
          <TabsTrigger value="posts" className="rounded-full text-xs px-4 py-1.5 data-active:bg-[#3B82F6] data-active:text-white data-active:shadow-lg data-active:shadow-blue-500/20">
            Posts ({posts.length})
          </TabsTrigger>
          <TabsTrigger value="comments" className="rounded-full text-xs px-4 py-1.5 data-active:bg-[#3B82F6] data-active:text-white data-active:shadow-lg data-active:shadow-blue-500/20">
            Comments ({comments.length})
          </TabsTrigger>
          <TabsTrigger value="cv" className="rounded-full text-xs px-4 py-1.5 data-active:bg-[#3B82F6] data-active:text-white data-active:shadow-lg data-active:shadow-blue-500/20">
            Tech CV
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6 pt-6">
            <div>
              <TechStack techStack={user.techStack} aiTools={user.aiTools} />
            </div>
            <div>
              <ActivityFeed posts={posts} comments={comments} mode="all" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="posts">
          <div className="pt-6">
            <ActivityFeed posts={posts} comments={[]} mode="posts" />
          </div>
        </TabsContent>

        <TabsContent value="comments">
          <div className="pt-6">
            <ActivityFeed posts={[]} comments={comments} mode="comments" />
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

