"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Mechanic = { id: number; name: string };
type Job = { id: number; vehicles: { plate_number: string; make: string | null; model: string | null } | null };
type Clock = {
  id: number;
  mechanic_id: number;
  mechanic_name: string;
  job_id: number | null;
  clock_in: string;
  clock_out: string | null;
  duration_minutes: number | null;
  notes: string | null;
  jobs: { id: number; vehicles: { plate_number: string; make: string | null; model: string | null } | null } | null;
};

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function LiveTimer({ clockIn }: { clockIn: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const calc = () => {
      const diff = Math.floor((Date.now() - new Date(clockIn).getTime()) / 1000);
      setElapsed(diff);
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [clockIn]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;

  return (
    <span className="font-mono font-bold" style={{ color: "#15803d", fontSize: "1.1rem" }}>
      {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

export default function TimeClockBoard({
  mechanics,
  jobs,
  activeClocks,
  recentClocks,
  todayHours,
}: {
  mechanics: Mechanic[];
  jobs: Job[];
  activeClocks: Clock[];
  recentClocks: Clock[];
  todayHours: Record<string, number>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<number | null>(null);
  const [showClockIn, setShowClockIn] = useState(false);
  const [form, setForm] = useState({
    mechanic_id: "",
    job_id: "",
    notes: "",
  });

  const activeMechanicIds = activeClocks.map((c) => c.mechanic_id);
  const availableMechanics = mechanics.filter(
    (m) => !activeMechanicIds.includes(m.id)
  );

  const handleClockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.mechanic_id) return alert("Select a mechanic!");

    const mechanic = mechanics.find((m) => m.id === Number(form.mechanic_id));
    if (!mechanic) return;

    const savedBranch = localStorage.getItem("workshopos_branch");
    const branchId = savedBranch ? JSON.parse(savedBranch).id : null;

    setLoading(-1);
    const { error } = await supabase.from("time_clocks").insert([{
      mechanic_id: mechanic.id,
      mechanic_name: mechanic.name,
      job_id: form.job_id ? Number(form.job_id) : null,
      notes: form.notes || null,
      branch_id: branchId,
      clock_in: new Date().toISOString(),
    }]);

    setLoading(null);
    if (error) {
      alert("Error: " + error.message);
    } else {
      setForm({ mechanic_id: "", job_id: "", notes: "" });
      setShowClockIn(false);
      router.refresh();
    }
  };

  const handleClockOut = async (clockId: number) => {
    setLoading(clockId);
    const clock = activeClocks.find((c) => c.id === clockId);
    if (!clock) return;

    const clockOutTime = new Date();
    const clockInTime = new Date(clock.clock_in);
    const durationMinutes = Math.round(
      (clockOutTime.getTime() - clockInTime.getTime()) / 60000
    );

    const { error } = await supabase
      .from("time_clocks")
      .update({
        clock_out: clockOutTime.toISOString(),
        duration_minutes: durationMinutes,
      })
      .eq("id", clockId);

    setLoading(null);
    if (error) {
      alert("Error: " + error.message);
    } else {
      router.refresh();
    }
  };

  const completedToday = recentClocks.filter((c) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return c.clock_out && new Date(c.clock_in) >= today;
  });

  return (
    <div className="space-y-6">

      {/* Active Clocks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="section-title" style={{ marginBottom: 0 }}>
            Currently Clocked In
          </p>
          <button onClick={() => setShowClockIn(true)} className="btn-primary">
            + Clock In
          </button>
        </div>

        {activeClocks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeClocks.map((c) => (
              <div key={c.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                        style={{ background: "#15803d" }}>
                        {c.mechanic_name.charAt(0)}
                      </div>
                      {/* Live pulse */}
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white">
                        <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{c.mechanic_name}</p>
                      <p className="text-xs text-slate-400">
                        {c.jobs?.vehicles?.plate_number
                          ? `Job: ${c.jobs.vehicles.plate_number}`
                          : "No job assigned"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Live Timer */}
                <div className="rounded-xl p-3 mb-3 text-center"
                  style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                  <p className="text-xs text-slate-400 mb-1">Time Elapsed</p>
                  <LiveTimer clockIn={c.clock_in} />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                  <span>Clocked in at</span>
                  <span className="font-mono font-semibold text-slate-600">
                    {new Date(c.clock_in).toLocaleTimeString("en-AE", {
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>

                {c.notes && (
                  <p className="text-xs text-slate-400 mb-3 italic">"{c.notes}"</p>
                )}

                <button
                  onClick={() => handleClockOut(c.id)}
                  disabled={loading === c.id}
                  className="w-full py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: loading === c.id ? "#f2f2f7" : "#fff1f0",
                    color: loading === c.id ? "#8e8e93" : "#dc2626",
                    border: "1.5px solid",
                    borderColor: loading === c.id ? "#e8e8ed" : "#fecaca",
                  }}
                >
                  {loading === c.id ? "Clocking out..." : "Clock Out"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-10 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "#f2f2f7" }}>
              <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor"
                strokeWidth={1.5} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <p className="text-slate-300 text-sm font-medium">No one is clocked in right now</p>
            <button onClick={() => setShowClockIn(true)}
              className="text-xs text-slate-400 hover:text-slate-700 transition-colors mt-2">
              Clock in a mechanic →
            </button>
          </div>
        )}
      </div>

      {/* Mechanic Hours Today */}
      {Object.keys(todayHours).length > 0 && (
        <div>
          <p className="section-title">Hours Logged Today</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(todayHours)
              .sort((a, b) => b[1] - a[1])
              .map(([name, minutes]) => (
                <div key={name} className="card p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: "#3b82f6" }}>
                    {name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 truncate">{name}</p>
                    <p className="text-xs font-bold mt-0.5" style={{ color: "#1d4ed8" }}>
                      {formatDuration(minutes)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recent Sessions Table */}
      <div>
        <p className="section-title">Recent Sessions</p>
        <div className="card overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="table-header">Mechanic</th>
                <th className="table-header">Job / Vehicle</th>
                <th className="table-header">Clock In</th>
                <th className="table-header">Clock Out</th>
                <th className="table-header">Duration</th>
                <th className="table-header">Notes</th>
              </tr>
            </thead>
            <tbody>
              {recentClocks.length > 0 ? (
                recentClocks.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: c.clock_out ? "#3b82f6" : "#15803d" }}>
                          {c.mechanic_name.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-800 text-sm">
                          {c.mechanic_name}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell text-slate-500 text-sm">
                      {c.jobs?.vehicles?.plate_number
                        ? `${c.jobs.vehicles.plate_number} · ${c.jobs.vehicles.make ?? ""} ${c.jobs.vehicles.model ?? ""}`
                        : "—"}
                    </td>
                    <td className="table-cell font-mono text-xs text-slate-600">
                      {new Date(c.clock_in).toLocaleString("en-AE", {
                        month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="table-cell font-mono text-xs text-slate-600">
                      {c.clock_out
                        ? new Date(c.clock_out).toLocaleString("en-AE", {
                            month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })
                        : (
                          <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Active
                          </span>
                        )}
                    </td>
                    <td className="table-cell">
                      {c.duration_minutes ? (
                        <span className="badge-completed">
                          {formatDuration(c.duration_minutes)}
                        </span>
                      ) : (
                        <span className="badge-progress">In progress</span>
                      )}
                    </td>
                    <td className="table-cell text-slate-400 text-xs italic">
                      {c.notes ?? "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="table-cell text-center py-12 text-slate-300 text-sm">
                    No time clock sessions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clock In Modal */}
      {showClockIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-semibold text-slate-800">Clock In Mechanic</h3>
              <button onClick={() => setShowClockIn(false)} className="btn-ghost text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleClockIn} className="space-y-4">
              <div>
                <label className="label">Mechanic <span className="text-red-400">*</span></label>
                <select
                  value={form.mechanic_id}
                  onChange={(e) => setForm({ ...form, mechanic_id: e.target.value })}
                  className="input"
                >
                  <option value="">Select mechanic...</option>
                  {availableMechanics.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                {availableMechanics.length === 0 && (
                  <p className="text-xs text-amber-500 mt-1">All mechanics are currently clocked in.</p>
                )}
              </div>
              <div>
                <label className="label">Assign to Job (optional)</label>
                <select
                  value={form.job_id}
                  onChange={(e) => setForm({ ...form, job_id: e.target.value })}
                  className="input"
                >
                  <option value="">No specific job</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      #{String(j.id).padStart(4, "0")} — {j.vehicles?.plate_number}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Notes (optional)</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. Starting brake job"
                  className="input"
                />
              </div>

              {/* Current time display */}
              <div className="rounded-xl p-3 text-center"
                style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <p className="text-xs text-slate-400 mb-1">Clock In Time</p>
                <p className="font-mono font-bold text-emerald-700">
                  {new Date().toLocaleTimeString("en-AE", {
                    hour: "2-digit", minute: "2-digit", second: "2-digit",
                  })}
                </p>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={loading === -1} className="btn-primary">
                  {loading === -1 ? "Clocking in..." : "Clock In Now"}
                </button>
                <button type="button" onClick={() => setShowClockIn(false)} className="btn-ghost">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
