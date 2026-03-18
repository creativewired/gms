import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import AddEstimateItemForm from "./AddEstimateItemForm";
import EstimateStatusSelect from "./EstimateStatusSelect";
import ConvertToJobButton from "./ConvertToJobButton";

export default async function EstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const estimateId = Number(id);

  const [{ data: estimate }, { data: items }, { data: settings }] = await Promise.all([
    supabase
      .from("estimates")
      .select("*, customers(name, phone, email), vehicles(plate_number, make, model, year)")
      .eq("id", estimateId)
      .single(),
    supabase.from("estimate_items").select("*").eq("estimate_id", estimateId).order("id"),
    supabase.from("settings").select("*").single(),
  ]);

  if (!estimate) return <p className="text-red-500">Estimate not found.</p>;

  const subtotal = (items ?? []).reduce((sum, i) => sum + Number(i.line_total), 0);
  const vat = subtotal * 0.05;
  const total = subtotal + vat;

  const statusConfig: Record<string, { label: string; class: string }> = {
    draft:    { label: "Draft",    class: "bg-slate-100 text-slate-500 border border-slate-200" },
    sent:     { label: "Sent",     class: "bg-blue-50 text-blue-600 border border-blue-100" },
    approved: { label: "Approved", class: "bg-emerald-50 text-emerald-600 border border-emerald-100" },
    rejected: { label: "Rejected", class: "bg-red-50 text-red-500 border border-red-100" },
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link href="/estimates" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">
          ← Estimates
        </Link>
      </div>

      {/* Header Card */}
      <div className="card p-5 sm:p-7">
        {/* Title + badge */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="section-title mb-1">Estimate</p>
            <h1 className="page-title">#{String(estimate.id).padStart(4, "0")}</h1>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 ml-3 ${statusConfig[estimate.status]?.class}`}>
            {statusConfig[estimate.status]?.label}
          </span>
        </div>

        {/* Info grid: 2 cols mobile → 4 cols sm */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="label">Customer</p>
            <p className="font-semibold text-slate-800 text-sm">{estimate.customers?.name}</p>
            <p className="text-slate-400 text-xs mt-0.5">{estimate.customers?.phone}</p>
          </div>
          <div>
            <p className="label">Vehicle</p>
            <p className="font-semibold text-slate-800 text-sm">{estimate.vehicles?.plate_number}</p>
            <p className="text-slate-400 text-xs mt-0.5">
              {estimate.vehicles?.make} {estimate.vehicles?.model} {estimate.vehicles?.year}
            </p>
          </div>
          <div>
            <p className="label">Valid Until</p>
            <p className="font-semibold text-slate-800 text-sm">
              {estimate.valid_until
                ? new Date(estimate.valid_until).toLocaleDateString("en-AE")
                : "—"}
            </p>
          </div>
          <div>
            <p className="label">Created</p>
            <p className="font-semibold text-slate-800 text-sm">
              {new Date(estimate.created_at).toLocaleDateString("en-AE")}
            </p>
          </div>
        </div>

        {estimate.notes && (
          <div className="mt-4 px-4 py-3 bg-slate-50 rounded-xl text-sm text-slate-500">
            {estimate.notes}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 mt-5 pt-5 border-t border-slate-100">
          <EstimateStatusSelect estimateId={estimate.id} currentStatus={estimate.status} />
          {estimate.status === "approved" && (
            <ConvertToJobButton
              estimateId={estimate.id}
              vehicleId={(estimate as any).vehicle_id}
              description={estimate.notes ?? ""}
            />
          )}
          <Link
            href={`/estimates/${estimate.id}/print`}
            className="text-xs text-slate-400 hover:text-slate-700 transition-colors sm:ml-auto"
          >
            Print Estimate →
          </Link>
        </div>
      </div>

      {/* Line Items */}
      <div>
        <p className="section-title mb-3">Line Items</p>
        <AddEstimateItemForm estimateId={estimateId} />

        <div className="card overflow-hidden mt-4">

          {/* Mobile stacked list */}
          <div className="md:hidden divide-y divide-slate-50">
            {items && items.length > 0 ? items.map(item => (
              <div key={item.id} className="flex justify-between items-start px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-700 font-medium">{item.description}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {item.quantity} × AED {Number(item.unit_price).toFixed(2)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-800 ml-3 shrink-0">
                  AED {Number(item.line_total).toFixed(2)}
                </p>
              </div>
            )) : (
              <p className="px-4 py-10 text-center text-slate-300 text-sm">No items added yet.</p>
            )}

            {/* Mobile totals */}
            {items && items.length > 0 && (
              <div className="px-4 py-3 space-y-1.5 bg-slate-50">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Subtotal</span><span>AED {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>VAT (5%)</span><span>AED {vat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 text-base pt-2 border-t border-slate-200">
                  <span>Total (incl. VAT)</span><span>AED {total.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Desktop table */}
          <table className="hidden md:table min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Description</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Qty</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wide">Unit Price</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wide">Total</th>
              </tr>
            </thead>
            <tbody>
              {items && items.length > 0 ? items.map((item, i) => (
                <tr key={item.id}
                  className={`hover:bg-slate-50/70 transition-colors ${i !== 0 ? "border-t border-slate-50" : ""}`}>
                  <td className="px-6 py-4 text-slate-700">{item.description}</td>
                  <td className="px-6 py-4 text-slate-500">{item.quantity}</td>
                  <td className="px-6 py-4 text-right text-slate-500">AED {Number(item.unit_price).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-medium text-slate-800">AED {Number(item.line_total).toFixed(2)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-300 text-sm">
                    No items added yet.
                  </td>
                </tr>
              )}
            </tbody>
            {items && items.length > 0 && (
              <tfoot className="border-t-2 border-slate-100">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right font-semibold text-slate-600">Subtotal</td>
                  <td className="px-6 py-4 text-right font-semibold text-slate-800">AED {subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-6 py-2 text-right text-sm text-slate-400">VAT (5%)</td>
                  <td className="px-6 py-2 text-right text-sm text-slate-400">AED {vat.toFixed(2)}</td>
                </tr>
                <tr className="bg-slate-50">
                  <td colSpan={3} className="px-6 py-4 text-right font-bold text-slate-800">Total (incl. VAT)</td>
                  <td className="px-6 py-4 text-right font-bold text-xl text-slate-900">AED {total.toFixed(2)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}