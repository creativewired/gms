import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import AddEstimateForm from "./AddEstimateForm";

export default async function EstimatesPage() {
  const { data: estimates, error } = await supabase
    .from("estimates")
    .select("*, customers(name), vehicles(plate_number, make, model)")
    .order("created_at", { ascending: false });

  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  const statusConfig: Record<string, { label: string; class: string }> = {
    draft:    { label: "Draft",    class: "bg-slate-100 text-slate-500 border border-slate-200" },
    sent:     { label: "Sent",     class: "bg-blue-50 text-blue-600 border border-blue-100" },
    approved: { label: "Approved", class: "bg-emerald-50 text-emerald-600 border border-emerald-100" },
    rejected: { label: "Rejected", class: "bg-red-50 text-red-500 border border-red-100" },
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <p className="section-title">Quotes</p>
        <h1 className="page-title">Estimates</h1>
      </div>

      <AddEstimateForm />

      <div className="card overflow-hidden">

        {/* Mobile card list */}
        <div className="md:hidden divide-y divide-slate-50">
          {estimates && estimates.length > 0 ? estimates.map(e => (
            <Link key={e.id} href={`/estimates/${e.id}`}
              className="flex items-start justify-between px-4 py-3.5 hover:bg-slate-50/70 transition-colors">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-slate-400">
                    #{String(e.id).padStart(4, "0")}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[e.status]?.class ?? "bg-slate-100 text-slate-500"}`}>
                    {statusConfig[e.status]?.label ?? e.status}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {e.customers?.name ?? "—"}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {e.vehicles?.plate_number}
                  {e.vehicles?.make ? ` · ${e.vehicles.make} ${e.vehicles.model}` : ""}
                </p>
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="text-sm font-semibold text-slate-800">
                  AED {Number(e.total_amount).toFixed(2)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {e.valid_until ? new Date(e.valid_until).toLocaleDateString("en-AE") : "—"}
                </p>
                <span className="text-xs text-slate-400">View →</span>
              </div>
            </Link>
          )) : (
            <p className="text-center py-12 text-slate-300 text-sm">No estimates yet.</p>
          )}
        </div>

        {/* Desktop table */}
        <table className="hidden md:table min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Estimate #</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Customer</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Vehicle</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Status</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Total</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Valid Until</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {estimates && estimates.length > 0 ? estimates.map((e, i) => (
              <tr key={e.id}
                className={`hover:bg-slate-50/70 transition-colors ${i !== 0 ? "border-t border-slate-50" : ""}`}>
                <td className="px-6 py-4 font-mono text-slate-400 text-xs">
                  #{String(e.id).padStart(4, "0")}
                </td>
                <td className="px-6 py-4 font-medium text-slate-800">{e.customers?.name ?? "—"}</td>
                <td className="px-6 py-4">
                  <span className="font-semibold text-slate-800">{e.vehicles?.plate_number}</span>
                  <span className="text-slate-400 text-xs ml-2">{e.vehicles?.make} {e.vehicles?.model}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig[e.status]?.class ?? "bg-slate-100 text-slate-500"}`}>
                    {statusConfig[e.status]?.label ?? e.status}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-slate-800">
                  AED {Number(e.total_amount).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-slate-400 text-xs">
                  {e.valid_until ? new Date(e.valid_until).toLocaleDateString("en-AE") : "—"}
                </td>
                <td className="px-6 py-4">
                  <Link href={`/estimates/${e.id}`}
                    className="text-xs text-slate-400 hover:text-slate-800 transition-colors">
                    View →
                  </Link>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-300 text-sm">
                  No estimates yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}