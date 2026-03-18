import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import AddVehicleForm from "./AddVehicleForm";

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const { branch } = await searchParams;
  const branchId = branch ? Number(branch) : null;

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*, customers(name)")
    .order("created_at", { ascending: false });

  const { data: customers } = await supabase
    .from("customers")
    .select("id, name")
    .order("name");

  const makes = [...new Set((vehicles ?? []).map((v) => v.make).filter(Boolean))];
  const thisMonth = (vehicles ?? []).filter(
    (v) => new Date(v.created_at) > new Date(new Date().setDate(1))
  ).length;

  const colorMap: Record<string, string> = {
    white: "#f8fafc", black: "#1c1c1e", silver: "#c0c0c0",
    red: "#ef4444", blue: "#3b82f6", grey: "#6b7280", gray: "#6b7280",
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="page-header">
        <div>
          <p className="section-title">Fleet</p>
          <h1 className="page-title">Vehicles</h1>
        </div>
        <AddVehicleForm customers={customers ?? []} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Vehicles", value: vehicles?.length ?? 0, color: "#1d4ed8", border: "#bfdbfe" },
          { label: "Added This Month", value: thisMonth, color: "#15803d", border: "#bbf7d0" },
          { label: "Unique Makes", value: makes.length, color: "#7c3aed", border: "#ddd6fe" },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.border}` }}>
            <p className="label text-xs">{s.label}</p>
            <p style={{
              fontSize: "1.5rem", fontWeight: 700,
              color: s.color, letterSpacing: "-0.03em",
              lineHeight: 1.1, marginTop: "0.375rem",
            }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", background: "#fafafa" }}>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">All Vehicles</p>
          <p className="text-xs text-slate-400">{vehicles?.length ?? 0} total</p>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden divide-y divide-slate-100">
          {vehicles && vehicles.length > 0 ? vehicles.map((v) => (
            <Link key={v.id} href={`/vehicles/${v.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
              <div className="min-w-0">
                <p className="font-mono font-bold text-slate-900 tracking-wider text-sm">
                  {v.plate_number}
                </p>
                <p className="text-sm text-slate-600 mt-0.5">
                  {v.make ?? "—"} {v.model ?? ""} {v.year ? `· ${v.year}` : ""}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{v.customers?.name ?? "—"}</p>
              </div>
              <div className="text-right shrink-0 ml-3">
                {v.color && (
                  <div className="flex items-center justify-end gap-1.5 mb-1">
                    <div className="w-3 h-3 rounded-full border border-slate-200"
                      style={{ background: colorMap[v.color.toLowerCase()] ?? "#e2e8f0" }} />
                    <span className="text-xs text-slate-500">{v.color}</span>
                  </div>
                )}
                <p className="text-xs text-slate-400">
                  {v.mileage ? `${v.mileage.toLocaleString()} km` : "—"}
                </p>
              </div>
            </Link>
          )) : (
            <div className="flex flex-col items-center gap-2 py-12">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#f2f2f7" }}>
                <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h1l2-4h10l2 4h1a2 2 0 012 2v6a2 2 0 01-2 2h-2" />
                  <circle cx="7.5" cy="17.5" r="2.5" /><circle cx="16.5" cy="17.5" r="2.5" />
                </svg>
              </div>
              <p className="text-slate-300 text-sm">No vehicles yet.</p>
            </div>
          )}
        </div>

        {/* Desktop table */}
        <table className="hidden md:table min-w-full">
          <thead>
            <tr>
              <th className="table-header">Plate</th>
              <th className="table-header">Make & Model</th>
              <th className="table-header">Year</th>
              <th className="table-header">Color</th>
              <th className="table-header">Owner</th>
              <th className="table-header">Mileage</th>
              <th className="table-header">Added</th>
              <th className="table-header"></th>
            </tr>
          </thead>
          <tbody>
            {vehicles && vehicles.length > 0 ? vehicles.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="table-cell">
                  <span className="font-mono font-bold text-slate-900 tracking-wider">{v.plate_number}</span>
                </td>
                <td className="table-cell">
                  <p className="font-semibold text-slate-800">{v.make ?? "—"} {v.model ?? ""}</p>
                  {v.vin && (
                    <p className="text-xs font-mono text-slate-400 mt-0.5 tracking-wider">{v.vin.slice(0, 8)}...</p>
                  )}
                </td>
                <td className="table-cell text-slate-500">{v.year ?? "—"}</td>
                <td className="table-cell">
                  {v.color ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full border border-slate-200"
                        style={{ background: colorMap[v.color.toLowerCase()] ?? "#e2e8f0" }} />
                      <span className="text-slate-500 text-sm">{v.color}</span>
                    </div>
                  ) : "—"}
                </td>
                <td className="table-cell text-slate-600">{v.customers?.name ?? "—"}</td>
                <td className="table-cell text-slate-500 text-sm">
                  {v.mileage ? `${v.mileage.toLocaleString()} km` : "—"}
                </td>
                <td className="table-cell text-slate-400 text-xs">
                  {new Date(v.created_at).toLocaleDateString("en-AE", { month: "short", day: "numeric", year: "numeric" })}
                </td>
                <td className="table-cell">
                  <Link href={`/vehicles/${v.id}`}
                    className="text-xs font-medium text-slate-400 hover:text-slate-900 transition-colors">
                    View →
                  </Link>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={8} className="table-cell text-center py-16">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#f2f2f7" }}>
                      <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h1l2-4h10l2 4h1a2 2 0 012 2v6a2 2 0 01-2 2h-2" />
                        <circle cx="7.5" cy="17.5" r="2.5" /><circle cx="16.5" cy="17.5" r="2.5" />
                      </svg>
                    </div>
                    <p className="text-slate-300 text-sm">No vehicles yet.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}