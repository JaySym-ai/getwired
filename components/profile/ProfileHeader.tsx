"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/Avatar";
import { RankBadge } from "@/components/shared/Badge";
import {
  MapPin,
  Github,
  Linkedin,
  Twitter,
  Globe,
  Trophy,
  MessageSquare,
  UserPlus,
  UserCheck,
  Calendar,
  Camera,
  FileText,
} from "lucide-react";
import type { UserRank } from "@/lib/types";

interface ProfileHeaderProps {
  user: {
    name: string;
    username: string;
    avatar?: string;
    bio?: string;
    location?: string;
    website?: string;
    github?: string;
    linkedin?: string;
    twitter?: string;
    rank: UserRank;
    karma: number;
    createdAt: number;
    postCount?: number;
  };
  isOwnProfile?: boolean;
}

const socialLinks = [
  { key: "github" as const, icon: Github, href: (v: string) => `https://github.com/${v}`, label: "GitHub" },
  { key: "linkedin" as const, icon: Linkedin, href: (v: string) => `https://linkedin.com/in/${v}`, label: "LinkedIn" },
  { key: "twitter" as const, icon: Twitter, href: (v: string) => `https://x.com/${v}`, label: "X" },
  { key: "website" as const, icon: Globe, href: (v: string) => v, label: "Website" },
] as const;

export function ProfileHeader({ user, isOwnProfile }: ProfileHeaderProps) {
  const [isFollowing, setIsFollowing] = useState(false);

  const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="glass-strong rounded-2xl relative overflow-hidden">
      {/* Cover banner with mesh gradient */}
      <div className="h-28 md:h-32 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/10 to-blue-600/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-900/90" />
        <div className="absolute top-4 right-6 left-6 flex items-center">
          {/* Action buttons in banner */}
          {!isOwnProfile && (
            <div className="flex gap-2 ml-auto">
              <Button
                variant={isFollowing ? "secondary" : "default"}
                size="sm"
                onClick={() => setIsFollowing(!isFollowing)}
                className={
                  isFollowing
                    ? "glass border-white/10 h-8 rounded-full px-4 text-xs font-medium"
                    : "bg-[#3B82F6] text-white hover:bg-[#2563EB] h-8 rounded-full px-4 text-xs font-medium shadow-lg shadow-blue-500/20"
                }
              >
                {isFollowing ? <UserCheck className="size-3.5 mr-1.5" /> : <UserPlus className="size-3.5 mr-1.5" />}
                {isFollowing ? "Following" : "Follow"}
              </Button>
              <Link
                href="/chat"
                className="inline-flex items-center justify-center h-8 gap-1.5 rounded-full glass border-white/10 px-4 text-xs font-medium text-foreground hover:bg-white/10 transition-colors"
              >
                <MessageSquare className="size-3.5" />
                Message
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="px-6 md:px-8 pb-6">
        {/* Avatar overlapping banner */}
        <div className="relative -mt-14 md:-mt-16 mb-4">
          <div className="relative group inline-block">
            <UserAvatar
              src={user.avatar}
              name={user.name}
              size="xl"
              className="size-28 md:size-32 ring-4 ring-zinc-900 shadow-lg shadow-blue-500/20"
            />
            {isOwnProfile && (
              <button
                className="absolute inset-0 flex items-center justify-center bg-zinc-900/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
                aria-label="Change profile photo"
              >
                <Camera className="size-6 text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Name & Username */}
        <div className="space-y-1 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">{user.name}</h1>
            <RankBadge rank={user.rank} className="text-xs px-3 py-1" />
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-white/[0.06] px-3 py-0.5 text-sm text-muted-foreground font-medium">
              @{user.username}
            </span>
            {user.location && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-3.5" />
                {user.location}
              </span>
            )}
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="text-foreground/80 text-sm md:text-base max-w-2xl leading-relaxed mb-5">
            {user.bio}
          </p>
        )}

        {/* Stats row */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="glass rounded-xl px-4 py-2.5 flex flex-col items-center min-w-[80px]">
            <span className="text-lg font-bold text-foreground">{user.karma.toLocaleString()}</span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Trophy className="size-3 text-[#3B82F6]" />
              karma
            </span>
          </div>
          <div className="glass rounded-xl px-4 py-2.5 flex flex-col items-center min-w-[80px]">
            <span className="text-lg font-bold text-foreground">{(user.postCount ?? 0).toLocaleString()}</span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <FileText className="size-3 text-[#3B82F6]" />
              posts
            </span>
          </div>
          <div className="glass rounded-xl px-4 py-2.5 flex flex-col items-center min-w-[80px]">
            <span className="text-lg font-bold text-foreground">{memberSince}</span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Calendar className="size-3 text-[#3B82F6]" />
              joined
            </span>
          </div>
        </div>

        {/* Social links as glass pills */}
        <div className="flex flex-wrap items-center gap-2">
          {socialLinks.map(({ key, icon: Icon, href, label }) => {
            const value = user[key];
            if (!value) return null;
            return (
              <a
                key={key}
                href={href(value)}
                target="_blank"
                rel="noopener noreferrer"
                className="group/social inline-flex items-center gap-1.5 h-8 rounded-full glass px-3 text-muted-foreground hover:text-foreground hover:bg-white/[0.08] transition-colors focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
                aria-label={label}
              >
                <Icon className="size-3.5" />
                <span className="text-xs font-medium">{label}</span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

