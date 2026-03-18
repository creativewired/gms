"use client";

import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

type Props = {
  data: { month: string; revenue: number; jobs: number }[];
  color?: string;
  label?: string;
  prefix?: string;
};

export default function RevenueChart({
  data,
  color = "#7c3aed",
  label = "Revenue",
  prefix = "AED",
}: Props) {
  const gradientId = `grad${color.replace("#", "")}`;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 10, fill: "#8e8e93" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#8e8e93" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
          width={35}
        />
        <Tooltip
          contentStyle={{
            background: "rgba(28,28,30,0.92)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "0.875rem",
            padding: "0.75rem 1rem",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          }}
          labelStyle={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem", marginBottom: "4px" }}
          itemStyle={{ color: "white", fontWeight: 700 }}
          formatter={(value) => [
            `${prefix ? "AED " : ""}${Number(value ?? 0).toLocaleString()}`,
            label,
          ]}
          cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "4 4" }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke={color}
          strokeWidth={2.5}
          fill={`url(#${gradientId})`}
          dot={{ fill: color, strokeWidth: 2, r: 3, stroke: "white" }}
          activeDot={{ r: 5, fill: color, stroke: "white", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}