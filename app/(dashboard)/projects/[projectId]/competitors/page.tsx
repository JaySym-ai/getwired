"use client";

import { useQuery, useAction } from "convex/react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Search, Globe } from "lucide-react";

export default function CompetitorsPage() {
  const params = useParams();
  const projectId = params.projectId as Id<"projects">;
  const project = useQuery(api.projects.getProject, { projectId });
  const competitors = useQuery(api.competitors.listByProject, { projectId });
  const discoverCompetitors = useAction(api.competitors.discoverCompetitors);
  const [isDiscovering, setIsDiscovering] = useState(false);

  const handleDiscover = async () => {
    if (!project) return;
    setIsDiscovering(true);
    try {
      const domain = new URL(project.url).hostname.replace("www.", "");
      await discoverCompetitors({ projectId, domain });
    } catch (e) {
      console.error("Discovery failed:", e);
    } finally {
      setIsDiscovering(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Competitors</h1>
          <p className="text-muted-foreground">
            Discover and analyze your competitors
          </p>
        </div>
        <Button onClick={handleDiscover} disabled={isDiscovering}>
          {isDiscovering ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Discovering...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Discover Competitors
            </>
          )}
        </Button>
      </div>

      {competitors === undefined ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader><div className="h-5 bg-muted rounded w-3/4" /></CardHeader>
              <CardContent><div className="h-4 bg-muted rounded w-1/2" /></CardContent>
            </Card>
          ))}
        </div>
      ) : competitors.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No competitors found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Click &quot;Discover Competitors&quot; to find domains competing for your keywords.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {competitors.map((comp) => (
            <Card key={comp._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{comp.name ?? comp.domain}</CardTitle>
                  {comp.overlapScore != null && (
                    <Badge variant="secondary">{comp.overlapScore}% overlap</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{comp.domain}</p>
                {comp.overlapScore != null && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Keyword Overlap</span>
                      <span>{comp.overlapScore}%</span>
                    </div>
                    <Progress value={comp.overlapScore} />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Discovered {new Date(comp.discoveredAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

