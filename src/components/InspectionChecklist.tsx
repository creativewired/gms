"use client";

import { useState } from "react";

type Status = "ok" | "attention" | "critical" | "na";

type ChecklistData = Record<string, Status>;

type Props = {
  jobId: number;
  existing?: any;
  onSaved?: () => void;
};

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; border: string; dot: string }> = {
  ok:        { label: "OK",        color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0", dot: "#22c55e" },
  attention: { label: "Attention", color: "#b45309", bg: "#fffbeb", border: "#fde68a", dot: "#f59e0b" },
  critical:  { label: "Critical",  color: "#dc2626", bg: "#fff1f0", border: "#fecaca", dot: "#ef4444" },
  na:        { label: "N/A",       color: "#6b7280", bg: "#f8fafc", border: "#e2e8f0", dot: "#94a3b8" },
};

const SECTIONS = [
  {
    key: "tyres",
    label: "Tyres",
    icon: "🔄",
    items: [
      { key: "tyre_front_left",  label: "Front Left" },
      { key: "tyre_front_right", label: "Front Right" },
      { key: "tyre_rear_left",   label: "Rear Left" },
      { key: "tyre_rear_right",  label: "Rear Right" },
      { key: "tyre_spare",       label: "Spare" },
    ],
  },
  {
    key: "brakes",
    label: "Brakes",
    icon: "🛑",
    items: [
      { key: "brake_front",     label: "Front Brakes" },
      { key: "brake_rear",      label: "Rear Brakes" },
      { key: "brake_handbrake", label: "Handbrake" },
    ],
  },
  {
    key: "fluids",
    label: "Fluids",
    icon: "💧",
    items: [
      { key: "fluid_engine_oil",   label: "Engine Oil" },
      { key: "fluid_coolant",      label: "Coolant" },
      { key: "fluid_brake",        label: "Brake Fluid" },
      { key: "fluid_transmission", label: "Transmission Fluid" },
      { key: "fluid_washer",       label: "Washer Fluid" },
    ],
  },
  {
    key: "lights",
    label: "Lights",
    icon: "💡",
    items: [
      { key: "light_headlights", label: "Headlights" },
      { key: "light_tail",       label: "Tail Lights" },
      { key: "light_indicators", label: "Indicators" },
      { key: "light_hazards",    label: "Hazards" },
    ],
  },
  {
    key: "exterior",
    label: "Exterior",
    icon: "🚗",
    items: [
      { key: "exterior_wipers",      label: "Wipers" },
      { key: "exterior_mirrors",     label: "Mirrors" },
      { key: "exterior_body_damage", label: "Body Damage" },
      { key: "exterior_windows",     label: "Windows" },
    ],
  },
  {
    key: "interior",
    label: "Interior",
    icon: "🪑",
    items: [
      { key: "interior_ac",                label: "A/C" },
      { key: "interior_horn",              label: "Horn" },
      { key: "interior_seatbelts",         label: "Seatbelts" },
      { key: "interior_dashboard_warning", label: "Warning Lights" },
    ],
  },
  {
    key: "battery",
    label: "Battery",
    icon: "🔋",
    items: [
      { key: "battery_condition", label: "Battery Condition" },
      { key: "battery_terminals", label: "Terminals" },
    ],
  },
];

const defaultChecklist = (): ChecklistData => {
  const data: ChecklistData = {};
  SECTIONS.forEach(s => s.items.forEach(i => { data[i.key] = "ok"; }));
  return data;
};

export default function InspectionChecklist({ jobId, existing, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!existing);
  const [inspectedBy, setInspectedBy] = useState(existing?.inspected_by ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [checklist, setChecklist] = useState<ChecklistData>(() => {
    if (existing) {
      const data: ChecklistData = {};
      SECTIONS.forEach(s => s.items.forEach(i => {
        data[i.key] = (existing[i.key] as Status) ?? "ok";
      }));
      return data;
    }
    return defaultChecklist();
  });

  const setStatus = (key: string, status: Status) => {
    setChecklist(prev => ({ ...prev, [key]: status }));
  };

  const getSummary = () => {
    const values = Object.values(checklist);
    const critical = values.filter(v => v === "critical").length;
    const attention = values.filter(v => v === "attention").length;
    const ok = values.filter(v => v === "ok").length;
    return { critical, attention, ok, total: values.length };
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/inspection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, ...checklist, inspected_by: inspectedBy, notes }),
    });
    const data = await res.json();
    setSaving(false);
    if (!data.error) {
      setSaved(true);
      setOpen(false);
      onSaved?.();
    }
  };

  const summary = getSummary();

  // ── Closed state ───────────────────────────────────────────────
  if (!open) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: "#eff6ff" }}>
              <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor"
                strokeWidth={2} viewBox="0 0 24 24">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-800">Inspection Checklist</p>
          </div>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                Completed
              </span>
            )}
            <button onClick={() => setOpen(true)}
              className="text-xs font-medium text-blue-500 hover:text-blue-700 transition-colors">
              {saved ? "Edit" : "Start Inspection"}
            </button>
          </div>
        </div>

        {saved ? (
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: summary.ok, ...STATUS_CONFIG.ok },
{ value: summary.attention, ...STATUS_CONFIG.attention },
{ value: summary.critical, ...STATUS_CONFIG.critical },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3 text-center"
                style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                <p style={{ fontSize: "1.5rem", fontWeight: 700, color: s.color, lineHeight: 1 }}>
                  {s.value}
                </p>
                <p className="text-xs mt-1" style={{ color: s.color }}>{s.label}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 mb-4">
            Complete a full vehicle inspection before starting work. Check tyres, brakes, fluids, lights and more.
          </p>
        )}

        {!saved && (
          <button onClick={() => setOpen(true)}
            className="btn-primary w-full justify-center mt-4"
            style={{ background: "#1d4ed8" }}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            Start Inspection
          </button>
        )}
      </div>
    );
  }

  // ── Full checklist ─────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
      <div className="min-h-screen flex items-start justify-center p-4 py-8">
        <div className="bg-white rounded-3xl shadow-2xl w-full" style={{ maxWidth: "680px" }}>

          {/* Header */}
          <div className="px-7 py-5 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl z-10"
            style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <div>
              <p className="text-base font-bold text-slate-800">Vehicle Inspection</p>
              <p className="text-xs text-slate-400 mt-0.5">Job #{String(jobId).padStart(4, "0")}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Live summary pills */}
              <div className="flex items-center gap-1.5">
                {summary.critical > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: "#fff1f0", color: "#dc2626" }}>
                    {summary.critical} Critical
                  </span>
                )}
                {summary.attention > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: "#fffbeb", color: "#b45309" }}>
                    {summary.attention} Attention
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: "#f0fdf4", color: "#15803d" }}>
                  {summary.ok} OK
                </span>
              </div>
              <button onClick={() => setOpen(false)}
                className="btn-ghost text-xl leading-none">×</button>
            </div>
          </div>

          <div className="p-7 space-y-6">

            {/* Inspector name */}
            <div>
              <label className="label">Inspected By</label>
              <input type="text" value={inspectedBy}
                onChange={e => setInspectedBy(e.target.value)}
                placeholder="Mechanic name..."
                className="input" />
            </div>

            {/* Sections */}
            {SECTIONS.map(section => (
              <div key={section.key}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">{section.icon}</span>
                  <p className="text-sm font-bold text-slate-700">{section.label}</p>
                  <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.06)" }} />
                </div>
                <div className="space-y-2">
                  {section.items.map(item => {
                    const current = checklist[item.key] as Status;
                    return (
                      <div key={item.key}
                        className="flex items-center justify-between p-3 rounded-xl"
                        style={{ background: "#f8fafc" }}>
                        <p className="text-sm font-medium text-slate-700">{item.label}</p>
                        <div className="flex items-center gap-1.5">
                          {(["ok", "attention", "critical", "na"] as Status[]).map(status => {
                            const cfg = STATUS_CONFIG[status];
                            const active = current === status;
                            return (
                              <button
                                key={status}
                                onClick={() => setStatus(item.key, status)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                                style={{
                                  background: active ? cfg.bg : "white",
                                  color: active ? cfg.color : "#94a3b8",
                                  border: `1.5px solid ${active ? cfg.border : "#e2e8f0"}`,
                                  transform: active ? "scale(1.05)" : "scale(1)",
                                }}
                              >
                                {status === "na" ? "N/A" : cfg.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Notes */}
            <div>
              <label className="label">Additional Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any additional observations..."
                rows={3}
                className="input resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button onClick={handleSave} disabled={saving}
                className="btn-primary flex-1 justify-center"
                style={{ background: "#1d4ed8" }}>
                {saving ? (
                  <>
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Save Inspection
                  </>
                )}
              </button>
              <button onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
