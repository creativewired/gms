"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type Props = {
  data: { name: string; revenue: number }[];
};

const COLORS = ["#7c3aed", "#6d28d9", "#5b21b6", "#4c1d95", "#4338ca", "#3730a3"];

export default function TopServicesChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-slate-300 text-sm">No service data yet.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
        barSize={12}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 10, fill: "#8e8e93" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 10, fill: "#8e8e93" }}
          axisLine={false}
          tickLine={false}
          width={100}
          tickFormatter={(v) => v.length > 14 ? v.slice(0, 14) + "…" : v}
        />
        <Tooltip
          contentStyle={{
            background: "rgba(28,28,30,0.92)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "0.875rem",
            padding: "0.75rem 1rem",
          }}
          labelStyle={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem" }}
          itemStyle={{ color: "white", fontWeight: 700 }}
formatter={(value) => [`AED ${Number(value).toLocaleString()}`, "Revenue"]}
          cursor={{ fill: "rgba(0,0,0,0.03)" }}
        />
        <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
