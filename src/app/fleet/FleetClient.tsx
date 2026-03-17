"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Fleet = {
  id: number;
  company_name: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  branch_id: number | null;
  notes: string | null;
  is_active: boolean;
  branches?: { name: string } | null;
};

type Vehicle = {
  id: number;
  plate_number: string;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  fleet_id: number | null;
  customers?: { name: string } | null;
};

type Branch = { id: number; name: string };

const FLEET_COLORS = ["#3b82f6","#8b5cf6","#f59e0b","#10b981","#ef4444","#0891b2","#ec4899","#84cc16"];

const emptyFleetForm = {
  company_name: "", contact_name: "", contact_phone: "",
  contact_email: "", branch_id: "", notes: "", is_active: true,
};

export default function FleetClient({
  initialFleets, allVehicles, branches,
  fleetVehicles, fleetRevenue, fleetJobs,
}: {
  initialFleets: Fleet[];
  allVehicles: Vehicle[];
  branches: Branch[];
  fleetVehicles: Record<number, Vehicle[]>;
  fleetRevenue: Record<number, number>;
  fleetJobs: Record<number, number>;
}) {
  const router = useRouter();
  const [fleets, setFleets] = useState(initialFleets);
  const [selectedFleet, setSelectedFleet] = useState<Fleet | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyFleetForm });
  const [saving, setSaving] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<number[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const openAdd = () => {
    setForm({ ...emptyFleetForm });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (f: Fleet) => {
    setForm({
      company_name: f.company_name,
      contact_name: f.contact_name ?? "",
      contact_phone: f.contact_phone ?? "",
      contact_email: f.contact_email ?? "",
      branch_id: f.branch_id ? String(f.branch_id) : "",
      notes: f.notes ?? "",
      is_active: f.is_active,
    });
    setEditingId(f.id);
    setSelectedFleet(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.company_name) return alert("Company name is required");
    setSaving(true);

    const payload = {
      company_name: form.company_name,
      contact_name: form.contact_name || null,
      contact_phone: form.contact_phone || null,
      contact_email: form.contact_email || null,
      branch_id: form.branch_id ? Number(form.branch_id) : null,
      notes: form.notes || null,
      is_active: form.is_active,
      ...(editingId ? { id: editingId } : {}),
    };

    const res = await fetch("/api/fleet", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);

    if (!data.error) {
      setShowForm(false);
      if (editingId) {
        setFleets(prev => prev.map(f => f.id === editingId ? { ...f, ...data } : f));
      } else {
        setFleets(prev => [...prev, data]);
      }
      router.refresh();
    } else {
      alert("Error: " + data.error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this fleet?")) return;
    await fetch("/api/fleet", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setFleets(prev => prev.filter(f => f.id !== id));
    setSelectedFleet(null);
  };

  const openAssign = (fleet: Fleet) => {
    const current = (fleetVehicles[fleet.id] ?? []).map(v => v.id);
    setSelectedVehicleIds(current);
    setSelectedFleet(fleet);
    setShowAssign(true);
  };

  const handleAssign = async () => {
    if (!selectedFleet) return;
    setAssigning(true);

    // Get current fleet vehicles
    const current = (fleetVehicles[selectedFleet.id] ?? []).map(v => v.id);

    // Add new ones
    const toAdd = selectedVehicleIds.filter(id => !current.includes(id));
    // Remove deselected
    const toRemove = current.filter(id => !selectedVehicleIds.includes(id));

    const promises = [
      ...toAdd.map(vid =>
        fetch("/api/fleet/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vehicleId: vid, fleetId: selectedFleet.id }),
        })
      ),
      ...toRemove.map(vid =>
        fetch("/api/fleet/assign", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vehicleId: vid }),
        })
      ),
    ];

    await Promise.all(promises);
    setAssigning(false);
    setShowAssign(false);
    router.refresh();
  };

  const toggleVehicle = (id: number) => {
    setSelectedVehicleIds(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const totalVehicles = Object.values(fleetVehicles).reduce((s, v) => s + (v?.length ?? 0), 0);
  const totalRevenue = Object.values(fleetRevenue).reduce((s, v) => s + v, 0);
  const totalJobs = Object.values(fleetJobs).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Fleets", value: fleets.length, color: "#1d4ed8", border: "#bfdbfe" },
          { label: "Fleet Vehicles", value: totalVehicles, color: "#7c3aed", border: "#ddd6fe" },
          { label: "Fleet Jobs", value: totalJobs, color: "#b45309", border: "#fde68a" },
          { label: "Fleet Revenue", value: `AED ${totalRevenue.toLocaleString("en-AE", { minimumFractionDigits: 0 })}`, color: "#15803d", border: "#bbf7d0" },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.border}` }}>
            <p className="label">{s.label}</p>
            <p style={{ fontSize: "1.6rem", fontWeight: 700, color: s.color, letterSpacing: "-0.02em", lineHeight: 1.1, marginTop: "0.3rem" }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-end">
        <button onClick={openAdd} className="btn-primary">+ Add Fleet</button>
      </div>

      {/* Fleet Cards */}
      <div className="grid grid-cols-2 gap-5">
        {fleets.map((fleet, idx) => {
          const vehicles = fleetVehicles[fleet.id] ?? [];
          const revenue = fleetRevenue[fleet.id] ?? 0;
          const jobs = fleetJobs[fleet.id] ?? 0;
          const color = FLEET_COLORS[idx % FLEET_COLORS.length];

          return (
            <div key={fleet.id} className="card p-6"
              style={{ borderTop: `3px solid ${color}20`, opacity: fleet.is_active ? 1 : 0.6 }}>

              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
                    style={{ background: color }}>
                    {fleet.company_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-800">{fleet.company_name}</p>
                    {fleet.branches?.name && (
                      <p className="text-xs text-slate-400">{fleet.branches.name}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{
                      background: fleet.is_active ? "#f0fdf4" : "#f8fafc",
                      color: fleet.is_active ? "#15803d" : "#94a3b8",
                    }}>
                    {fleet.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {/* Contact */}
              {(fleet.contact_name || fleet.contact_phone) && (
                <div className="flex items-center gap-4 mb-4 p-3 rounded-xl"
                  style={{ background: "#f8fafc" }}>
                  {fleet.contact_name && (
                    <div>
                      <p className="text-xs text-slate-400">Contact</p>
                      <p className="text-xs font-semibold text-slate-700">{fleet.contact_name}</p>
                    </div>
                  )}
                  {fleet.contact_phone && (
                    <div>
                      <p className="text-xs text-slate-400">Phone</p>
                      <p className="text-xs font-semibold text-slate-700">{fleet.contact_phone}</p>
                    </div>
                  )}
                  {fleet.contact_email && (
                    <div>
                      <p className="text-xs text-slate-400">Email</p>
                      <p className="text-xs font-semibold text-slate-700 truncate max-w-[120px]">{fleet.contact_email}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Vehicles", value: vehicles.length, color },
                  { label: "Jobs", value: jobs, color: "#64748b" },
                  { label: "Revenue", value: `AED ${revenue.toLocaleString("en-AE", { minimumFractionDigits: 0 })}`, color: "#15803d" },
                ].map(m => (
                  <div key={m.label} className="rounded-xl p-3 text-center"
                    style={{ background: "#f8fafc" }}>
                    <p className="text-base font-bold truncate" style={{ color: m.color }}>{m.value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Vehicle plates */}
              {vehicles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {vehicles.slice(0, 6).map(v => (
                    <Link key={v.id} href={`/vehicles/${v.id}`}
                      className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition-colors hover:opacity-70"
                      style={{ background: `${color}15`, color }}>
                      {v.plate_number}
                    </Link>
                  ))}
                  {vehicles.length > 6 && (
                    <span className="px-2 py-0.5 rounded-lg text-xs text-slate-400"
                      style={{ background: "#f2f2f7" }}>
                      +{vehicles.length - 6} more
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3"
                style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                <button onClick={() => openAssign(fleet)}
                  className="flex-1 text-xs font-semibold py-2 rounded-xl transition-colors"
                  style={{ background: `${color}15`, color }}>
                  Manage Vehicles
                </button>
                <button onClick={() => openEdit(fleet)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                  style={{ background: "#f2f2f7", color: "#3a3a3c" }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(fleet.id)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                  style={{ background: "#fff1f0", color: "#dc2626" }}>
                  Delete
                </button>
              </div>
            </div>
          );
        })}

        {fleets.length === 0 && (
          <div className="col-span-2 card p-16 text-center">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "#f2f2f7" }}>
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h1l2-4h10l2 4h1a2 2 0 012 2v6a2 2 0 01-2 2h-2" />
                <circle cx="7.5" cy="17.5" r="2.5" /><circle cx="16.5" cy="17.5" r="2.5" />
              </svg>
            </div>
            <p className="text-slate-300 text-sm">No fleets yet. Add your first fleet client.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)" }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full overflow-y-auto"
            style={{ maxWidth: "500px", maxHeight: "92vh" }}>
            <div className="px-7 py-5 flex items-center justify-between"
              style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <p className="text-base font-semibold text-slate-800">
                {editingId ? "Edit Fleet" : "Add Fleet"}
              </p>
              <button onClick={() => setShowForm(false)}
                className="btn-ghost text-xl leading-none">×</button>
            </div>

            <div className="p-7 space-y-4">
              <div>
                <label className="label">Company Name <span className="text-red-400">*</span></label>
                <input name="company_name" value={form.company_name} onChange={handleChange}
                  placeholder="e.g. Emirates Transport" className="input" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Contact Person</label>
                  <input name="contact_name" value={form.contact_name} onChange={handleChange}
                    placeholder="Full name" className="input" />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input name="contact_phone" value={form.contact_phone} onChange={handleChange}
                    placeholder="+971..." className="input" />
                </div>
              </div>

              <div>
                <label className="label">Email</label>
                <input type="email" name="contact_email" value={form.contact_email}
                  onChange={handleChange} placeholder="contact@company.com" className="input" />
              </div>

              <div>
                <label className="label">Branch</label>
                <select name="branch_id" value={form.branch_id} onChange={handleChange} className="input">
                  <option value="">All Branches</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea name="notes" value={form.notes} onChange={handleChange}
                  placeholder="Any notes about this fleet client..."
                  rows={3} className="input resize-none" />
              </div>

              <div className="flex items-center gap-3 p-4 rounded-2xl"
                style={{ background: "#f8fafc" }}>
                <input type="checkbox" name="is_active" id="fleet_active"
                  checked={form.is_active as unknown as boolean}
                  onChange={handleChange}
                  className="w-4 h-4 rounded accent-blue-600" />
                <label htmlFor="fleet_active" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Active fleet
                </label>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button onClick={handleSave} disabled={saving}
                  className="btn-primary flex-1 justify-center">
                  {saving ? "Saving..." : editingId ? "Save Changes" : "Add Fleet"}
                </button>
                <button onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Vehicles Modal */}
      {showAssign && selectedFleet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)" }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full overflow-y-auto"
            style={{ maxWidth: "480px", maxHeight: "92vh" }}>
            <div className="px-7 py-5 flex items-center justify-between"
              style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <div>
                <p className="text-base font-semibold text-slate-800">Manage Vehicles</p>
                <p className="text-xs text-slate-400 mt-0.5">{selectedFleet.company_name}</p>
              </div>
              <button onClick={() => setShowAssign(false)}
                className="btn-ghost text-xl leading-none">×</button>
            </div>

            <div className="p-7 space-y-3">
              <p className="text-xs text-slate-400 mb-4">
                Select vehicles to assign to this fleet. Deselect to remove.
              </p>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allVehicles.map(v => {
                  const selected = selectedVehicleIds.includes(v.id);
                  const otherFleet = v.fleet_id && v.fleet_id !== selectedFleet.id;
                  return (
                    <div key={v.id}
                      onClick={() => !otherFleet && toggleVehicle(v.id)}
                      className="flex items-center gap-3 p-3 rounded-xl transition-all"
                      style={{
                        background: selected ? "#eff6ff" : "#f8fafc",
                        border: `1.5px solid ${selected ? "#bfdbfe" : "transparent"}`,
                        cursor: otherFleet ? "not-allowed" : "pointer",
                        opacity: otherFleet ? 0.5 : 1,
                      }}>
                      <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0"
                        style={{
                          background: selected ? "#3b82f6" : "white",
                          borderColor: selected ? "#3b82f6" : "#e2e8f0",
                        }}>
                        {selected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold font-mono text-slate-800">
                          {v.plate_number}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {v.make} {v.model} {v.year ? `· ${v.year}` : ""}
                          {v.customers?.name ? ` · ${v.customers.name}` : ""}
                        </p>
                      </div>
                      {otherFleet && (
                        <span className="text-xs text-slate-400 shrink-0">Other fleet</span>
                      )}
                    </div>
                  );
                })}

                {allVehicles.length === 0 && (
                  <p className="text-center text-slate-300 text-sm py-8">
                    No vehicles found. Add vehicles first.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button onClick={handleAssign} disabled={assigning}
                  className="btn-primary flex-1 justify-center">
                  {assigning ? "Saving..." : `Assign ${selectedVehicleIds.length} Vehicle${selectedVehicleIds.length !== 1 ? "s" : ""}`}
                </button>
                <button onClick={() => setShowAssign(false)} className="btn-ghost">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
