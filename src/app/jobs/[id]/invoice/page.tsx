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

  const total = (items ?? []).reduce((sum, i) => sum + Number(i.line_total), 0);
  const customer = job.vehicles?.customers;
  const vehicle = job.vehicles;

  const itemLines = (items ?? [])
    .map((i) => `• ${i.description} x${i.quantity} = AED ${Number(i.line_total).toFixed(2)}`)
    .join("\n");

  const whatsappMessage = `🔧 *${settings?.garage_name ?? "Garage"} - Invoice #${job.id}*

*Customer:* ${customer?.name ?? "—"}
*Vehicle:* ${vehicle?.plate_number} — ${vehicle?.make} ${vehicle?.model} ${vehicle?.year ?? ""}
*Problem:* ${job.problem_description ?? "—"}

*Parts & Labour:*
${itemLines}

———————————
*Total: AED ${total.toFixed(2)}*

Thank you for choosing ${settings?.garage_name ?? "us"}! 🙏`;

  const customerPhone = (customer?.phone ?? "")
    .replace(/\D/g, "")
    .replace(/^0/, "971");

  return (
    <div>
      <div className="flex gap-3 mb-6 print:hidden flex-wrap items-center">
        <a href={`/jobs/${jobId}`} className="text-sm text-slate-500 hover:underline">
          ← Back to Job
        </a>
        <PrintButton />
        <WhatsAppButton phone={customerPhone} message={whatsappMessage} />
      </div>

      {/* Invoice */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 max-w-2xl mx-auto print:border-none">

        {/* Garage Header */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b border-slate-100">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 uppercase">
              {settings?.garage_name ?? "Garage"}
            </h1>
            {settings?.address && (
              <p className="text-slate-400 text-xs mt-1">{settings.address}</p>
            )}
            {settings?.phone && (
              <p className="text-slate-400 text-xs">📞 {settings.phone}</p>
            )}
            {settings?.email && (
              <p className="text-slate-400 text-xs">✉️ {settings.email}</p>
            )}
            {settings?.trn_number && (
              <p className="text-slate-400 text-xs">TRN: {settings.trn_number}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-300 uppercase tracking-widest">
              Invoice
            </p>
            <p className="text-slate-500 text-sm mt-1 font-mono">#{job.id}</p>
            <p className="text-slate-400 text-xs mt-1">
              {new Date(job.created_at).toLocaleDateString("en-AE", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Customer & Vehicle */}
        <div className="grid grid-cols-2 gap-6 mb-8 p-4 bg-slate-50 rounded-lg">
          <div>
            <p className="text-xs text-slate-400 uppercase font-medium mb-1">Bill To</p>
            <p className="font-semibold text-slate-800">{customer?.name ?? "—"}</p>
            <p className="text-slate-500 text-sm">{customer?.phone ?? ""}</p>
            <p className="text-slate-500 text-sm">{customer?.email ?? ""}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-medium mb-1">Vehicle</p>
            <p className="font-semibold text-slate-800">{vehicle?.plate_number}</p>
            <p className="text-slate-500 text-sm">
              {vehicle?.make} {vehicle?.model} {vehicle?.year}
            </p>
            <p className="text-slate-500 text-sm">
              Problem: {job.problem_description ?? "—"}
            </p>
          </div>
        </div>

        {/* Items */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="text-left py-2 text-slate-500 font-medium">Description</th>
              <th className="text-center py-2 text-slate-500 font-medium">Qty</th>
              <th className="text-right py-2 text-slate-500 font-medium">Unit Price</th>
              <th className="text-right py-2 text-slate-500 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((item) => (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="py-3 text-slate-700">{item.description}</td>
                <td className="py-3 text-center text-slate-500">{item.quantity}</td>
                <td className="py-3 text-right text-slate-500">
                  AED {Number(item.unit_price).toFixed(2)}
                </td>
                <td className="py-3 text-right font-medium">
                  AED {Number(item.line_total).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
  <tr>
    <td colSpan={3} className="pt-5 text-right text-slate-500 font-medium">
      Subtotal
    </td>
    <td className="pt-5 text-right text-slate-700 font-medium">
      AED {total.toFixed(2)}
    </td>
  </tr>
  <tr>
    <td colSpan={3} className="py-1 text-right text-slate-400 text-xs">
      VAT (5%)
      {settings?.trn_number && (
        <span className="ml-2 text-slate-300">TRN: {settings.trn_number}</span>
      )}
    </td>
    <td className="py-1 text-right text-slate-400 text-xs">
      AED {(total * 0.05).toFixed(2)}
    </td>
  </tr>
  <tr>
    <td colSpan={3} className="pt-3 text-right font-bold text-slate-800 text-base">
      Total (incl. VAT)
    </td>
    <td className="pt-3 text-right font-bold text-2xl text-slate-900">
      AED {(total * 1.05).toFixed(2)}
    </td>
  </tr>
</tfoot>
        </table>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
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
