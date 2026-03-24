"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Globe, ExternalLink } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ProjectsPage() {
  const projects = useQuery(api.projects.listMyProjects);

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your growth intelligence projects
          </p>
        </div>
        <Link href="/projects/new" className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}>
          <Plus className="h-3.5 w-3.5" />
          New Project
        </Link>
      </div>

      {projects === undefined ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse bg-card/50">
              <CardHeader>
                <div className="h-5 bg-muted rounded w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="border-dashed border-border/50 bg-transparent">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted/50 p-4 mb-5">
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold mb-1.5">No projects yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
              Create your first project to start analyzing growth opportunities.
            </p>
            <Link href="/projects/new" className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}>
              <Plus className="h-3.5 w-3.5" />
              Create Project
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project._id} href={`/projects/${project._id}`}>
              <Card className="bg-card/50 hover:bg-card/80 transition-all duration-200 cursor-pointer hover:ring-foreground/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{project.name}</CardTitle>
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
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    <span className="truncate">{project.url}</span>
                  </div>
                  {project.scannedAt && (
                    <p className="text-[11px] text-muted-foreground/70 mt-2">
                      Scanned {new Date(project.scannedAt).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

