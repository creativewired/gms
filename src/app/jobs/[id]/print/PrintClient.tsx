"use client";

import { useState } from "react";

type Props = {
  job: any;
  items: any[];
  settings: any;
  inspection: any;
};

const STATUS_LABEL: Record<string, string> = {
  ok: "OK", attention: "Attention", critical: "Critical", na: "N/A",
};
const STATUS_COLOR: Record<string, string> = {
  ok: "#15803d", attention: "#b45309", critical: "#dc2626", na: "#94a3b8",
};

const INSPECTION_SECTIONS = [
  { label: "Tyres",    items: [["tyre_front_left","Front Left"],["tyre_front_right","Front Right"],["tyre_rear_left","Rear Left"],["tyre_rear_right","Rear Right"],["tyre_spare","Spare"]] },
  { label: "Brakes",   items: [["brake_front","Front Brakes"],["brake_rear","Rear Brakes"],["brake_handbrake","Handbrake"]] },
  { label: "Fluids",   items: [["fluid_engine_oil","Engine Oil"],["fluid_coolant","Coolant"],["fluid_brake","Brake Fluid"],["fluid_transmission","Transmission"],["fluid_washer","Washer"]] },
  { label: "Lights",   items: [["light_headlights","Headlights"],["light_tail","Tail Lights"],["light_indicators","Indicators"],["light_hazards","Hazards"]] },
  { label: "Exterior", items: [["exterior_wipers","Wipers"],["exterior_mirrors","Mirrors"],["exterior_body_damage","Body Damage"],["exterior_windows","Windows"]] },
  { label: "Interior", items: [["interior_ac","A/C"],["interior_horn","Horn"],["interior_seatbelts","Seatbelts"],["interior_dashboard_warning","Warning Lights"]] },
  { label: "Battery",  items: [["battery_condition","Condition"],["battery_terminals","Terminals"]] },
];

