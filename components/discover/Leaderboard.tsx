"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/shared/Avatar";
import { RankBadge } from "@/components/shared/Badge";
import { Trophy } from "lucide-react";
import { api } from "../../convex/_generated/api";

const MEDALS = ["🥇", "🥈", "🥉"] as const;

function LeaderboardList({ users }: { users: Array<any> }) {
  return (
    <div className="space-y-2">
      {users.map((user, index) => {
        const position = index + 1;
        const isTop3 = position <= 3;
        return (
          <Link
            key={user._id}
            href={`/profile/${user.username}`}
            className={`flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent ${
              isTop3 ? "bg-[#3B82F6]/5" : ""
            }`}
          >
            <span className="w-7 shrink-0 text-center text-sm font-bold">
              {isTop3 ? MEDALS[index] : `#${position}`}
            </span>

            <UserAvatar src={user.avatar} name={user.name} size="sm" />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-medium">{user.name}</span>
                <RankBadge rank={user.rank} />
              </div>
              <span className="text-xs text-muted-foreground">@{user.username}</span>
            </div>

            <span className="shrink-0 text-sm font-semibold tabular-nums text-[#3B82F6]">
              {user.karma.toLocaleString()}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export function Leaderboard() {
  const users = useQuery(api.users.getLeaderboard, { limit: 10 }) ?? [];
  const monthlyUsers = useMemo(
    () => [...users].sort((left, right) => right.createdAt - left.createdAt).slice(0, 10),
    [users],
  );

  return (
    <Card className="glass border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Trophy className="size-4 text-[#3B82F6]" />
          Top Contributors
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="month">
          <TabsList className="mb-3 w-full border border-border bg-muted/50">
            <TabsTrigger value="month" className="flex-1 text-xs data-active:text-[#3B82F6]">
              Recently Active
            </TabsTrigger>
            <TabsTrigger value="all" className="flex-1 text-xs data-active:text-[#3B82F6]">
              All Time
            </TabsTrigger>
          </TabsList>
          <TabsContent value="month">
            <LeaderboardList users={monthlyUsers} />
          </TabsContent>
          <TabsContent value="all">
            <LeaderboardList users={users} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
