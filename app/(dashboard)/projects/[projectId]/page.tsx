"use client";

import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Key,
  Users,
  MessageSquare,
  TrendingUp,
  Bot,
  ExternalLink,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function ProjectOverviewPage() {
  const params = useParams();
  const projectId = params.projectId as Id<"projects">;
  const project = useQuery(api.projects.getProject, { projectId });
  const keywords = useQuery(api.keywords.listByProject, { projectId });
  const competitors = useQuery(api.competitors.listByProject, { projectId });

  if (project === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const trackedKeywords = keywords?.filter((k) => k.tracked) ?? [];
  const avgDifficulty =
    trackedKeywords.length > 0
      ? Math.round(
          trackedKeywords.reduce((sum, k) => sum + (k.difficulty ?? 0), 0) /
            trackedKeywords.filter((k) => k.difficulty != null).length || 0
        )
      : null;
  const avgGeo =
    trackedKeywords.length > 0
      ? Math.round(
          trackedKeywords.reduce((sum, k) => sum + (k.geoScore ?? 0), 0) /
            trackedKeywords.filter((k) => k.geoScore != null).length || 0
        )
      : null;

  const subNav = [
    { label: "Keywords", href: `/projects/${projectId}/keywords`, icon: Key },
    { label: "Competitors", href: `/projects/${projectId}/competitors`, icon: Users },
    { label: "Reddit", href: `/projects/${projectId}/reddit`, icon: MessageSquare },
    { label: "Knowledge", href: `/projects/${projectId}/knowledge`, icon: Bot },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
            <Badge
              variant={
                project.status === "ready"
                  ? "default"
                  : project.status === "scanning"
                    ? "secondary"
                    : "destructive"
              }
              className="text-[10px]"
            >
              {project.status}
            </Badge>
          </div>
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mt-1"
          >
            {project.url}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {project.status === "scanning" && (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="flex items-center gap-3 py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <p className="text-sm">Scanning website and extracting keywords...</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Keywords Tracked</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground/60" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">{trackedKeywords.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {keywords?.length ?? 0} total extracted
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Avg Difficulty</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground/60" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">
              {avgDifficulty != null ? `${avgDifficulty}/100` : "—"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">GEO Visibility</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground/60" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">
              {avgGeo != null ? `${avgGeo}%` : "—"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Competitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground/60" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">{competitors?.length ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {subNav.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="bg-card/30 hover:bg-card/60 transition-all duration-200 cursor-pointer group">
              <CardContent className="flex items-center gap-3 py-4">
                <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{item.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

