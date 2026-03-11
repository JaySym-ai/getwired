"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/shared/Avatar";
import { FollowButton } from "@/components/shared/FollowButton";

interface UserSuggestionProps {
  user: {
    clerkId: string;
    name: string;
    username: string;
    avatar: string;
    bio?: string;
    techStack: string[];
  };
}

export function UserSuggestion({ user }: UserSuggestionProps) {
  return (
    <Card className="glass border-white/8 hover:border-[#3B82F6]/20 transition-all">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Link href={`/profile/${user.username}`}>
            <UserAvatar src={user.avatar} name={user.name} size="lg" />
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={`/profile/${user.username}`} className="hover:text-[#3B82F6] transition-colors">
              <p className="text-sm font-semibold truncate">{user.name}</p>
            </Link>
            <p className="text-xs text-muted-foreground">@{user.username}</p>
            {user.bio && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{user.bio}</p>
            )}
            <div className="flex flex-wrap gap-1 mt-2">
              {user.techStack.slice(0, 3).map((tech) => (
                <Badge
                  key={tech}
                  variant="secondary"
                  className="text-[10px] bg-[#3B82F6]/5 text-[#3B82F6]/70 border-none"
                >
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
          <FollowButton
            targetId={user.clerkId}
            targetType="user"
            className="shrink-0 text-xs h-7"
          />
        </div>
      </CardContent>
    </Card>
  );
}