export default function PrintClient({ job, items, settings, inspection }: Props) {
  const [mode, setMode] = useState<"invoice" | "jobcard">("invoice");

  const customer = job.vehicles?.customers;
  const vehicle = job.vehicles;
  const subtotal = items.reduce((s: number, i: any) => s + Number(i.line_total), 0);
  const vat = subtotal * 0.05;
  const total = subtotal + vat;
  const today = new Date().toLocaleDateString("en-AE", { year: "numeric", month: "long", day: "numeric" });

  return (
    <>
      {/* ── Toolbar (hidden on print) ────────────────────── */}
      <div className="print:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 bg-white shadow-md">
        <div className="flex items-center gap-2">
          <a href={`/jobs/${job.id}`}
            className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
            ← Back
          </a>
          <span className="text-slate-200">|</span>
          <p className="text-sm font-semibold text-slate-700">
            Job #{String(job.id).padStart(4, "0")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
            {(["invoice", "jobcard"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: mode === m ? "white" : "transparent",
                  color: mode === m ? "#1c1c1e" : "#8e8e93",
                  boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                }}>
                {m === "invoice" ? "🧾 Invoice" : "🔧 Job Card"}
              </button>
            ))}
          </div>

          <button onClick={() => window.print()}
            className="btn-primary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Print
          </button>
        </div>
      </div>

      {/* ── Print Area ───────────────────────────────────── */}
      <div className="pt-16 print:pt-0 bg-slate-50 min-h-screen print:bg-white">
        <div className="max-w-3xl mx-auto p-8 print:p-0">

          {/* ════════════════════════════════════════════════
              INVOICE
          ════════════════════════════════════════════════ */}
          {mode === "invoice" && (
            <div className="bg-white rounded-2xl shadow-sm print:shadow-none p-10 print:p-8"
              style={{ border: "1px solid #e2e8f0" }}>

              {/* Header */}
              <div className="flex items-start justify-between pb-6 mb-6"
                style={{ borderBottom: "2px solid #f1f5f9" }}>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 uppercase tracking-wide">
                    {settings?.garage_name ?? "Garage"}
                  </h1>
                  {settings?.address && <p className="text-slate-400 text-xs mt-1">{settings.address}</p>}
                  {settings?.phone && <p className="text-slate-400 text-xs">📞 {settings.phone}</p>}
                  {settings?.email && <p className="text-slate-400 text-xs">✉️ {settings.email}</p>}
                  {settings?.trn_number && <p className="text-slate-400 text-xs">TRN: {settings.trn_number}</p>}
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black text-slate-100 uppercase tracking-widest">Invoice</p>
                  <p className="text-slate-500 font-mono text-sm mt-1">#{String(job.id).padStart(4, "0")}</p>
                  <p className="text-slate-400 text-xs mt-1">{today}</p>
                  <div className="mt-2 px-3 py-1 rounded-full text-xs font-bold inline-block"
                    style={{
                      background: job.payment_status === "paid" ? "#f0fdf4" : "#fffbeb",
                      color: job.payment_status === "paid" ? "#15803d" : "#b45309",
                    }}>
                    {job.payment_status === "paid" ? "✓ PAID" : "UNPAID"}
                  </div>
                </div>
              </div>

              {/* Customer & Vehicle */}
              <div className="grid grid-cols-2 gap-6 mb-8 p-5 rounded-xl"
                style={{ background: "#f8fafc" }}>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bill To</p>
                  <p className="font-bold text-slate-800 text-sm">{customer?.name ?? "—"}</p>
                  <p className="text-slate-500 text-xs">{customer?.phone ?? ""}</p>
                  <p className="text-slate-500 text-xs">{customer?.email ?? ""}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Vehicle</p>
                  <p className="font-bold text-slate-800 text-sm font-mono">{vehicle?.plate_number}</p>
                  <p className="text-slate-500 text-xs">{vehicle?.make} {vehicle?.model} {vehicle?.year}</p>
                  {vehicle?.color && <p className="text-slate-500 text-xs">Color: {vehicle.color}</p>}
                  {vehicle?.vin && <p className="text-slate-400 text-xs font-mono">VIN: {vehicle.vin}</p>}
                </div>
              </div>

              {/* Problem */}
              {job.problem_description && (
                <div className="mb-6 p-4 rounded-xl" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Problem Reported</p>
                  <p className="text-sm text-slate-700">{job.problem_description}</p>
                </div>
              )}

              {/* Items Table */}
              <table className="w-full text-sm mb-6">
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                    <th className="text-left py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Description</th>
                    <th className="text-center py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Qty</th>
                    <th className="text-right py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Unit Price</th>
                    <th className="text-right py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td className="py-3 text-slate-700">{item.description}</td>
                      <td className="py-3 text-center text-slate-500">{item.quantity}</td>
                      <td className="py-3 text-right text-slate-500">AED {Number(item.unit_price).toFixed(2)}</td>
                      <td className="py-3 text-right font-semibold text-slate-800">AED {Number(item.line_total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="pt-4 text-right text-slate-500 text-xs font-semibold">Subtotal</td>
                    <td className="pt-4 text-right text-slate-700 font-semibold">AED {subtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="py-1 text-right text-slate-400 text-xs">
                      VAT (5%) {settings?.trn_number && <span className="ml-1">TRN: {settings.trn_number}</span>}
                    </td>
                    <td className="py-1 text-right text-slate-400 text-xs">AED {vat.toFixed(2)}</td>
                  </tr>
                  <tr style={{ borderTop: "2px solid #e2e8f0" }}>
                    <td colSpan={3} className="pt-4 text-right font-black text-slate-800 text-base">Total (incl. VAT)</td>
                    <td className="pt-4 text-right font-black text-2xl text-slate-900">AED {total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>

              {/* Signature */}
              {job.signature_data && (
                <div className="mt-6 pt-6" style={{ borderTop: "1px solid #f1f5f9" }}>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Customer Signature</p>
                  <img src={job.signature_data} alt="Signature"
                    className="h-16 border rounded-xl p-2"
                    style={{ borderColor: "#e2e8f0" }} />
                  {job.signed_by && <p className="text-xs text-slate-400 mt-1">{job.signed_by} · {job.signed_at ? new Date(job.signed_at).toLocaleDateString("en-AE") : ""}</p>}
                </div>
              )}

              {/* Footer */}
              <div className="mt-8 pt-5 flex items-center justify-between"
                style={{ borderTop: "1px solid #f1f5f9" }}>
                <p className="text-xs text-slate-400">
                  Status: <span className="font-semibold text-slate-600 capitalize">{job.status?.replace("_", " ")}</span>
                </p>
                <p className="text-xs text-slate-400">
                  Thank you for choosing {settings?.garage_name ?? "us"}! 🙏
                </p>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════
              JOB CARD
          ════════════════════════════════════════════════ */}
          {mode === "jobcard" && (
            <div className="bg-white rounded-2xl shadow-sm print:shadow-none p-10 print:p-8 space-y-6"
              style={{ border: "1px solid #e2e8f0" }}>

              {/* Header */}
              <div className="flex items-start justify-between pb-5"
                style={{ borderBottom: "2px solid #f1f5f9" }}>
                <div>
                  <h1 className="text-xl font-black text-slate-900 uppercase tracking-wide">
                    {settings?.garage_name ?? "Garage"}
                  </h1>
                  {settings?.phone && <p className="text-slate-400 text-xs mt-0.5">📞 {settings.phone}</p>}
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-slate-100 uppercase tracking-widest">Job Card</p>
                  <p className="text-slate-500 font-mono text-sm mt-1">#{String(job.id).padStart(4, "0")}</p>
                  <p className="text-slate-400 text-xs">{today}</p>
                </div>
              </div>

              {/* Vehicle + Customer */}
              <div className="grid grid-cols-2 gap-5">
                <div className="p-4 rounded-xl" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Vehicle</p>
                  <div className="space-y-1.5">
                    {[
                      ["Plate",  vehicle?.plate_number],
                      ["Make",   vehicle?.make],
                      ["Model",  vehicle?.model],
                      ["Year",   vehicle?.year],
                      ["Color",  vehicle?.color],
                      ["Mileage", vehicle?.mileage ? `${vehicle.mileage} km` : null],
                      ["VIN",    vehicle?.vin],
                    ].filter(r => r[1]).map(([label, value]) => (
                      <div key={label as string} className="flex justify-between">
                        <p className="text-xs text-slate-400">{label}</p>
                        <p className="text-xs font-semibold text-slate-700 font-mono">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 rounded-xl" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Customer</p>
                  <div className="space-y-1.5">
                    {[
                      ["Name",  customer?.name],
                      ["Phone", customer?.phone],
                      ["Email", customer?.email],
                    ].filter(r => r[1]).map(([label, value]) => (
                      <div key={label as string} className="flex justify-between">
                        <p className="text-xs text-slate-400">{label}</p>
                        <p className="text-xs font-semibold text-slate-700">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3" style={{ borderTop: "1px solid #e2e8f0" }}>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Job Info</p>
                    <div className="space-y-1.5">
                      {[
                        ["Status",   job.status?.replace("_", " ")],
                        ["Mechanic", job.mechanic_name],
                        ["Mileage",  job.mileage ? `${job.mileage} km` : null],
                        ["Fuel",     job.fuel_level],
                      ].filter(r => r[1]).map(([label, value]) => (
                        <div key={label as string} className="flex justify-between">
                          <p className="text-xs text-slate-400">{label}</p>
                          <p className="text-xs font-semibold text-slate-700 capitalize">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Problem */}
              {job.problem_description && (
                <div className="p-4 rounded-xl" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Problem Reported by Customer</p>
                  <p className="text-sm text-slate-700">{job.problem_description}</p>
                </div>
              )}

              {/* Work Items */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Parts & Labour</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                      <th className="text-left py-2 text-slate-400 font-semibold">Description</th>
                      <th className="text-center py-2 text-slate-400 font-semibold">Qty</th>
                      <th className="text-right py-2 text-slate-400 font-semibold">Unit</th>
                      <th className="text-right py-2 text-slate-400 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item: any) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td className="py-2 text-slate-700">{item.description}</td>
                        <td className="py-2 text-center text-slate-500">{item.quantity}</td>
                        <td className="py-2 text-right text-slate-500">AED {Number(item.unit_price).toFixed(2)}</td>
                        <td className="py-2 text-right font-bold text-slate-800">AED {Number(item.line_total).toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: "2px solid #e2e8f0" }}>
                      <td colSpan={3} className="pt-3 text-right font-black text-slate-800">Total (incl. 5% VAT)</td>
                      <td className="pt-3 text-right font-black text-slate-900">AED {total.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Inspection Checklist */}
              {inspection && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Inspection Checklist
                    {inspection.inspected_by && <span className="ml-2 font-normal normal-case text-slate-400">— {inspection.inspected_by}</span>}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {INSPECTION_SECTIONS.map(section => (
                      <div key={section.label} className="p-3 rounded-xl"
                        style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <p className="text-xs font-bold text-slate-600 mb-2">{section.label}</p>
                        <div className="space-y-1">
                          {section.items.map(([key, label]) => {
                            const status = inspection[key] ?? "ok";
                            return (
                              <div key={key} className="flex items-center justify-between">
                                <p className="text-xs text-slate-500">{label}</p>
                                <span className="text-xs font-bold"
                                  style={{ color: STATUS_COLOR[status] ?? "#94a3b8" }}>
                                  {STATUS_LABEL[status] ?? status}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  {inspection.notes && (
                    <div className="mt-3 p-3 rounded-xl text-xs text-slate-600"
                      style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                      <span className="font-bold text-slate-400 uppercase text-xs tracking-wider">Notes: </span>
                      {inspection.notes}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {job.notes && (
                <div className="p-4 rounded-xl" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Workshop Notes</p>
                  <p className="text-sm text-slate-700">{job.notes}</p>
                </div>
              )}

              {/* Damage Notes */}
              {job.damage_notes && (
                <div className="p-4 rounded-xl" style={{ background: "#fff1f0", border: "1px solid #fecaca" }}>
                  <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Damage Notes</p>
                  <p className="text-sm text-slate-700">{job.damage_notes}</p>
                </div>
              )}

              {/* Signature + Sign-off boxes */}
              <div className="grid grid-cols-2 gap-6 pt-4"
                style={{ borderTop: "2px solid #f1f5f9" }}>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Mechanic Sign-off</p>
                  <div className="h-16 rounded-xl" style={{ border: "1.5px dashed #e2e8f0" }} />
                  <div className="mt-2 h-px" style={{ background: "#e2e8f0" }} />
                  <p className="text-xs text-slate-400 mt-1">Signature & Date</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Customer Sign-off</p>
                  {job.signature_data ? (
                    <>
                      <img src={job.signature_data} alt="Signature" className="h-16 rounded-xl p-2"
                        style={{ border: "1px solid #e2e8f0" }} />
                      {job.signed_by && <p className="text-xs text-slate-400 mt-1">{job.signed_by}</p>}
                    </>
                  ) : (
                    <div className="h-16 rounded-xl" style={{ border: "1.5px dashed #e2e8f0" }} />
                  )}
                  <div className="mt-2 h-px" style={{ background: "#e2e8f0" }} />
                  <p className="text-xs text-slate-400 mt-1">Signature & Date</p>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
}
