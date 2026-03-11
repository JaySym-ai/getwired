"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/shared/Avatar";
import { RankBadge } from "@/components/shared/Badge";
import { Trophy } from "lucide-react";
import { DEMO_USERS } from "@/lib/demo-data";
import type { UserRank } from "@/lib/types";
import Link from "next/link";

const MEDALS = ["🥇", "🥈", "🥉"] as const;

const sortedUsers = [...DEMO_USERS].sort((a, b) => b.karma - a.karma).slice(0, 10);

// Simulate "this month" by slightly shuffling order
const monthlyUsers = [...DEMO_USERS]
  .sort((a, b) => {
    const aMonthly = Math.round(a.karma * (0.3 + Math.random() * 0.2));
    const bMonthly = Math.round(b.karma * (0.3 + Math.random() * 0.2));
    return bMonthly - aMonthly;
  })
  .slice(0, 10);

function LeaderboardList({ users }: { users: typeof DEMO_USERS }) {
  return (
    <div className="space-y-2">
      {users.map((user, index) => {
        const position = index + 1;
        const isTop3 = position <= 3;
        return (
          <Link
            key={user.clerkId}
            href={`/profile/${user.username}`}
            className={`flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white/5 ${
              isTop3 ? "bg-[#3B82F6]/5" : ""
            }`}
          >
            {/* Position */}
            <span className="w-7 text-center text-sm font-bold shrink-0">
              {isTop3 ? MEDALS[index] : `#${position}`}
            </span>

            <UserAvatar src={user.avatar} name={user.name} size="sm" />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium truncate">{user.name}</span>
                <RankBadge rank={user.rank as UserRank} />
              </div>
              <span className="text-xs text-muted-foreground">@{user.username}</span>
            </div>

            <span className="text-sm font-semibold text-[#3B82F6] tabular-nums shrink-0">
              {user.karma.toLocaleString()}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export function Leaderboard() {
  return (
    <Card className="glass border-white/8">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Trophy className="size-4 text-[#3B82F6]" />
          Top Contributors
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="month">
          <TabsList className="mb-3 bg-zinc-900/40 border border-white/8 w-full">
            <TabsTrigger value="month" className="flex-1 text-xs data-active:text-[#3B82F6]">
              This Month
            </TabsTrigger>
            <TabsTrigger value="all" className="flex-1 text-xs data-active:text-[#3B82F6]">
              All Time
            </TabsTrigger>
          </TabsList>
          <TabsContent value="month">
            <LeaderboardList users={monthlyUsers} />
          </TabsContent>
          <TabsContent value="all">
            <LeaderboardList users={sortedUsers} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

