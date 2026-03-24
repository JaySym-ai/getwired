"use client";

import { Doc } from "@/convex/_generated/dataModel";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface CompetitorOverlapChartProps {
  competitors: Doc<"competitors">[];
}

const chartConfig = {
  overlapScore: {
    label: "Overlap %",
    color: "var(--chart-1)",
  },
};

export function CompetitorOverlapChart({
  competitors,
}: CompetitorOverlapChartProps) {
  const data = competitors
    .filter((c) => c.overlapScore != null)
    .map((c) => ({
      name: c.name ?? c.domain,
      overlapScore: c.overlapScore ?? 0,
    }))
    .sort((a, b) => b.overlapScore - a.overlapScore);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
        No competitor data available
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} />
        <YAxis type="category" dataKey="name" width={75} tick={{ fontSize: 12 }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="overlapScore" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

