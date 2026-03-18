import { supabase } from "@/lib/supabaseClient";
import AddBranchForm from "./AddBranchForm";

export default async function BranchesPage() {
  const [{ data: branches }, { data: jobs }, { data: mechanics }, { data: inventory }] =
    await Promise.all([
      supabase.from("branches").select("*").order("created_at"),
      supabase.from("jobs").select("branch_id, total_amount, status"),
      supabase.from("mechanics").select("branch_id"),
      supabase.from("inventory").select("branch_id, quantity, unit_price"),
    ]);

  const stats = (branches ?? []).map(b => {
    const branchJobs      = (jobs ?? []).filter(j => j.branch_id === b.id);
    const branchMechanics = (mechanics ?? []).filter(m => m.branch_id === b.id);
    const branchInventory = (inventory ?? []).filter(i => i.branch_id === b.id);
    const revenue = branchJobs.reduce((sum, j) => sum + Number(j.total_amount), 0);
    const activeJobs = branchJobs.filter(j => j.status === "in_progress").length;
    const inventoryValue = branchInventory.reduce(
      (sum, i) => sum + Number(i.quantity) * Number(i.unit_price), 0
    );
    return { ...b, totalJobs: branchJobs.length, activeJobs, revenue, mechanics: branchMechanics.length, inventoryValue };
  });

  const totalRevenue = stats.reduce((sum, b) => sum + b.revenue, 0);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="page-header">
        <div>
          <p className="section-title">Enterprise</p>
          <h1 className="page-title">Branches</h1>
        </div>
        <AddBranchForm />
      </div>

      {/* Network Overview Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-7"
        style={{ background: "linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 100%)" }}>
        <div style={{
          position: "absolute", top: "-60px", right: "-60px",
          width: "220px", height: "220px", borderRadius: "50%",
          background: "rgba(124,58,237,0.08)", filter: "blur(40px)",
        }} />
        <div className="relative z-10">
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 }}>
            Network Overview
          </p>
          {/* 2×2 on mobile, 4 cols on sm+ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mt-4">
            {[
              { label: "Branches",         value: branches?.length ?? 0 },
              { label: "Network Revenue",  value: `AED ${totalRevenue.toLocaleString("en-AE", { minimumFractionDigits: 0 })}` },
              { label: "Total Jobs",       value: jobs?.length ?? 0 },
              { label: "Total Mechanics",  value: mechanics?.length ?? 0 },
            ].map(s => (
              <div key={s.label}>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {s.label}
                </p>
                <p style={{ color: "white", fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-0.03em", marginTop: "0.25rem", lineHeight: 1.1 }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Branch Cards */}
      <div>
        <p className="section-title mb-3">All Locations</p>
        <div className="grid grid-cols-1 gap-4">
          {stats.map((b, i) => {
            const hue = `hsl(${(i * 60 + 240) % 360}, 60%, 45%)`;
            const revenueShare = totalRevenue ? Math.round((b.revenue / totalRevenue) * 100) : 0;

            return (
              <div key={b.id} className="card p-5">

                {/* Header: avatar + name/address + revenue */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-base font-bold text-white shrink-0"
                      style={{ background: hue }}>
                      {b.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{b.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          b.is_active
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : "bg-slate-100 text-slate-400 border border-slate-200"
                        }`}>
                          {b.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      {b.address && <p className="text-xs text-slate-400 mt-0.5 truncate">{b.address}</p>}
                      {b.phone  && <p className="text-xs text-slate-400">{b.phone}</p>}
                    </div>
                  </div>
                  {/* Revenue — right aligned */}
                  <div className="text-right shrink-0">
                    <p className="label text-xs">Revenue</p>
                    <p className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                      AED {b.revenue.toLocaleString("en-AE", { minimumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>

                {/* Stats row: 2×2 on mobile, 4 cols on sm+ */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4"
                  style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                  {[
                    { label: "Total Jobs",       value: b.totalJobs },
                    { label: "Active Now",        value: b.activeJobs },
                    { label: "Mechanics",         value: b.mechanics },
                    { label: "Inventory Value",   value: `AED ${b.inventoryValue.toFixed(0)}` },
                  ].map(s => (
                    <div key={s.label}>
                      <p className="label text-xs">{s.label}</p>
                      <p className="text-base sm:text-lg font-bold text-slate-800 leading-tight">{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Revenue share bar */}
                <div className="mt-4">
                  <div className="flex justify-between mb-1.5">
                    <p style={{ fontSize: "0.65rem", color: "#8e8e93", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Revenue Share
                    </p>
                    <p style={{ fontSize: "0.65rem", color: "#8e8e93" }}>{revenueShare}%</p>
                  </div>
                  <div style={{ height: "4px", background: "#f2f2f7", borderRadius: "999px" }}>
                    <div style={{
                      width: `${revenueShare}%`, height: "4px",
                      borderRadius: "999px", background: hue,
                      transition: "width 0.6s ease",
                    }} />
                  </div>
                </div>
              </div>
            );
          })}

          {stats.length === 0 && (
            <div className="card p-12 text-center text-slate-300 text-sm">
              No branches yet. Add your first location.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}