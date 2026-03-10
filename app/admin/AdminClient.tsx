"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert, Users, FileText, Activity, Flag,
  CheckCircle2, XCircle, Home,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { UserAvatar } from "@/components/shared/Avatar";
import { useDemoAuth } from "@/lib/demo-auth";
import { DEMO_MODERATION_LOGS, DEMO_USERS as DATA_USERS, DEMO_POSTS } from "@/lib/demo-data";
import { RANKS } from "@/lib/constants";
import { toast } from "sonner";

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function AdminClient() {
  const { user } = useDemoAuth();
  const isAdmin = user?.rank === "moderator" || user?.rank === "top";

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-lg px-4 py-20 text-center">
        <ShieldAlert className="mx-auto mb-4 size-16 text-red-400" />
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">You don&apos;t have permission to view the admin dashboard.</p>
        <Link href="/">
          <Button variant="outline" className="border-white/10">
            <Home className="mr-2 size-4" /> Back to Home
          </Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <ShieldAlert className="size-7 text-[#00FF41]" />
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
      </div>
      <StatsGrid />
      <ModerationQueue />
      <RecentUsers />
      <ContentReports />
    </main>
  );
}

const STATS = [
  { label: "Total Users", value: DATA_USERS.length.toString(), icon: Users, color: "text-blue-400" },
  { label: "Total Posts", value: DEMO_POSTS.length.toString(), icon: FileText, color: "text-purple-400" },
  { label: "Active Today", value: "142", icon: Activity, color: "text-[#00FF41]" },
  { label: "Flagged Content", value: DEMO_MODERATION_LOGS.filter((l) => l.action === "flagged").length.toString(), icon: Flag, color: "text-red-400" },
];

function StatsGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      {STATS.map((s) => (
        <Card key={s.label} className="glass border-white/5 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-bold text-white">{s.value}</p>
            </div>
            <s.icon className={`size-8 ${s.color} opacity-60`} />
          </div>
        </Card>
      ))}
    </div>
  );
}

function ModerationQueue() {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const logs = DEMO_MODERATION_LOGS.map((l, i) => ({ ...l, _idx: i })).filter(
    (l) => l.action === "flagged" && !dismissed.has(l._idx)
  );

  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Flag className="size-5 text-red-400" /> Moderation Queue
      </h2>
      <Card className="glass border-white/5 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Type</TableHead>
              <TableHead className="text-muted-foreground">Content Preview</TableHead>
              <TableHead className="text-muted-foreground">Author</TableHead>
              <TableHead className="text-muted-foreground">Reason</TableHead>
              <TableHead className="text-muted-foreground">Date</TableHead>
              <TableHead className="text-muted-foreground text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No flagged content — all clear! ✅
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const author = DATA_USERS[log.authorIndex];
                return (
                  <TableRow key={log._idx} className="border-white/5">
                    <TableCell>
                      <Badge variant="outline" className="text-xs border-white/10 capitalize">{log.contentType}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{log.reason}</TableCell>
                    <TableCell className="text-sm text-white">{author?.name ?? "Unknown"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.reason}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{fmtDate(log.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-green-400 hover:text-green-300"
                          onClick={() => { toast.success("Content approved"); setDismissed((s) => new Set(s).add(log._idx)); }}>
                          <CheckCircle2 className="mr-1 size-3" /> Approve
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-white"
                          onClick={() => { toast.info("Report dismissed"); setDismissed((s) => new Set(s).add(log._idx)); }}>
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



function RecentUsers() {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Users className="size-5 text-blue-400" /> Recent Users
      </h2>
      <Card className="glass border-white/5 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-muted-foreground">User</TableHead>
              <TableHead className="text-muted-foreground">Username</TableHead>
              <TableHead className="text-muted-foreground">Rank</TableHead>
              <TableHead className="text-muted-foreground">Karma</TableHead>
              <TableHead className="text-muted-foreground">Role</TableHead>
              <TableHead className="text-muted-foreground">Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {DATA_USERS.map((u, i) => {
              const rankInfo = RANKS[u.rank];
              return (
                <TableRow key={i} className="border-white/5">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserAvatar src={u.avatar} name={u.name} size="sm" />
                      <span className="text-sm font-medium text-white">{u.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">@{u.username}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs border-white/10" style={{ color: rankInfo?.color }}>
                      {rankInfo?.label ?? u.rank}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-[#00FF41]">{u.karma.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs capitalize ${u.role === "moderator" ? "border-red-400/30 text-red-400" : "border-white/10 text-muted-foreground"}`}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{fmtDate(u.createdAt)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </section>
  );
}

function ContentReports() {
  const logs = DEMO_MODERATION_LOGS.filter((l) => l.action !== "flagged");
  return (
    <section>
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <FileText className="size-5 text-purple-400" /> Content Reports
      </h2>
      <div className="space-y-2">
        {logs.map((log, i) => {
          const author = DATA_USERS[log.authorIndex];
          return (
            <Card key={i} className="glass border-white/5 p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={`text-xs capitalize ${log.action === "approved" ? "border-green-400/30 text-green-400" : "border-red-400/30 text-red-400"}`}>
                    {log.action}
                  </Badge>
                  <span className="text-sm text-white">{log.contentType}</span>
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