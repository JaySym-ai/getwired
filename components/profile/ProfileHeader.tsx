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
  };
  isOwnProfile?: boolean;
}

export function ProfileHeader({ user, isOwnProfile }: ProfileHeaderProps) {
  const [isFollowing, setIsFollowing] = useState(false);

  const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="glass-strong rounded-2xl p-6 md:p-8 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6]/5 via-transparent to-purple-500/5 pointer-events-none" />

      <div className="relative flex flex-col md:flex-row gap-6 items-start">
        {/* Avatar */}
        <div className="relative group">
          <UserAvatar src={user.avatar} name={user.name} size="xl" className="size-24 md:size-28 ring-2 ring-[#3B82F6]/30" />
          {isOwnProfile && (
            <button className="absolute inset-0 flex items-center justify-center bg-zinc-900/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="size-5 text-white" />
            </button>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{user.name}</h1>
            <RankBadge rank={user.rank} className="text-xs px-3 py-1" />
          </div>

          <p className="text-muted-foreground text-sm">@{user.username}</p>

          {user.bio && (
            <p className="text-foreground/80 text-sm md:text-base max-w-2xl leading-relaxed">{user.bio}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {user.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                {user.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5" />
              Joined {memberSince}
            </span>
            <span className="flex items-center gap-1 text-[#3B82F6]">
              <Trophy className="size-3.5" />
              <span className="font-semibold">{user.karma.toLocaleString()}</span> karma
            </span>
          </div>

          {/* Social links */}
          <div className="flex items-center gap-2">
            {user.github && (
              <a href={`https://github.com/${user.github}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <Github className="size-4" />
              </a>
            )}
            {user.linkedin && (
              <a href={`https://linkedin.com/in/${user.linkedin}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <Linkedin className="size-4" />
              </a>
            )}
            {user.twitter && (
              <a href={`https://x.com/${user.twitter}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="size-4" />
              </a>
            )}
            {user.website && (
              <a href={user.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <Globe className="size-4" />
              </a>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {!isOwnProfile && (
          <div className="flex gap-2 sm:flex-col">
            <Button
              variant={isFollowing ? "secondary" : "default"}
              size="sm"
              onClick={() => setIsFollowing(!isFollowing)}
              className={isFollowing ? "" : "bg-[#3B82F6] text-white hover:bg-[#2563EB]"}
            >
              {isFollowing ? <UserCheck className="size-4 mr-1" /> : <UserPlus className="size-4 mr-1" />}
              {isFollowing ? "Following" : "Follow"}
            </Button>
            <Link href="/chat" className="inline-flex items-center justify-center h-7 gap-1 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted transition-colors">
              <MessageSquare className="size-4" />
              Message
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

