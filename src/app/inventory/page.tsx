import { supabase } from "@/lib/supabaseClient";
import AddInventoryForm from "./AddInventoryForm";
import DeletePartButton from "./DeletePartButton";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const { branch } = await searchParams;
  const branchId = branch ? Number(branch) : null;

  let query = supabase.from("inventory").select("*").order("part_name");
  if (branchId) query = query.eq("branch_id", branchId);

  const { data: parts } = await query;

  const lowStock = parts?.filter(p => p.quantity <= p.low_stock_level) ?? [];
  const totalValue = parts?.reduce((sum, p) => sum + Number(p.quantity) * Number(p.unit_price), 0) ?? 0;
  const totalParts = parts?.length ?? 0;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="page-header">
        <div>
          <p className="section-title">Stock</p>
          <h1 className="page-title">Inventory</h1>
        </div>
        <AddInventoryForm />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Parts", value: totalParts, color: "#1d4ed8", border: "#bfdbfe" },
          {
            label: "Low Stock",
            value: lowStock.length,
            color: lowStock.length > 0 ? "#dc2626" : "#15803d",
            border: lowStock.length > 0 ? "#fecaca" : "#bbf7d0",
          },
          {
            label: "Total Value",
            value: `AED ${totalValue.toLocaleString("en-AE", { minimumFractionDigits: 0 })}`,
            color: "#7c3aed", border: "#ddd6fe",
          },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.border}` }}>
            <p className="label text-xs">{s.label}</p>
            <p style={{ fontSize: "1.4rem", fontWeight: 700, color: s.color, letterSpacing: "-0.03em", lineHeight: 1.1, marginTop: "0.375rem" }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: "#fff1f0", border: "1px solid #fecaca" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#dc2626" }}>
            ⚠ Low Stock — {lowStock.length} item{lowStock.length !== 1 ? "s" : ""} need restocking
          </p>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(p => (
              <span key={p.id} className="px-3 py-1 rounded-full text-xs font-medium"
                style={{ background: "white", border: "1px solid #fecaca", color: "#dc2626" }}>
                {p.part_name} — {p.quantity} left
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", background: "#fafafa" }}>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {branchId ? "Filtered by Branch" : "All Branches"}
          </p>
          <p className="text-xs text-slate-400">{totalParts} items</p>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden divide-y divide-slate-50">
          {parts && parts.length > 0 ? parts.map(p => {
            const isLow = p.quantity <= p.low_stock_level;
            return (
              <div key={p.id} className="px-4 py-3">
                <div className="flex items-start justify-between mb-1.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{p.part_name}</p>
                    {p.sku && <p className="text-xs font-mono text-slate-400">{p.sku}</p>}
                  </div>
                  <DeletePartButton partId={p.id} />
                </div>
                <div className="flex items-center gap-3 flex-wrap mt-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    isLow ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                  }`}>
                    {isLow && <span className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                    {p.quantity} units
                  </span>
                  <span className="text-xs text-slate-500">
                    AED {Number(p.unit_price).toFixed(2)} / unit
                  </span>
                  <span className="text-xs font-semibold text-slate-800">
                    = AED {(Number(p.quantity) * Number(p.unit_price)).toFixed(2)}
                  </span>
                </div>
              </div>
            );
          }) : (
            <p className="text-center py-12 text-slate-300 text-sm">No parts added yet.</p>
          )}
        </div>

        {/* Desktop table */}
        <table className="hidden md:table min-w-full">
          <thead>
            <tr>
              <th className="table-header">Part Name</th>
              <th className="table-header">SKU</th>
              <th className="table-header">Quantity</th>
              <th className="table-header">Unit Price</th>
              <th className="table-header">Total Value</th>
              <th className="table-header">Low Stock At</th>
              <th className="table-header"></th>
            </tr>
          </thead>
          <tbody>
            {parts && parts.length > 0 ? parts.map(p => {
              const isLow = p.quantity <= p.low_stock_level;
              return (
                <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="table-cell font-semibold text-slate-900">{p.part_name}</td>
                  <td className="table-cell font-mono text-slate-400 text-xs">{p.sku ?? "—"}</td>
                  <td className="table-cell">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      isLow ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                    }`}>
                      {isLow && <span className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                      {p.quantity} units
                    </span>
                  </td>
                  <td className="table-cell text-slate-600">AED {Number(p.unit_price).toFixed(2)}</td>
                  <td className="table-cell font-semibold text-slate-800">
                    AED {(Number(p.quantity) * Number(p.unit_price)).toFixed(2)}
                  </td>
                  <td className="table-cell text-slate-400 text-xs">{p.low_stock_level} units</td>
                  <td className="table-cell">
                    <DeletePartButton partId={p.id} />
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={7} className="table-cell text-center py-16">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#f2f2f7" }}>
                      <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                      </svg>
                    </div>
                    <p className="text-slate-300 text-sm">No parts added yet.</p>
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