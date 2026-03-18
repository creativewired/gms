import { supabase } from "@/lib/supabaseClient";
import AddMechanicForm from "./AddMechanicForm";

export default async function MechanicsPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const { branch } = await searchParams;
  const branchId = branch ? Number(branch) : null;

  let mechanicsQuery = supabase.from("mechanics").select("*").order("name");
  if (branchId) mechanicsQuery = mechanicsQuery.eq("branch_id", branchId);
  const { data: mechanics } = await mechanicsQuery;

  const { data: jobs } = await supabase
    .from("jobs")
    .select("mechanic_name, status, total_amount")
    .not("mechanic_name", "is", null);

  const workload: Record<string, { active: number; completed: number; revenue: number }> = {};
  (jobs ?? []).forEach((j) => {
    if (j.mechanic_name) {
      if (!workload[j.mechanic_name])
        workload[j.mechanic_name] = { active: 0, completed: 0, revenue: 0 };
      if (j.status === "completed") {
        workload[j.mechanic_name].completed++;
        workload[j.mechanic_name].revenue += Number(j.total_amount);
      } else {
        workload[j.mechanic_name].active++;
      }
    }
  });

  const COLORS = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ef4444","#06b6d4"];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="page-header">
        <div>
          <p className="section-title">Team</p>
          <h1 className="page-title">Mechanics</h1>
        </div>
        <AddMechanicForm />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Mechanics", value: mechanics?.length ?? 0, color: "#1d4ed8", border: "#bfdbfe" },
          {
            label: "Currently Active",
            value: Object.values(workload).reduce((sum, w) => sum + (w.active > 0 ? 1 : 0), 0),
            color: "#15803d", border: "#bbf7d0",
          },
          {
            label: "Jobs Completed",
            value: Object.values(workload).reduce((sum, w) => sum + w.completed, 0),
            color: "#7c3aed", border: "#ddd6fe",
          },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.border}` }}>
            <p className="label text-xs">{s.label}</p>
            <p style={{
              fontSize: "1.4rem", fontWeight: 700,
              color: s.color, letterSpacing: "-0.03em",
              lineHeight: 1.1, marginTop: "0.375rem",
            }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Mechanic Cards */}
      {(mechanics ?? []).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(mechanics ?? []).map((m, i) => {
            const w = workload[m.name] ?? { active: 0, completed: 0, revenue: 0 };
            const color = COLORS[i % COLORS.length];
            return (
              <div key={m.id} className="card p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-base font-bold text-white shrink-0"
                    style={{ background: color }}>
                    {m.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{m.name}</p>
                    <p className="text-xs text-slate-400 truncate">{m.phone ?? "No phone"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-3"
                  style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                  {[
                    { label: "Active", value: w.active, valueColor: "#1d4ed8" },
                    { label: "Done", value: w.completed, valueColor: "#15803d" },
                    { label: "Revenue", value: `${(w.revenue / 1000).toFixed(0)}k`, valueColor: "#7c3aed" },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <p style={{ fontSize: "1.1rem", fontWeight: 700, color: s.valueColor, lineHeight: 1 }}>
                        {s.value}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", background: "#fafafa" }}>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {branchId ? "Filtered by Branch" : "All Branches"}
          </p>
          <p className="text-xs text-slate-400">{mechanics?.length ?? 0} members</p>
        </div>

        {/* Mobile list */}
        <div className="md:hidden divide-y divide-slate-100">
          {mechanics && mechanics.length > 0 ? mechanics.map((m, i) => {
            const w = workload[m.name] ?? { active: 0, completed: 0, revenue: 0 };
            return (
              <div key={m.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: COLORS[i % COLORS.length] }}>
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{m.name}</p>
                    <p className="text-xs text-slate-400">{m.phone ?? "—"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800">
                    AED {w.revenue.toLocaleString("en-AE", { minimumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-slate-400">{w.active} active · {w.completed} done</p>
                </div>
              </div>
            );
          }) : (
            <p className="text-center py-10 text-slate-300 text-sm">No mechanics added yet.</p>
          )}
        </div>

        {/* Desktop table */}
        <table className="hidden md:table min-w-full">
          <thead>
            <tr>
              <th className="table-header">Name</th>
              <th className="table-header">Phone</th>
              <th className="table-header">Active Jobs</th>
              <th className="table-header">Completed Jobs</th>
              <th className="table-header">Revenue Generated</th>
            </tr>
          </thead>
          <tbody>
            {mechanics && mechanics.length > 0 ? mechanics.map((m) => {
              const w = workload[m.name] ?? { active: 0, completed: 0, revenue: 0 };
              return (
                <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                        style={{ background: "#3b82f6" }}>
                        {m.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-slate-900">{m.name}</span>
                    </div>
                  </td>
                  <td className="table-cell text-slate-500">{m.phone ?? "—"}</td>
                  <td className="table-cell">
                    <span className="badge-progress">{w.active} jobs</span>
                  </td>
                  <td className="table-cell">
                    <span className="badge-completed">{w.completed} jobs</span>
                  </td>
                  <td className="table-cell font-semibold text-slate-800">
                    AED {w.revenue.toLocaleString("en-AE", { minimumFractionDigits: 0 })}
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={5} className="table-cell text-center py-16">
                  <p className="text-slate-300 text-sm">No mechanics added yet.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}