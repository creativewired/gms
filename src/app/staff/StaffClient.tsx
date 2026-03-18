"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type StaffMember = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  branch_id: number | null;
  avatar_color: string;
  specialization: string | null;
  hourly_rate: number;
  is_active: boolean;
  joined_date: string;
  branches?: { name: string } | null;
};

type Branch = { id: number; name: string };
type Stats = Record<string, { jobs: number; revenue: number; completed: number }>;

const ROLES = [
  { key: "mechanic",        label: "Mechanic",       color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
  { key: "senior_mechanic", label: "Senior Mechanic", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  { key: "service_advisor", label: "Service Advisor", color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
  { key: "manager",         label: "Manager",         color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  { key: "receptionist",    label: "Receptionist",    color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
];

const COLORS = ["#3b82f6","#8b5cf6","#f59e0b","#10b981","#ef4444","#ec4899","#0891b2","#84cc16"];

const getRoleConfig = (role: string) =>
  ROLES.find(r => r.key === role) ?? { key: role, label: role, color: "#6b7280", bg: "#f8fafc", border: "#e2e8f0" };

const emptyForm = {
  name: "", email: "", phone: "", role: "mechanic",
  branch_id: "", specialization: "", hourly_rate: "",
  avatar_color: "#3b82f6", is_active: true, joined_date: "",
};

export default function StaffClient({
  initialStaff, branches, staffStats,
}: {
  initialStaff: StaffMember[];
  branches: Branch[];
  staffStats: Stats;
}) {
  const router = useRouter();
  const [staff, setStaff] = useState(initialStaff);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [filterRole, setFilterRole] = useState("all");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const openAdd = () => { setForm({ ...emptyForm }); setEditingId(null); setShowForm(true); };

  const openEdit = (s: StaffMember) => {
    setForm({
      name: s.name, email: s.email ?? "", phone: s.phone ?? "",
      role: s.role, branch_id: s.branch_id ? String(s.branch_id) : "",
      specialization: s.specialization ?? "", hourly_rate: String(s.hourly_rate),
      avatar_color: s.avatar_color, is_active: s.is_active, joined_date: s.joined_date ?? "",
    });
    setEditingId(s.id);
    setShowForm(true);
    setSelectedStaff(null);
  };

  const handleSave = async () => {
    if (!form.name) return alert("Name is required");
    setSaving(true);
    const payload = {
      name: form.name, email: form.email || null, phone: form.phone || null,
      role: form.role, branch_id: form.branch_id ? Number(form.branch_id) : null,
      specialization: form.specialization || null, hourly_rate: Number(form.hourly_rate) || 0,
      avatar_color: form.avatar_color, is_active: form.is_active,
      joined_date: form.joined_date || null,
      ...(editingId ? { id: editingId } : {}),
    };
    const res = await fetch("/api/staff", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!data.error) {
      setShowForm(false);
      router.refresh();
      if (editingId) {
        setStaff(prev => prev.map(s => s.id === editingId ? { ...s, ...data } : s));
      } else {
        setStaff(prev => [...prev, data]);
      }
    } else {
      alert("Error: " + data.error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this staff member?")) return;
    setDeleting(id);
    await fetch("/api/staff", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDeleting(null);
    setStaff(prev => prev.filter(s => s.id !== id));
    setSelectedStaff(null);
  };

  const handleToggleActive = async (s: StaffMember) => {
    await fetch("/api/staff", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.id, is_active: !s.is_active }),
    });
    setStaff(prev => prev.map(m => m.id === s.id ? { ...m, is_active: !s.is_active } : m));
  };

  const filtered = filterRole === "all" ? staff : staff.filter(s => s.role === filterRole);
  const activeCount = staff.filter(s => s.is_active).length;
  const totalRevenue = Object.values(staffStats).reduce((s, v) => s + v.revenue, 0);

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Staff", value: staff.length, color: "#1d4ed8", border: "#bfdbfe" },
          { label: "Active", value: activeCount, color: "#15803d", border: "#bbf7d0" },
          { label: "Inactive", value: staff.length - activeCount, color: "#dc2626", border: "#fecaca" },
          { label: "Total Revenue", value: `AED ${totalRevenue.toLocaleString("en-AE", { minimumFractionDigits: 0 })}`, color: "#7c3aed", border: "#ddd6fe" },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.border}` }}>
            <p className="label text-xs">{s.label}</p>
            <p style={{ fontSize: "1.4rem", fontWeight: 700, color: s.color, letterSpacing: "-0.02em", lineHeight: 1.1, marginTop: "0.3rem" }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setFilterRole("all")}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{ background: filterRole === "all" ? "#1c1c1e" : "#f2f2f7", color: filterRole === "all" ? "white" : "#3a3a3c" }}>
            All ({staff.length})
          </button>
          {ROLES.map(r => {
            const count = staff.filter(s => s.role === r.key).length;
            if (!count) return null;
            return (
              <button key={r.key} onClick={() => setFilterRole(r.key)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: filterRole === r.key ? r.bg : "#f2f2f7",
                  color: filterRole === r.key ? r.color : "#3a3a3c",
                  border: filterRole === r.key ? `1px solid ${r.border}` : "1px solid transparent",
                }}>
                {r.label} ({count})
              </button>
            );
          })}
        </div>
        <button onClick={openAdd} className="btn-primary self-start sm:self-auto">+ Add Staff</button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => {
          const roleConfig = getRoleConfig(s.role);
          const stats = staffStats[s.name] ?? { jobs: 0, revenue: 0, completed: 0 };
          const completionRate = stats.jobs ? Math.round((stats.completed / stats.jobs) * 100) : 0;
          return (
            <div key={s.id} onClick={() => setSelectedStaff(s)}
              className="card p-4 cursor-pointer transition-all hover:shadow-md"
              style={{ opacity: s.is_active ? 1 : 0.6 }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-base shrink-0"
                    style={{ background: s.avatar_color }}>
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{s.name}</p>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: roleConfig.bg, color: roleConfig.color, border: `1px solid ${roleConfig.border}` }}>
                      {roleConfig.label}
                    </span>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full mt-1.5"
                  style={{ background: s.is_active ? "#22c55e" : "#94a3b8" }} />
              </div>
              {s.specialization && (
                <p className="text-xs text-slate-400 mb-3 truncate">{s.specialization}</p>
              )}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: "Jobs", value: stats.jobs },
                  { label: "Done", value: stats.completed },
                  { label: "Rate", value: `${completionRate}%` },
                ].map(m => (
                  <div key={m.label} className="rounded-xl p-2 text-center" style={{ background: "#f8fafc" }}>
                    <p className="text-sm font-bold text-slate-800">{m.value}</p>
                    <p className="text-xs text-slate-400">{m.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3"
                style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                <p className="text-xs text-slate-400">Revenue</p>
                <p className="text-sm font-bold text-slate-800">
                  AED {stats.revenue.toLocaleString("en-AE", { minimumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full card p-12 text-center">
            <p className="text-slate-300 text-sm">No staff found.</p>
          </div>
        )}
      </div>

      {/* Staff Detail Drawer */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 flex justify-end"
          style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }}
          onClick={() => setSelectedStaff(null)}>
          <div className="bg-white h-full w-full max-w-sm shadow-2xl overflow-y-auto"
            style={{ borderRadius: "24px 0 0 24px" }}
            onClick={e => e.stopPropagation()}>
            <div className="p-5 space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-500">Staff Profile</p>
                <button onClick={() => setSelectedStaff(null)} className="btn-ghost text-xl leading-none">×</button>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3"
                  style={{ background: selectedStaff.avatar_color }}>
                  {selectedStaff.name.charAt(0)}
                </div>
                <p className="text-lg font-bold text-slate-800">{selectedStaff.name}</p>
                <span className="px-3 py-1 rounded-full text-xs font-semibold mt-1 inline-block"
                  style={{
                    background: getRoleConfig(selectedStaff.role).bg,
                    color: getRoleConfig(selectedStaff.role).color,
                    border: `1px solid ${getRoleConfig(selectedStaff.role).border}`,
                  }}>
                  {getRoleConfig(selectedStaff.role).label}
                </span>
              </div>
              <div className="card p-4 space-y-3">
                {[
                  { label: "Email", value: selectedStaff.email ?? "—" },
                  { label: "Phone", value: selectedStaff.phone ?? "—" },
                  { label: "Branch", value: selectedStaff.branches?.name ?? "All Branches" },
                  { label: "Specialization", value: selectedStaff.specialization ?? "—" },
                  { label: "Hourly Rate", value: `AED ${selectedStaff.hourly_rate}/hr` },
                  { label: "Joined", value: selectedStaff.joined_date ? new Date(selectedStaff.joined_date).toLocaleDateString("en-AE", { month: "short", day: "numeric", year: "numeric" }) : "—" },
                  { label: "Status", value: selectedStaff.is_active ? "Active" : "Inactive" },
                ].map(row => (
                  <div key={row.label} className="flex items-start justify-between">
                    <p className="text-xs text-slate-400">{row.label}</p>
                    <p className="text-xs font-semibold text-slate-700 text-right max-w-[60%]">{row.value}</p>
                  </div>
                ))}
              </div>
              <div className="card p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Performance</p>
                {(() => {
                  const stats = staffStats[selectedStaff.name] ?? { jobs: 0, revenue: 0, completed: 0 };
                  const rate = stats.jobs ? Math.round((stats.completed / stats.jobs) * 100) : 0;
                  return (
                    <div className="space-y-3">
                      {[
                        { label: "Total Jobs", value: stats.jobs, color: "#1d4ed8" },
                        { label: "Completed", value: stats.completed, color: "#15803d" },
                        { label: "Completion Rate", value: `${rate}%`, color: "#7c3aed" },
                        { label: "Revenue", value: `AED ${stats.revenue.toLocaleString("en-AE", { minimumFractionDigits: 0 })}`, color: "#b45309" },
                      ].map(m => (
                        <div key={m.label} className="flex justify-between items-center">
                          <p className="text-xs text-slate-400">{m.label}</p>
                          <p className="text-sm font-bold" style={{ color: m.color }}>{m.value}</p>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
              <div className="space-y-2">
                <button onClick={() => openEdit(selectedStaff)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: "#f2f2f7", color: "#3a3a3c" }}>
                  Edit Profile
                </button>
                <button onClick={() => handleToggleActive(selectedStaff)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: selectedStaff.is_active ? "#fffbeb" : "#f0fdf4", color: selectedStaff.is_active ? "#b45309" : "#15803d" }}>
                  {selectedStaff.is_active ? "Mark Inactive" : "Mark Active"}
                </button>
                <button onClick={() => handleDelete(selectedStaff.id)}
                  disabled={deleting === selectedStaff.id}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: "#fff1f0", color: "#dc2626" }}>
                  {deleting === selectedStaff.id ? "Removing..." : "Remove Staff"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)" }}>
          <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-y-auto"
            style={{ maxHeight: "92vh" }}>
            <div className="px-5 sm:px-7 py-4 sm:py-5 flex items-center justify-between"
              style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <p className="text-base font-semibold text-slate-800">
                {editingId ? "Edit Staff" : "Add Staff Member"}
              </p>
              <button onClick={() => setShowForm(false)} className="btn-ghost text-xl leading-none">×</button>
            </div>
            <div className="p-5 sm:p-7 space-y-4">
              <div>
                <p className="label mb-2">Avatar Color</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setForm(prev => ({ ...prev, avatar_color: c }))}
                      className="w-7 h-7 rounded-xl transition-transform"
                      style={{
                        background: c,
                        transform: form.avatar_color === c ? "scale(1.2)" : "scale(1)",
                        outline: form.avatar_color === c ? `2px solid ${c}` : "none",
                        outlineOffset: "2px",
                      }} />
                  ))}
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold ml-2"
                    style={{ background: form.avatar_color }}>
                    {form.name.charAt(0) || "?"}
                  </div>
                </div>
              </div>
              <div>
                <label className="label">Full Name <span className="text-red-400">*</span></label>
                <input name="name" value={form.name} onChange={handleChange}
                  placeholder="e.g. Ahmed Al Mansouri" className="input" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Role <span className="text-red-400">*</span></label>
                  <select name="role" value={form.role} onChange={handleChange} className="input">
                    {ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Branch</label>
                  <select name="branch_id" value={form.branch_id} onChange={handleChange} className="input">
                    <option value="">All Branches</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Specialization</label>
                <input name="specialization" value={form.specialization} onChange={handleChange}
                  placeholder="e.g. Engine & Transmission" className="input" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Email</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange}
                    placeholder="email@garage.com" className="input" />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input name="phone" value={form.phone} onChange={handleChange}
                    placeholder="+971..." className="input" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Hourly Rate (AED)</label>
                  <input type="number" name="hourly_rate" value={form.hourly_rate}
                    onChange={handleChange} placeholder="0" min="0" className="input" />
                </div>
                <div>
                  <label className="label">Joined Date</label>
                  <input type="date" name="joined_date" value={form.joined_date}
                    onChange={handleChange} className="input" />
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: "#f8fafc" }}>
                <input type="checkbox" name="is_active" id="is_active"
                  checked={form.is_active as unknown as boolean}
                  onChange={handleChange}
                  className="w-4 h-4 rounded accent-blue-600" />
                <label htmlFor="is_active" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Active staff member
                </label>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? "Saving..." : editingId ? "Save Changes" : "Add Staff Member"}
                </button>
                <button onClick={() => setShowForm(false)} className="btn-ghost flex-1">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}