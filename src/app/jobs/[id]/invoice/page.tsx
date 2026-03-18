import { supabase } from "@/lib/supabaseClient";
import PrintButton from "./PrintButton";
import WhatsAppButton from "./WhatsAppButton";
import SignatureSection from "./SignatureSection";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jobId = Number(id);

  const [{ data: job }, { data: items }, { data: settings }] = await Promise.all([
    supabase
      .from("jobs")
      .select("*, vehicles(plate_number, make, model, year, customers(name, phone, email))")
      .eq("id", jobId)
      .single(),
    supabase.from("job_items").select("*").eq("job_id", jobId).order("id"),
    supabase.from("settings").select("*").single(),
  ]);

  if (!job) return <p className="text-red-500">Job not found.</p>;

  const subtotal = (items ?? []).reduce((sum, i) => sum + Number(i.line_total), 0);
  const vat = subtotal * 0.05;
  const total = subtotal + vat;
  const customer = job.vehicles?.customers;
  const vehicle = job.vehicles;

  const itemLines = (items ?? [])
    .map(i => `• ${i.description} x${i.quantity} = AED ${Number(i.line_total).toFixed(2)}`)
    .join("\n");

  const whatsappMessage = `🔧 *${settings?.garage_name ?? "Garage"} - Invoice #${job.id}*\n\n*Customer:* ${customer?.name ?? "—"}\n*Vehicle:* ${vehicle?.plate_number} — ${vehicle?.make} ${vehicle?.model} ${vehicle?.year ?? ""}\n*Problem:* ${job.problem_description ?? "—"}\n\n*Parts & Labour:*\n${itemLines}\n\n———————————\n*Total: AED ${total.toFixed(2)}*\n\nThank you for choosing ${settings?.garage_name ?? "us"}! 🙏`;

  const customerPhone = (customer?.phone ?? "")
    .replace(/\D/g, "")
    .replace(/^0/, "971");

  return (
    <div className="max-w-2xl mx-auto">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5 print:hidden">
        <a href={`/jobs/${jobId}`} className="text-sm text-slate-500 hover:underline shrink-0">
          ← Back to Job
        </a>
        <div className="flex flex-wrap gap-2 ml-auto">
          <PrintButton />
          <WhatsAppButton phone={customerPhone} message={whatsappMessage} />
        </div>
      </div>

      {/* Invoice */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-8 print:border-none print:p-0">

        {/* Garage Header */}
        <div className="flex items-start justify-between mb-6 pb-5 border-b border-slate-100">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 uppercase">
              {settings?.garage_name ?? "Garage"}
            </h1>
            {settings?.address && <p className="text-slate-400 text-xs mt-1">{settings.address}</p>}
            {settings?.phone && <p className="text-slate-400 text-xs">📞 {settings.phone}</p>}
            {settings?.email && <p className="text-slate-400 text-xs">✉️ {settings.email}</p>}
            {settings?.trn_number && <p className="text-slate-400 text-xs">TRN: {settings.trn_number}</p>}
          </div>
          <div className="text-right">
            <p className="text-xl sm:text-2xl font-bold text-slate-200 uppercase tracking-widest">Invoice</p>
            <p className="text-slate-500 text-sm mt-1 font-mono">#{String(job.id).padStart(4, "0")}</p>
            <p className="text-slate-400 text-xs mt-1">
              {new Date(job.created_at).toLocaleDateString("en-AE", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Customer & Vehicle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
          <div>
            <p className="text-xs text-slate-400 uppercase font-medium mb-1">Bill To</p>
            <p className="font-semibold text-slate-800 text-sm">{customer?.name ?? "—"}</p>
            <p className="text-slate-500 text-xs">{customer?.phone ?? ""}</p>
            <p className="text-slate-500 text-xs">{customer?.email ?? ""}</p>
          </div>
          <div className="pt-3 sm:pt-0 mt-3 sm:mt-0 border-t sm:border-t-0 border-slate-200">
            <p className="text-xs text-slate-400 uppercase font-medium mb-1">Vehicle</p>
            <p className="font-semibold text-slate-800 text-sm">{vehicle?.plate_number}</p>
            <p className="text-slate-500 text-xs">{vehicle?.make} {vehicle?.model} {vehicle?.year}</p>
            <p className="text-slate-500 text-xs">Problem: {job.problem_description ?? "—"}</p>
          </div>
        </div>

        {/* Items — mobile stacked, desktop table */}
        <div className="mb-5">

          {/* Mobile stacked list */}
          <div className="sm:hidden">
            <div className="flex justify-between pb-2 text-xs font-semibold text-slate-500 uppercase border-b-2 border-slate-200">
              <span>Description</span>
              <span>Total</span>
            </div>
            {(items ?? []).map(item => (
              <div key={item.id} className="flex justify-between py-2.5 border-b border-slate-100">
                <div>
                  <p className="text-sm text-slate-700 font-medium">{item.description}</p>
                  <p className="text-xs text-slate-400">
                    {item.quantity} × AED {Number(item.unit_price).toFixed(2)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-800 ml-3 shrink-0">
                  AED {Number(item.line_total).toFixed(2)}
                </p>
              </div>
            ))}

            {/* Mobile totals */}
            <div className="pt-3 space-y-1.5 mt-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Subtotal</span><span>AED {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>
                  VAT (5%)
                  {settings?.trn_number && (
                    <span className="ml-1 text-slate-300">TRN: {settings.trn_number}</span>
                  )}
                </span>
                <span>AED {vat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-base pt-2 border-t border-slate-200">
                <span>Total (incl. VAT)</span>
                <span>AED {total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Desktop table */}
          <table className="hidden sm:table w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left py-2 text-slate-500 font-medium">Description</th>
                <th className="text-center py-2 text-slate-500 font-medium">Qty</th>
                <th className="text-right py-2 text-slate-500 font-medium">Unit Price</th>
                <th className="text-right py-2 text-slate-500 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {(items ?? []).map(item => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="py-3 text-slate-700">{item.description}</td>
                  <td className="py-3 text-center text-slate-500">{item.quantity}</td>
                  <td className="py-3 text-right text-slate-500">AED {Number(item.unit_price).toFixed(2)}</td>
                  <td className="py-3 text-right font-medium">AED {Number(item.line_total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="pt-5 text-right text-slate-500 font-medium">Subtotal</td>
                <td className="pt-5 text-right text-slate-700 font-medium">AED {subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan={3} className="py-1 text-right text-slate-400 text-xs">
                  VAT (5%)
                  {settings?.trn_number && (
                    <span className="ml-2 text-slate-300">TRN: {settings.trn_number}</span>
                  )}
                </td>
                <td className="py-1 text-right text-slate-400 text-xs">AED {vat.toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan={3} className="pt-3 text-right font-bold text-slate-800 text-base">
                  Total (incl. VAT)
                </td>
                <td className="pt-3 text-right font-bold text-2xl text-slate-900">
                  AED {total.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
          <p className="text-xs text-slate-400 capitalize">
            Status: <span className="font-medium text-slate-600">{job.status.replace("_", " ")}</span>
          </p>
          <p className="text-xs text-slate-400">
            Thank you for choosing {settings?.garage_name ?? "us"}! 🙏
          </p>
        </div>
      </div>
    </div>
  );
}