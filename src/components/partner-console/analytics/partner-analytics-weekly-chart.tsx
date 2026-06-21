"use client";

import * as React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  prepareWeeklyTrendChartData,
  type WeeklyTrendChartPoint,
} from "@/lib/analytics-chart-data";
import type { AnalyticsDateRange } from "@/lib/analytics-date-range";
import type { WeeklyTrendPoint } from "@/lib/partner-analytics";

const chartConfig = {
  starts: {
    label: "Course starts",
    color: "var(--chart-1)",
  },
  completions: {
    label: "Completions",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function PartnerAnalyticsWeeklyChart({
  trends,
  rangeLabel,
  range,
}: {
  trends: WeeklyTrendPoint[];
  rangeLabel: string;
  range: AnalyticsDateRange;
}) {
  const chartData = React.useMemo(
    () => prepareWeeklyTrendChartData(trends, range),
    [trends, range]
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Weekly trends</CardTitle>
        <CardDescription>
          Course starts and completions by week ({rangeLabel}).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {trends.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity in this period.</p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[240px] w-full"
            aria-label="Weekly course starts and completions"
          >
            <LineChart
              data={chartData}
              margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={32}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const row = payload?.[0]?.payload as
                        | WeeklyTrendChartPoint
                        | undefined;
                      return row
                        ? `Week of ${formatWeekOf(row.weekStart)}`
                        : "";
                    }}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                dataKey="starts"
                type="monotone"
                stroke="var(--color-starts)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                dataKey="completions"
                type="monotone"
                stroke="var(--color-completions)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

function formatWeekOf(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
