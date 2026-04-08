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

type ReportDaySummary = {
  dateKey: string;
  workedMinutes: number;
  breakMinutes: number;
  netMinutes: number;
};

type ReportsChartProps = {
  data: ReportDaySummary[];
};

export function ReportsChart({ data }: ReportsChartProps) {
  const [chartType, setChartType] = useState<"bar" | "line">("bar");

  const chartData = data.map((day) => ({
    name: day.dateKey,
    "Temps brut": day.workedMinutes,
    Pauses: day.breakMinutes,
    "Temps net": day.netMinutes
  }));

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
              <Bar dataKey="Temps brut" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pauses" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Temps net" fill="#3b82f6" radius={[4, 4, 0, 0]} />
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
              <Line
                type="monotone"
                dataKey="Temps brut"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="Pauses"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="Temps net"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
