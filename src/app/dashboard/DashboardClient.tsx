"use client";

import Link from "next/link";

type Props = {
  stats: {
    monthRevenue: number;
    lastMonthRevenue: number;
    weekRevenue: number;
    revenueGrowth: number;
    totalJobs: number;
    monthJobs: number;
    pendingJobs: number;
    inProgressJobs: number;
    completedJobs: number;
    totalCustomers: number;
    totalVehicles: number;
    lowStockCount: number;
    activeStaff: number;
  };
  monthlyData: { month: string; revenue: number; jobs: number }[];
  statusData: { label: string; value: number; color: string; bg: string }[];
  topMechanics: [string, { jobs: number; revenue: number }][];
  recentJobs: any[];
  upcomingAppointments: any[];
  lowStockItems: any[];
  activeStaff: any[];
};

const MECHANIC_COLORS = ["#3b82f6","#8b5cf6","#f59e0b","#10b981","#ef4444"];

export default function DashboardClient({
  stats, monthlyData, statusData,
  topMechanics, recentJobs,
  upcomingAppointments, lowStockItems, activeStaff,
}: Props) {
  const maxRevenue = Math.max(...monthlyData.map(m => m.revenue), 1);
  const totalStatusJobs = statusData.reduce((s, d) => s + d.value, 0) || 1;

  const statusBadge = (status: string) => {
    if (status === "pending")     return <span className="badge-pending">Pending</span>;
    if (status === "in_progress") return <span className="badge-progress">In Progress</span>;
    if (status === "completed")   return <span className="badge-completed">Completed</span>;
    return <span className="badge-draft">{status}</span>;
  };

  return (
    <div className="space-y-4 max-w-7xl">

      {/* Page header */}
      <div>
        <p className="section-title">Overview</p>
        <h1 className="page-title">Dashboard</h1>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "This Month",
            value: `AED ${stats.monthRevenue.toLocaleString("en-AE", { minimumFractionDigits: 0 })}`,
            sub: stats.revenueGrowth !== 0
              ? `${stats.revenueGrowth > 0 ? "+" : ""}${stats.revenueGrowth}% vs last month`
              : "Same as last month",
            color: "#7c3aed", border: "#ddd6fe",
            trend: stats.revenueGrowth > 0 ? "up" : stats.revenueGrowth < 0 ? "down" : "stable",
            href: "/reports",
          },
          {
            label: "This Week",
            value: `AED ${stats.weekRevenue.toLocaleString("en-AE", { minimumFractionDigits: 0 })}`,
            sub: `${stats.monthJobs} jobs this month`,
            color: "#1d4ed8", border: "#bfdbfe",
            trend: "stable",
            href: "/jobs",
          },
          {
            label: "Pending Jobs",
            value: stats.pendingJobs,
            sub: `${stats.inProgressJobs} in progress`,
            color: "#b45309", border: "#fde68a",
            trend: stats.pendingJobs > 5 ? "down" : "up",
            href: "/kanban",
          },
          {
            label: "Customers",
            value: stats.totalCustomers,
            sub: `${stats.totalVehicles} vehicles`,
            color: "#15803d", border: "#bbf7d0",
            trend: "up",
            href: "/customers",
          },
        ].map(kpi => (
          <Link key={kpi.label} href={kpi.href}
            className="stat-card block transition-all hover:shadow-md"
            style={{ borderTop: `3px solid ${kpi.border}` }}>
            <p className="label text-xs truncate">{kpi.label}</p>
            <p style={{
              fontSize: "1.15rem", fontWeight: 700,
              color: kpi.color, letterSpacing: "-0.02em",
              lineHeight: 1.1, marginTop: "0.3rem",
            }}>
              {kpi.value}
            </p>
            <div className="flex items-center gap-1 mt-1.5">
              {kpi.trend === "up" && (
                <svg className="w-3 h-3 text-emerald-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                </svg>
              )}
              {kpi.trend === "down" && (
                <svg className="w-3 h-3 text-red-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                </svg>
              )}
              <p className="text-xs text-slate-400 truncate">{kpi.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Row 2: Revenue Chart + Status Breakdown ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Revenue Bar Chart */}
        <div className="md:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Revenue Trend</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">Last 6 Months</p>
            </div>
            <Link href="/reports" className="text-xs text-slate-400 hover:text-slate-700 transition-colors shrink-0 ml-3">
              Full Report →
            </Link>
          </div>
          <div className="flex items-end gap-1.5 h-28">
            {monthlyData.map((m, i) => {
              const height = maxRevenue > 0 ? Math.max((m.revenue / maxRevenue) * 100, 2) : 2;
              const isLast = i === monthlyData.length - 1;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <p className="text-xs font-bold text-slate-500 truncate w-full text-center" style={{ fontSize: "10px" }}>
                    {m.revenue > 0 ? `${Math.round(m.revenue / 1000)}k` : ""}
                  </p>
                  <div className="w-full rounded-xl transition-all relative group"
                    style={{
                      height: `${height}%`,
                      background: isLast
                        ? "linear-gradient(180deg, #7c3aed, #a78bfa)"
                        : "linear-gradient(180deg, #e2e8f0, #f1f5f9)",
                      minHeight: "6px",
                    }}>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                      <div className="bg-slate-800 text-white rounded-xl px-3 py-2 text-xs whitespace-nowrap shadow-lg">
                        <p className="font-bold">AED {m.revenue.toLocaleString()}</p>
                        <p className="text-slate-300">{m.jobs} jobs</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-400 truncate w-full text-center" style={{ fontSize: "10px" }}>{m.month}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="card p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Job Status</p>
          <p className="text-sm font-bold text-slate-800 mb-4">Breakdown</p>
          <div className="flex rounded-xl overflow-hidden h-3 mb-4 gap-0.5">
            {statusData.filter(s => s.value > 0).map(s => (
              <div key={s.label}
                style={{ width: `${(s.value / totalStatusJobs) * 100}%`, background: s.color }} />
            ))}
          </div>
          <div className="space-y-3">
            {statusData.map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                  <p className="text-sm text-slate-600">{s.label}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-800">{s.value}</p>
                  <p className="text-xs text-slate-400">
                    {Math.round((s.value / totalStatusJobs) * 100)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
            <div className="flex justify-between">
              <p className="text-xs text-slate-400">Total Jobs</p>
              <p className="text-sm font-bold text-slate-800">{stats.totalJobs}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: Recent Jobs + Sidebar ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Recent Jobs */}
        <div className="md:col-span-2 card overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between"
            style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", background: "#fafafa" }}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Jobs</p>
            <Link href="/jobs" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">
              View All →
            </Link>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-slate-50">
            {recentJobs.map(j => (
              <Link key={j.id} href={`/jobs/${j.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/60 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{j.vehicles?.plate_number ?? "—"}</p>
                  <p className="text-xs text-slate-400">{j.vehicles?.make} {j.vehicles?.model}</p>
                  <div className="mt-1">{statusBadge(j.status)}</div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-bold text-slate-800">
                    AED {Number(j.total_amount).toLocaleString("en-AE", { minimumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(j.created_at).toLocaleDateString("en-AE", { month: "short", day: "numeric" })}
                  </p>
                </div>
              </Link>
            ))}
            {recentJobs.length === 0 && (
              <p className="text-center py-8 text-slate-300 text-sm">No jobs yet.</p>
            )}
          </div>

          {/* Desktop table */}
          <table className="hidden md:table min-w-full">
            <tbody>
              {recentJobs.map(j => (
                <tr key={j.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="table-cell">
                    <span className="font-mono text-xs text-slate-400">#{String(j.id).padStart(4, "0")}</span>
                  </td>
                  <td className="table-cell">
                    <p className="text-sm font-semibold text-slate-800">{j.vehicles?.plate_number ?? "—"}</p>
                    <p className="text-xs text-slate-400">{j.vehicles?.make} {j.vehicles?.model}</p>
                  </td>
                  <td className="table-cell">{statusBadge(j.status)}</td>
                  <td className="table-cell text-sm font-bold text-slate-800">
                    AED {Number(j.total_amount).toLocaleString("en-AE", { minimumFractionDigits: 0 })}
                  </td>
                  <td className="table-cell text-xs text-slate-400">
                    {new Date(j.created_at).toLocaleDateString("en-AE", { month: "short", day: "numeric" })}
                  </td>
                  <td className="table-cell">
                    <Link href={`/jobs/${j.id}`} className="text-xs text-slate-400 hover:text-slate-900 transition-colors">→</Link>
                  </td>
                </tr>
              ))}
              {recentJobs.length === 0 && (
                <tr>
                  <td colSpan={6} className="table-cell text-center py-10 text-slate-300 text-sm">No jobs yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Right sidebar — stacks below on mobile */}
        <div className="space-y-4">

          {/* Upcoming Appointments */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-800">Upcoming</p>
              <Link href="/appointments" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">
                View All →
              </Link>
            </div>
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-2">
                {upcomingAppointments.map(a => (
                  <div key={a.id} className="flex items-start gap-3 p-2.5 rounded-xl"
                    style={{ background: "#f8fafc" }}>
                    <div className="w-8 h-8 rounded-xl flex flex-col items-center justify-center shrink-0"
                      style={{ background: "#eff6ff" }}>
                      <p className="text-xs font-bold text-blue-600 leading-none">
                        {new Date(a.appointment_date + "T00:00:00").getDate()}
                      </p>
                      <p className="text-xs text-blue-400 leading-none">
                        {new Date(a.appointment_date + "T00:00:00").toLocaleDateString("en-AE", { month: "short" })}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">{a.title}</p>
                      <p className="text-xs text-slate-400">{a.appointment_time ?? ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-300 text-center py-4">No upcoming appointments</p>
            )}
          </div>

          {/* Low Stock Alerts */}
          {lowStockItems.length > 0 && (
            <div className="card p-5" style={{ border: "1px solid #fecaca" }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "#fff1f0" }}>
                  <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-red-600">Low Stock</p>
                <Link href="/inventory" className="ml-auto text-xs text-slate-400 hover:text-slate-700">View →</Link>
              </div>
              <div className="space-y-2">
                {lowStockItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between">
                    <p className="text-xs text-slate-600 truncate max-w-[70%]">{item.part_name}</p>
                    <span className="text-xs font-bold text-red-500">{item.quantity} left</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Mechanics */}
          {topMechanics.length > 0 && (
            <div className="card p-5">
              <p className="text-sm font-semibold text-slate-800 mb-4">Top Mechanics</p>
              <div className="space-y-3">
                {topMechanics.map(([name, data], i) => {
                  const maxRev = topMechanics[0][1].revenue || 1;
                  return (
                    <div key={name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ background: MECHANIC_COLORS[i % MECHANIC_COLORS.length] }}>
                            {name.charAt(0)}
                          </div>
                          <p className="text-xs font-medium text-slate-700 truncate">{name}</p>
                        </div>
                        <p className="text-xs font-bold text-slate-800 shrink-0 ml-2">
                          AED {data.revenue.toLocaleString("en-AE", { minimumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div className="w-full rounded-full h-1.5" style={{ background: "#f1f5f9" }}>
                        <div className="h-1.5 rounded-full transition-all"
                          style={{
                            width: `${(data.revenue / maxRev) * 100}%`,
                            background: MECHANIC_COLORS[i % MECHANIC_COLORS.length],
                          }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {[
          { label: "New Job",      href: "/jobs",        icon: "🔧", color: "#1d4ed8", bg: "#eff6ff" },
          { label: "Add Customer", href: "/customers",   icon: "👤", color: "#7c3aed", bg: "#f5f3ff" },
          { label: "Job Board",    href: "/kanban",      icon: "📋", color: "#b45309", bg: "#fffbeb" },
          { label: "AI Insights",  href: "/ai-insights", icon: "🤖", color: "#0891b2", bg: "#ecfeff" },
          { label: "Inventory",    href: "/inventory",   icon: "📦", color: "#15803d", bg: "#f0fdf4" },
        ].map(a => (
          <Link key={a.label} href={a.href}
            className="card p-3 flex flex-col items-center gap-2 text-center transition-all hover:shadow-md">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg"
              style={{ background: a.bg }}>
              {a.icon}
            </div>
            <p className="text-xs font-semibold text-slate-700 leading-tight">{a.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}