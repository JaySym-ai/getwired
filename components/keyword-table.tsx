"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react";

function TrendIcon({ direction }: { direction?: string }) {
  if (direction === "rising") return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (direction === "declining") return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

export function KeywordTable({ keywords }: { keywords: Doc<"keywords">[] }) {
  const toggleTracked = useMutation(api.keywords.toggleTracked);
  const deleteKeyword = useMutation(api.keywords.deleteKeyword);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Keyword</TableHead>
            <TableHead>Source</TableHead>
            <TableHead className="text-right">Volume</TableHead>
            <TableHead className="text-right">Difficulty</TableHead>
            <TableHead>Trend</TableHead>
            <TableHead className="text-right">SEO Rank</TableHead>
            <TableHead className="text-right">GEO Score</TableHead>
            <TableHead>Tracked</TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {keywords.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                No keywords found. Scan your website or add keywords manually.
              </TableCell>
            </TableRow>
          ) : (
            keywords.map((kw) => (
              <TableRow key={kw._id}>
                <TableCell className="font-medium">{kw.keyword}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {kw.source}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {kw.searchVolume?.toLocaleString() ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {kw.difficulty != null ? `${kw.difficulty}/100` : "—"}
                </TableCell>
                <TableCell>
                  <TrendIcon direction={kw.trendDirection} />
                </TableCell>
                <TableCell className="text-right">
                  {kw.seoRank ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {kw.geoScore != null ? `${kw.geoScore}/100` : "—"}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={kw.tracked ?? false}
                    onCheckedChange={() => toggleTracked({ keywordId: kw._id })}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteKeyword({ keywordId: kw._id })}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

