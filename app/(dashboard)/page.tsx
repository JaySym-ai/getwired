"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { FolderKanban, Bot, TrendingUp, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const projects = useQuery(api.projects.listMyProjects);

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your growth intelligence overview
          </p>
        </div>
        <Link href="/projects/new" className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}>
          <Plus className="h-3.5 w-3.5" />
          New Project
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Projects
            </CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground/60" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">
              {projects?.length ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Keywords Tracked
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground/60" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">—</div>
            <p className="text-xs text-muted-foreground mt-1">
              Create a project to start tracking
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Agent Runs
            </CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground/60" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">—</div>
            <p className="text-xs text-muted-foreground mt-1">
              Use the agent to analyze your growth
            </p>
          </CardContent>
        </Card>
      </div>

      {projects && projects.length === 0 && (
        <Card className="border-dashed border-border/50 bg-transparent">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted/50 p-4 mb-5">
              <FolderKanban className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold mb-1.5">No projects yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
              Get started by creating your first project. Enter your website URL
              and we&apos;ll extract keywords, find competitors, and surface
              growth opportunities.
            </p>
            <Link href="/projects/new" className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}>
              <Plus className="h-3.5 w-3.5" />
              Create Your First Project
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

