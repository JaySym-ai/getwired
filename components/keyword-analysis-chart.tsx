"use client";

import { Doc } from "@/convex/_generated/dataModel";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ZAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface KeywordAnalysisChartProps {
  keywords: Doc<"keywords">[];
}

const chartConfig = {
  keywords: {
    label: "Keywords",
    color: "var(--chart-1)",
  },
};

export function KeywordAnalysisChart({ keywords }: KeywordAnalysisChartProps) {
  const data = keywords
    .filter((k) => k.searchVolume != null && k.difficulty != null)
    .map((k) => ({
      keyword: k.keyword,
      volume: k.searchVolume ?? 0,
      difficulty: k.difficulty ?? 0,
      geoScore: k.geoScore ?? 50,
    }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
        Run keyword analysis to see the chart
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey="difficulty"
          name="Difficulty"
          domain={[0, 100]}
          label={{ value: "Difficulty", position: "bottom" }}
        />
        <YAxis
          type="number"
          dataKey="volume"
          name="Volume"
          label={{ value: "Search Volume", angle: -90, position: "left" }}
        />
        <ZAxis type="number" dataKey="geoScore" range={[50, 400]} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Scatter data={data} fill="var(--chart-1)" />
      </ScatterChart>
    </ChartContainer>
  );
}

