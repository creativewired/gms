import { supabase } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";
import Link from "next/link";
import UpdateStatusButton from "./UpdateStatusButton";
import PaymentButton from "./PaymentButton";
import SignatureSection from "./SignatureSection";
import InspectionSection from "./InspectionSection";

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const { id } = await params;
  const { payment } = await searchParams;

  const [{ data: inspection }, { data: job }, { data: items }] = await Promise.all([
    supabase.from("inspection_checklists").select("*").eq("job_id", id).single(),
    supabase.from("jobs").select(`
      *, vehicles ( plate_number, make, model, color, customers ( name, phone, email ) ),
      job_items ( id, description, quantity, unit_price, line_total )
    `).eq("id", id).single(),
    supabase.from("job_items").select("*").eq("job_id", id),
  ]);

  if (!job) notFound();

  const subtotal = (items ?? []).reduce((sum, i) => sum + Number(i.line_total), 0);
  const vat = subtotal * 0.05;
  const total = subtotal + vat;

  const paymentBadge = () => {
    if (job.payment_status === "paid") return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Paid
      </span>
    );
    if (job.payment_status === "pending") return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />Payment Sent
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
        Unpaid
      </span>
    );
  };

  return (
    <div className="space-y-5 max-w-4xl">

      {/* Banners */}
      {payment === "success" && (
        <div className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
          <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <p className="text-sm font-semibold text-emerald-700">
            Payment completed successfully! Job has been marked as completed.
          </p>
        </div>
      )}
      {payment === "cancelled" && (
        <div className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: "#fff1f0", border: "1px solid #fecaca" }}>
          <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <p className="text-sm font-semibold text-red-600">
            Payment was cancelled. You can resend the payment link anytime.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <Link href="/jobs" className="text-xs text-slate-400 hover:text-slate-700 transition-colors mb-2 block">
            ← Back to Jobs
          </Link>
          <p className="section-title">Job Details</p>
          <h1 className="page-title">#{String(job.id).padStart(4, "0")}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {paymentBadge()}
          <UpdateStatusButton jobId={job.id} currentStatus={job.status} />
        </div>
      </div>

      {/* Main grid: stacks on mobile, 3-col on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left — Invoice (full width on mobile, 2 cols on desktop) */}
        <div className="lg:col-span-2 space-y-5">

          {/* Vehicle & Customer */}
          <div className="card p-5">
            <p className="section-title mb-3">Vehicle & Customer</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="label">Vehicle</p>
                <p className="text-lg font-bold text-slate-900">{job.vehicles?.plate_number}</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  {job.vehicles?.make} {job.vehicles?.model}
                  {job.vehicles?.year ? ` · ${job.vehicles.year}` : ""}
                </p>
              </div>
              <div>
                <p className="label">Customer</p>
                <p className="text-sm font-semibold text-slate-800">{job.vehicles?.customers?.name ?? "—"}</p>
                <p className="text-sm text-slate-500 mt-0.5">{job.vehicles?.customers?.phone ?? ""}</p>
                {job.vehicles?.customers?.email && (
                  <p className="text-xs text-slate-400">{job.vehicles.customers.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Job Items */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3 flex items-center justify-between"
              style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", background: "#fafafa" }}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Services & Parts</p>
            </div>

            {/* Mobile: stacked item list */}
            <div className="md:hidden divide-y divide-slate-50">
              {(items ?? []).map(item => (
                <div key={item.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.description}</p>
                    <p className="text-xs text-slate-400">
                      {item.quantity} × AED {Number(item.unit_price).toFixed(2)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 ml-3 shrink-0">
                    AED {Number(item.line_total).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <table className="hidden md:table min-w-full">
              <thead>
                <tr>
                  <th className="table-header">Description</th>
                  <th className="table-header text-right">Qty</th>
                  <th className="table-header text-right">Unit Price</th>
                  <th className="table-header text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {(items ?? []).map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="table-cell font-medium text-slate-800">{item.description}</td>
                    <td className="table-cell text-right text-slate-500">{item.quantity}</td>
                    <td className="table-cell text-right text-slate-500">AED {Number(item.unit_price).toFixed(2)}</td>
                    <td className="table-cell text-right font-semibold text-slate-800">AED {Number(item.line_total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="px-5 py-4 space-y-2"
              style={{ borderTop: "1px solid rgba(0,0,0,0.05)", background: "#fafafa" }}>
              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal</span><span>AED {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>VAT (5%)</span><span>AED {vat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2"
                style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
                <span>Total</span><span>AED {total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {job.notes && (
            <div className="card p-5">
              <p className="label">Notes</p>
              <p className="text-sm text-slate-600 mt-1">{job.notes}</p>
            </div>
          )}

          <InspectionSection jobId={job.id} existing={inspection ?? null} />

          <SignatureSection
            jobId={job.id}
            existingSignature={job.signature_data ?? null}
            signedAt={job.signed_at ?? null}
            signedBy={job.signed_by ?? null}
          />
        </div>

        {/* Right — Sidebar (full width on mobile, 1 col on desktop) */}
        <div className="space-y-4">

          {/* Job Info */}
          <div className="card p-5 space-y-3">
            <p className="text-sm font-semibold text-slate-800">Job Info</p>
            {[
              { label: "Mechanic", value: job.mechanic_name ?? "Unassigned" },
              { label: "Status", value: job.status.replace("_", " ") },
              { label: "Created", value: new Date(job.created_at).toLocaleDateString("en-AE", { month: "short", day: "numeric", year: "numeric" }) },
              { label: "Total", value: `AED ${total.toFixed(2)}` },
            ].map(row => (
              <div key={row.label} className="flex items-start justify-between">
                <p className="text-xs text-slate-400">{row.label}</p>
                <p className="text-xs font-semibold text-slate-700 text-right capitalize">{row.value}</p>
              </div>
            ))}
          </div>

          {/* Payment */}
          <div className="card p-5">
            <p className="text-sm font-semibold text-slate-800 mb-4">Payment</p>
            {job.payment_status === "paid" ? (
              <div className="rounded-xl p-4 text-center"
                style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <svg className="w-8 h-8 text-emerald-500 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-bold text-emerald-700">Payment Received</p>
                <p className="text-xs text-emerald-600 mt-0.5">AED {total.toFixed(2)}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl p-3" style={{ background: "#f8fafc", border: "1px solid #e8e8ed" }}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Amount Due</span>
                    <span className="font-bold text-slate-900">AED {total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Status</span>
                    <span className="font-semibold" style={{ color: job.payment_status === "pending" ? "#1d4ed8" : "#8e8e93" }}>
                      {job.payment_status === "pending" ? "Link Sent" : "Not Paid"}
                    </span>
                  </div>
                </div>
                <PaymentButton
                  jobId={job.id}
                  existingLink={job.payment_link}
                  paymentStatus={job.payment_status}
                  totalAmount={total}
                />
                {job.payment_link && (
                  <div>
                    <p className="label mb-1">Payment Link</p>
                    <div className="flex items-center gap-2 p-2 rounded-lg"
                      style={{ background: "#f8fafc", border: "1px solid #e8e8ed" }}>
                      <p className="text-xs text-slate-400 truncate flex-1 font-mono">
                        {job.payment_link.replace("https://", "").slice(0, 28)}...
                      </p>
                      <button onClick={() => navigator.clipboard.writeText(job.payment_link)}
                        className="text-xs text-slate-500 hover:text-slate-900 transition-colors shrink-0 font-medium">
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="card p-5 space-y-2">
            <p className="text-sm font-semibold text-slate-800 mb-3">Actions</p>
            <Link href={`/jobs/${job.id}/print`} className="btn-ghost w-full justify-center">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}