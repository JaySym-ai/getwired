"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import {
  ShieldAlert,
  Users,
  FileText,
  Activity,
  Flag,
  Home,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserAvatar } from "@/components/shared/Avatar";
import { useAppAuth } from "@/lib/auth";
import { RANKS } from "@/lib/constants";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AdminClient() {
  const { user } = useAppAuth();
  const users = useQuery(api.users.list, {}) ?? [];
  const posts = useQuery(api.posts.listDetailed, { limit: 200 }) ?? [];
  const logs = useQuery(api.moderation.getLogs, { limit: 50 }) ?? [];
  const isAdmin = user?.rank === "moderator" || user?.rank === "top";

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-lg px-4 py-20 text-center">
        <ShieldAlert className="mx-auto mb-4 size-16 text-red-400" />
        <h1 className="mb-2 text-2xl font-bold text-foreground">Access Denied</h1>
        <p className="mb-6 text-muted-foreground">
          You don&apos;t have permission to view the admin dashboard.
        </p>
        <Link href="/">
          <Button variant="outline" className="border-border">
            <Home className="mr-2 size-4" /> Back to Home
          </Button>
        </Link>
      </main>
    );
  }

  const flaggedLogs = logs.filter((log) => log.action === "flagged");
  const reviewedLogs = logs.filter((log) => log.action !== "flagged");

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <ShieldAlert className="size-7 text-[#3B82F6]" />
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
      </div>
      <StatsGrid userCount={users.length} postCount={posts.length} flaggedCount={flaggedLogs.length} />
      <ModerationQueue logs={flaggedLogs} users={users} />
      <RecentUsers users={users} />
      <ContentReports logs={reviewedLogs} users={users} />
    </main>
  );
}

function StatsGrid({
  userCount,
  postCount,
  flaggedCount,
}: {
  userCount: number;
  postCount: number;
  flaggedCount: number;
}) {
  const stats = [
    { label: "Total Users", value: userCount.toString(), icon: Users, color: "text-blue-400" },
    { label: "Total Posts", value: postCount.toString(), icon: FileText, color: "text-purple-400" },
    { label: "Flagged Content", value: flaggedCount.toString(), icon: Flag, color: "text-red-400" },
    { label: "Active Signals", value: (userCount + postCount).toString(), icon: Activity, color: "text-[#3B82F6]" },
  ];

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="glass border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
            <stat.icon className={`size-8 ${stat.color} opacity-60`} />
          </div>
        </Card>
      ))}
    </div>
  );
}

function ModerationQueue({ logs, users }: { logs: Array<any>; users: Array<any> }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const visibleLogs = logs.filter((log) => !dismissed.has(log._id));

  return (
    <section className="mb-8">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
        <Flag className="size-5 text-red-400" /> Moderation Queue
      </h2>
      <Card className="glass overflow-hidden border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Type</TableHead>
              <TableHead className="text-muted-foreground">Content</TableHead>
              <TableHead className="text-muted-foreground">Author</TableHead>
              <TableHead className="text-muted-foreground">Reason</TableHead>
              <TableHead className="text-muted-foreground">Date</TableHead>
              <TableHead className="text-right text-muted-foreground">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No flagged content.
                </TableCell>
              </TableRow>
            ) : (
              visibleLogs.map((log) => {
                const author = users.find((user) => user._id === log.authorId);
                return (
                  <TableRow key={log._id} className="border-border">
                    <TableCell>
                      <Badge variant="outline" className="border-border text-xs capitalize">
                        {log.contentType}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {log.contentId}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">{author?.name ?? "Unknown"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.reason}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{fmtDate(log.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-blue-400 hover:text-blue-300"
                          onClick={() => {
                            toast.success("Marked as reviewed");
                            setDismissed((current) => new Set(current).add(log._id));
                          }}
                        >
                          <CheckCircle2 className="mr-1 size-3" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            toast.info("Dismissed from local queue");
                            setDismissed((current) => new Set(current).add(log._id));
                          }}
                        >
                          <XCircle className="mr-1 size-3" /> Dismiss
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </section>
  );
}

function RecentUsers({ users }: { users: Array<any> }) {
  return (
    <section className="mb-8">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
        <Users className="size-5 text-blue-400" /> Recent Users
      </h2>
      <Card className="glass overflow-hidden border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">User</TableHead>
              <TableHead className="text-muted-foreground">Username</TableHead>
              <TableHead className="text-muted-foreground">Rank</TableHead>
              <TableHead className="text-muted-foreground">Karma</TableHead>
              <TableHead className="text-muted-foreground">Role</TableHead>
              <TableHead className="text-muted-foreground">Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((entry) => {
              const rankInfo = RANKS[entry.rank];
              return (
                <TableRow key={entry._id} className="border-border">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserAvatar src={entry.avatar} name={entry.name} size="sm" />
                      <span className="text-sm font-medium text-foreground">{entry.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">@{entry.username}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-border text-xs" style={{ color: rankInfo?.color }}>
                      {rankInfo?.label ?? entry.rank}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-[#3B82F6]">{entry.karma.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs capitalize ${
                        entry.role === "moderator"
                          ? "border-red-400/30 text-red-400"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {entry.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{fmtDate(entry.createdAt)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </section>
  );
}

function ContentReports({ logs, users }: { logs: Array<any>; users: Array<any> }) {
  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
        <FileText className="size-5 text-purple-400" /> Content Reports
      </h2>
      <div className="space-y-2">
        {logs.length === 0 && (
          <Card className="glass border-border p-4 text-sm text-muted-foreground">
            No reviewed moderation logs yet.
          </Card>
        )}
        {logs.map((log) => {
          const author = users.find((user) => user._id === log.authorId);
          return (
            <Card key={log._id} className="glass border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={`text-xs capitalize ${
                      log.action === "approved"
                        ? "border-blue-400/30 text-blue-400"
                        : "border-red-400/30 text-red-400"
                    }`}
                  >
                    {log.action}
                  </Badge>
                  <span className="text-sm text-foreground">{log.contentType}</span>
                  <span className="text-sm text-muted-foreground">by {author?.name ?? "Unknown"}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{log.reason}</span>
                  <span>{fmtDate(log.createdAt)}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
