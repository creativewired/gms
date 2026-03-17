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

  const total = (items ?? []).reduce((sum, i) => sum + Number(i.line_total), 0);

  const statusConfig: Record<string, { label: string; class: string }> = {
    draft: { label: "Draft", class: "bg-slate-100 text-slate-500 border border-slate-200" },
    sent: { label: "Sent", class: "bg-blue-50 text-blue-600 border border-blue-100" },
    approved: { label: "Approved", class: "bg-emerald-50 text-emerald-600 border border-emerald-100" },
    rejected: { label: "Rejected", class: "bg-red-50 text-red-500 border border-red-100" },
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/estimates" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">
          ← Estimates
        </Link>
      </div>

      {/* Header Card */}
      <div className="card p-7">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="section-title mb-1">Estimate</p>
            <h1 className="page-title">#{String(estimate.id).padStart(4, "0")}</h1>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${statusConfig[estimate.status]?.class}`}>
            {statusConfig[estimate.status]?.label}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
          <div>
            <p className="label">Customer</p>
            <p className="font-semibold text-slate-800">{estimate.customers?.name}</p>
            <p className="text-slate-400 text-xs mt-0.5">{estimate.customers?.phone}</p>
          </div>
          <div>
            <p className="label">Vehicle</p>
            <p className="font-semibold text-slate-800">{estimate.vehicles?.plate_number}</p>
            <p className="text-slate-400 text-xs mt-0.5">
              {estimate.vehicles?.make} {estimate.vehicles?.model} {estimate.vehicles?.year}
            </p>
          </div>
          <div>
            <p className="label">Valid Until</p>
            <p className="font-semibold text-slate-800">
              {estimate.valid_until
                ? new Date(estimate.valid_until).toLocaleDateString("en-AE")
                : "—"}
            </p>
          </div>
          <div>
            <p className="label">Created</p>
            <p className="font-semibold text-slate-800">
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
        <div className="flex items-center gap-4 mt-6 pt-6 border-t border-slate-100">
          <EstimateStatusSelect estimateId={estimate.id} currentStatus={estimate.status} />
          {estimate.status === "approved" && (
            <ConvertToJobButton
              estimateId={estimate.id}
              vehicleId={estimate.vehicles ? (estimate as any).vehicle_id : null}
              description={estimate.notes ?? ""}
            />
          )}
          <Link
            href={`/estimates/${estimate.id}/print`}
            className="text-xs text-slate-400 hover:text-slate-700 transition-colors ml-auto"
          >
            Print Estimate →
          </Link>
        </div>
      </div>

      {/* Items */}
      <div>
        <p className="section-title">Line Items</p>
        <AddEstimateItemForm estimateId={estimateId} />

        <div className="card overflow-hidden mt-4">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Description</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Qty</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wide">Unit Price</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wide">Total</th>
              </tr>
            </thead>
            <tbody>
              {items && items.length > 0 ? (
                items.map((item, i) => (
                  <tr key={item.id} className={`hover:bg-slate-50/70 transition-colors ${i !== 0 ? "border-t border-slate-50" : ""}`}>
                    <td className="px-6 py-4 text-slate-700">{item.description}</td>
                    <td className="px-6 py-4 text-slate-500">{item.quantity}</td>
                    <td className="px-6 py-4 text-right text-slate-500">AED {Number(item.unit_price).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-800">AED {Number(item.line_total).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
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
                  <td colSpan={3} className="px-6 py-4 text-right font-semibold text-slate-600">
                    Subtotal
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-slate-800">
                    AED {total.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-6 py-2 text-right text-sm text-slate-400">
                    VAT (5%)
                  </td>
                  <td className="px-6 py-2 text-right text-sm text-slate-400">
                    AED {(total * 0.05).toFixed(2)}
                  </td>
                </tr>
                <tr className="bg-slate-50">
                  <td colSpan={3} className="px-6 py-4 text-right font-bold text-slate-800">
                    Total (incl. VAT)
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-xl text-slate-900">
                    AED {(total * 1.05).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
