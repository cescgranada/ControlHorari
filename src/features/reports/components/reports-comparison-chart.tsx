"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/utils/time";
import type { UserReportSnapshot } from "@/types/domain";

type ReportsComparisonChartProps = {
  userSnapshots: UserReportSnapshot[];
};

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316"
];

export function ReportsComparisonChart({
  userSnapshots
}: ReportsComparisonChartProps) {
  const [chartType, setChartType] = useState<"bar" | "line">("bar");

  if (userSnapshots.length === 0) return null;

  const dateKeys = userSnapshots[0].snapshot.days.map((d) => d.dateKey);

  const chartData = dateKeys.map((dateKey) => {
    const row: Record<string, string | number> = { name: dateKey };
    for (const us of userSnapshots) {
      const day = us.snapshot.days.find((d) => d.dateKey === dateKey);
      row[us.userName] = day?.netMinutes ?? 0;
    }
    return row;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={chartType === "bar" ? "primary" : "secondary"}
          onClick={() => setChartType("bar")}
        >
          Barres
        </Button>
        <Button
          variant={chartType === "line" ? "primary" : "secondary"}
          onClick={() => setChartType("line")}
        >
          Línia
        </Button>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" ? (
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} />
              <YAxis
                tickFormatter={(value) => formatDuration(value)}
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => formatDuration(Number(value))}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.75rem",
                  padding: "0.75rem"
                }}
              />
              <Legend />
              {userSnapshots.map((us, i) => (
                <Bar
                  key={us.userId}
                  dataKey={us.userName}
                  fill={COLORS[i % COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          ) : (
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} />
              <YAxis
                tickFormatter={(value) => formatDuration(value)}
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => formatDuration(Number(value))}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.75rem",
                  padding: "0.75rem"
                }}
              />
              <Legend />
              {userSnapshots.map((us, i) => (
                <Line
                  key={us.userId}
                  type="monotone"
                  dataKey={us.userName}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
