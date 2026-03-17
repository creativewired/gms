"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

type Props = {
  data: { name: string; value: number; color: string }[];
};

export default function JobStatusChart({ data }: Props) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div>
      <div style={{ position: "relative" }}>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "rgba(28,28,30,0.92)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "0.875rem",
                padding: "0.75rem 1rem",
              }}
              labelStyle={{ color: "white", fontWeight: 700 }}
              itemStyle={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem" }}
              formatter={(value) => [`${value} jobs`, ""]}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          pointerEvents: "none",
        }}>
          <p style={{
            fontSize: "1.75rem", fontWeight: 700,
            color: "#1c1c1e", letterSpacing: "-0.03em", lineHeight: 1,
          }}>
            {total}
          </p>
          <p style={{ fontSize: "0.7rem", color: "#8e8e93", marginTop: "2px" }}>total</p>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2 mt-3">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
              <span className="text-xs text-slate-600">{d.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-800">{d.value}</span>
              <span className="text-xs text-slate-400">
                {total ? Math.round((d.value / total) * 100) : 0}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
