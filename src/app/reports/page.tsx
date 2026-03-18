import { supabase } from "@/lib/supabaseClient";
import RevenueChart from "./RevenueChart";
import JobStatusChart from "./JobStatusChart";
import TopServicesChart from "./TopServicesChart";

export default async function ReportsPage() {
  const [
    { data: jobs },
    { data: jobItems },
    { data: customers },
  ] = await Promise.all([
    supabase.from("jobs").select("id, total_amount, status, created_at, mechanic_name").order("created_at"),
    supabase.from("job_items").select("description, line_total, job_id"),
    supabase.from("customers").select("id, created_at"),
  ]);

  const monthlyRevenue: Record<string, number> = {};
  const monthlyJobs: Record<string, number> = {};
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString("en-AE", { month: "short", year: "2-digit" });
    monthlyRevenue[key] = 0;
    monthlyJobs[key] = 0;
  }

  (jobs ?? []).forEach((j) => {
    const key = new Date(j.created_at).toLocaleDateString("en-AE", { month: "short", year: "2-digit" });
    if (key in monthlyRevenue) {
      monthlyRevenue[key] += Number(j.total_amount);
      monthlyJobs[key] += 1;
    }
  });

  const revenueChartData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
    month, revenue: Math.round(revenue), jobs: monthlyJobs[month],
  }));

  const pending = (jobs ?? []).filter(j => j.status === "pending").length;
  const inProgress = (jobs ?? []).filter(j => j.status === "in_progress").length;
  const completed = (jobs ?? []).filter(j => j.status === "completed").length;

  const statusData = [
    { name: "Completed", value: completed, color: "#22c55e" },
    { name: "In Progress", value: inProgress, color: "#3b82f6" },
    { name: "Pending", value: pending, color: "#f59e0b" },
  ];

  const serviceRevenue: Record<string, number> = {};
  (jobItems ?? []).forEach((item) => {
    serviceRevenue[item.description] = (serviceRevenue[item.description] ?? 0) + Number(item.line_total);
  });

  const topServices = Object.entries(serviceRevenue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, revenue]) => ({ name, revenue: Math.round(revenue) }));

  const totalRevenue = (jobs ?? []).reduce((sum, j) => sum + Number(j.total_amount), 0);
  const avgJobValue = jobs?.length ? totalRevenue / jobs.length : 0;
  const thisMonthKey = now.toLocaleDateString("en-AE", { month: "short", year: "2-digit" });
  const thisMonthRevenue = monthlyRevenue[thisMonthKey] ?? 0;
  const lastMonthKey = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toLocaleDateString("en-AE", { month: "short", year: "2-digit" });
  const lastMonthRevenue = monthlyRevenue[lastMonthKey] ?? 0;
  const revenueGrowth = lastMonthRevenue
    ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
    : 0;

  const newCustomers: Record<string, number> = {};
  Object.keys(monthlyRevenue).forEach(k => newCustomers[k] = 0);
  (customers ?? []).forEach((c) => {
    const key = new Date(c.created_at).toLocaleDateString("en-AE", { month: "short", year: "2-digit" });
    if (key in newCustomers) newCustomers[key] += 1;
  });

  const customerChartData = Object.entries(newCustomers).map(([month, count]) => ({ month, count }));

  const mechanicRevenue: Record<string, { revenue: number; jobs: number }> = {};
  (jobs ?? []).forEach((j) => {
    if (j.mechanic_name) {
      if (!mechanicRevenue[j.mechanic_name]) mechanicRevenue[j.mechanic_name] = { revenue: 0, jobs: 0 };
      mechanicRevenue[j.mechanic_name].revenue += Number(j.total_amount);
      mechanicRevenue[j.mechanic_name].jobs += 1;
    }
  });

  const mechanicData = Object.entries(mechanicRevenue)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .map(([name, data]) => ({ name, revenue: Math.round(data.revenue), jobs: data.jobs }));

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <p className="section-title">Analytics</p>
        <h1 className="page-title">Reports</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Total Revenue",
            value: `AED ${totalRevenue.toLocaleString("en-AE", { minimumFractionDigits: 0 })}`,
            sub: "All time", color: "#7c3aed",
          },
          {
            label: "This Month",
            value: `AED ${thisMonthRevenue.toLocaleString("en-AE", { minimumFractionDigits: 0 })}`,
            sub: revenueGrowth >= 0 ? `+${revenueGrowth}% vs last month` : `${revenueGrowth}% vs last month`,
            color: revenueGrowth >= 0 ? "#15803d" : "#dc2626",
          },
          {
            label: "Avg Job Value",
            value: `AED ${avgJobValue.toFixed(0)}`,
            sub: `Across ${jobs?.length ?? 0} jobs`, color: "#1d4ed8",
          },
          {
            label: "Total Jobs",
            value: String(jobs?.length ?? 0),
            sub: `${completed} completed`, color: "#b45309",
          },
        ].map((k) => (
          <div key={k.label} className="stat-card" style={{ borderTop: `3px solid ${k.color}` }}>
            <p className="label text-xs">{k.label}</p>
            <p style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1c1c1e", letterSpacing: "-0.02em", lineHeight: 1.2, marginTop: "0.375rem" }}>
              {k.value}
            </p>
            <p style={{ fontSize: "0.72rem", color: k.color, marginTop: "0.25rem", fontWeight: 500 }}>
              {k.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Revenue Chart + Status Donut */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 card p-5">
          <p className="text-sm font-semibold text-slate-800 mb-1">Revenue — Last 6 Months</p>
          <p className="text-xs text-slate-400 mb-4">Monthly revenue in AED</p>
          <RevenueChart data={revenueChartData} />
        </div>
        <div className="card p-5">
          <p className="text-sm font-semibold text-slate-800 mb-1">Job Status</p>
          <p className="text-xs text-slate-400 mb-4">Breakdown of all jobs</p>
          <JobStatusChart data={statusData} />
        </div>
      </div>

      {/* Top Services + New Customers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="text-sm font-semibold text-slate-800 mb-1">Top Services by Revenue</p>
          <p className="text-xs text-slate-400 mb-4">Highest earning job types</p>
          <TopServicesChart data={topServices} />
        </div>
        <div className="card p-5">
          <p className="text-sm font-semibold text-slate-800 mb-1">New Customers</p>
          <p className="text-xs text-slate-400 mb-4">Monthly customer acquisition</p>
          <RevenueChart
            data={customerChartData.map(d => ({ month: d.month, revenue: d.count, jobs: 0 }))}
            color="#8b5cf6"
            label="Customers"
            prefix=""
          />
        </div>
      </div>

      {/* Mechanic Performance */}
      {mechanicData.length > 0 && (
        <div>
          <p className="section-title">Mechanic Performance</p>
          <div className="card overflow-hidden">

            {/* Mobile list */}
            <div className="md:hidden divide-y divide-slate-100">
              {mechanicData.map((m, i) => {
                const share = totalRevenue ? Math.round((m.revenue / totalRevenue) * 100) : 0;
                return (
                  <div key={m.name} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: "#f2f2f7", color: "#3a3a3c" }}>
                          {m.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-800 text-sm">{m.name}</span>
                        {i === 0 && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a" }}>
                            Top
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-slate-800">
                        AED {m.revenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 ml-10">
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: "#f2f2f7" }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${share}%`, background: "#7c3aed" }} />
                      </div>
                      <span className="text-xs text-slate-400">{m.jobs} jobs · {share}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <table className="hidden md:table min-w-full">
              <thead>
                <tr>
                  <th className="table-header">Mechanic</th>
                  <th className="table-header">Jobs Done</th>
                  <th className="table-header">Revenue Generated</th>
                  <th className="table-header">Avg per Job</th>
                  <th className="table-header">Revenue Share</th>
                </tr>
              </thead>
              <tbody>
                {mechanicData.map((m, i) => {
                  const share = totalRevenue ? Math.round((m.revenue / totalRevenue) * 100) : 0;
                  return (
                    <tr key={m.name} className="hover:bg-slate-50/60 transition-colors">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ background: "#f2f2f7", color: "#3a3a3c" }}>
                            {m.name.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-800">{m.name}</span>
                          {i === 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{ background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a" }}>
                              Top
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="table-cell font-semibold text-slate-700">{m.jobs}</td>
                      <td className="table-cell font-semibold text-slate-800">
                        AED {m.revenue.toLocaleString()}
                      </td>
                      <td className="table-cell text-slate-500">
                        AED {m.jobs ? Math.round(m.revenue / m.jobs).toLocaleString() : 0}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 rounded-full" style={{ background: "#f2f2f7", maxWidth: "100px" }}>
                            <div className="h-2 rounded-full" style={{ width: `${share}%`, background: "#7c3aed" }} />
                          </div>
                          <span className="text-xs font-semibold text-slate-600">{share}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}