"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Job = {
  id: number;
  status: string;
  total_amount: number;
  created_at: string;
  mechanic_name: string | null;
  vehicles: { plate_number: string; make: string | null; model: string | null } | null;
  customers: { name: string } | null;
};

type Branch = { id: number; name: string };

const COLUMNS: { key: string; label: string; color: string; bg: string; border: string; dot: string }[] = [
  { key: "pending",     label: "Pending",     color: "#92400e", bg: "#fffbeb", border: "#fde68a", dot: "#f59e0b" },
  { key: "in_progress", label: "In Progress", color: "#1e40af", bg: "#eff6ff", border: "#bfdbfe", dot: "#3b82f6" },
  { key: "completed",   label: "Completed",   color: "#14532d", bg: "#f0fdf4", border: "#bbf7d0", dot: "#22c55e" },
  { key: "cancelled",   label: "Cancelled",   color: "#6b7280", bg: "#f8fafc", border: "#e2e8f0", dot: "#94a3b8" },
];

export default function KanbanBoard({
  initialJobs,
  branches,
  activeBranchId,
}: {
  initialJobs: Job[];
  branches: Branch[];
  activeBranchId: number | null;
}) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  // ── Drag handlers ─────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, jobId: number) => {
    setDragging(jobId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(columnKey);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOver(null);

    if (!dragging) return;
    const job = jobs.find(j => j.id === dragging);
    if (!job || job.status === newStatus) {
      setDragging(null);
      return;
    }

    // Optimistic update
    setJobs(prev => prev.map(j => j.id === dragging ? { ...j, status: newStatus } : j));
    setUpdating(dragging);
    setDragging(null);

    const { error } = await supabase
      .from("jobs")
      .update({ status: newStatus })
      .eq("id", job.id);

    setUpdating(null);

    if (error) {
      // Revert on error
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: job.status } : j));
      alert("Failed to update job status.");
    } else {
      startTransition(() => router.refresh());
    }
  };

  const handleDragEnd = () => {
    setDragging(null);
    setDragOver(null);
  };

  // ── Stats ─────────────────────────────────────────────────────
  const totalRevenue = jobs
    .filter(j => j.status === "completed")
    .reduce((s, j) => s + Number(j.total_amount), 0);

  return (
    <div className="space-y-6">

      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-4">
        {COLUMNS.map(col => {
          const colJobs = jobs.filter(j => j.status === col.key);
          const colRevenue = colJobs.reduce((s, j) => s + Number(j.total_amount), 0);
          return (
            <div key={col.key} className="stat-card"
              style={{ borderTop: `3px solid ${col.border}` }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ background: col.dot }} />
                <p className="label">{col.label}</p>
              </div>
              <p style={{ fontSize: "1.5rem", fontWeight: 700, color: col.color, letterSpacing: "-0.02em", lineHeight: 1 }}>
                {colJobs.length}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                AED {colRevenue.toLocaleString("en-AE", { minimumFractionDigits: 0 })}
              </p>
            </div>
          );
        })}
      </div>

      {/* Board */}
      <div className="grid grid-cols-4 gap-4 items-start">
        {COLUMNS.map(col => {
          const colJobs = jobs.filter(j => j.status === col.key);
          const isOver = dragOver === col.key;

          return (
            <div
              key={col.key}
              onDragOver={e => handleDragOver(e, col.key)}
              onDrop={e => handleDrop(e, col.key)}
              onDragLeave={() => setDragOver(null)}
              className="rounded-2xl transition-all"
              style={{
                background: isOver ? col.bg : "#f8fafc",
                border: `2px dashed ${isOver ? col.dot : "transparent"}`,
                minHeight: "480px",
                padding: "12px",
              }}
            >
              {/* Column header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.dot }} />
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {col.label}
                  </p>
                </div>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: col.bg, color: col.color, border: `1px solid ${col.border}` }}
                >
                  {colJobs.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {colJobs.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 opacity-40">
                    <svg className="w-8 h-8 text-slate-300 mb-2" fill="none" stroke="currentColor"
                      strokeWidth={1.5} viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="3" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                    <p className="text-xs text-slate-400">Drop jobs here</p>
                  </div>
                )}

                {colJobs.map(job => (
                  <div
                    key={job.id}
                    draggable
                    onDragStart={e => handleDragStart(e, job.id)}
                    onDragEnd={handleDragEnd}
                    className="bg-white rounded-xl shadow-sm transition-all select-none"
                    style={{
                      border: "1px solid rgba(0,0,0,0.06)",
                      opacity: dragging === job.id ? 0.4 : 1,
                      cursor: "grab",
                      transform: updating === job.id ? "scale(0.97)" : "scale(1)",
                      boxShadow: dragging === job.id
                        ? "0 8px 24px rgba(0,0,0,0.12)"
                        : "0 1px 4px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div className="p-3">

                      {/* Job ID + updating spinner */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-slate-400">
                          #{String(job.id).padStart(4, "0")}
                        </span>
                        {updating === job.id ? (
                          <svg className="w-3 h-3 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                        ) : (
                          <Link href={`/jobs/${job.id}`}
                            onClick={e => e.stopPropagation()}
                            className="text-xs text-slate-300 hover:text-slate-600 transition-colors">
                            →
                          </Link>
                        )}
                      </div>

                      {/* Vehicle */}
                      {job.vehicles && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                            style={{ background: col.bg }}>
                            <svg className="w-3 h-3" fill="none" stroke={col.dot} strokeWidth={2} viewBox="0 0 24 24">
                              <path d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h1l2-4h10l2 4h1a2 2 0 012 2v6a2 2 0 01-2 2h-2" />
                              <circle cx="7.5" cy="17.5" r="2.5" /><circle cx="16.5" cy="17.5" r="2.5" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold font-mono text-slate-800 truncate">
                              {job.vehicles.plate_number}
                            </p>
                            {(job.vehicles.make || job.vehicles.model) && (
                              <p className="text-xs text-slate-400 truncate">
                                {job.vehicles.make} {job.vehicles.model}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Customer */}
                      {job.customers?.name && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0"
                            style={{ background: "#94a3b8", fontSize: "0.5rem", fontWeight: 700 }}>
                            {job.customers.name.charAt(0)}
                          </div>
                          <p className="text-xs text-slate-500 truncate">{job.customers.name}</p>
                        </div>
                      )}

                      {/* Divider */}
                      <div style={{ borderTop: "1px solid rgba(0,0,0,0.05)", margin: "8px 0" }} />

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-800">
                          AED {Number(job.total_amount).toLocaleString("en-AE", { minimumFractionDigits: 0 })}
                        </p>
                        {job.mechanic_name && (
                          <span className="text-xs text-slate-400 truncate max-w-[80px]">
                            {job.mechanic_name}
                          </span>
                        )}
                      </div>

                      {/* Date */}
                      <p className="text-xs text-slate-300 mt-1">
                        {new Date(job.created_at).toLocaleDateString("en-AE", {
                          month: "short", day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completed revenue footer */}
      <div className="card px-6 py-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Total completed revenue across <span className="font-semibold text-slate-700">{jobs.filter(j => j.status === "completed").length} jobs</span>
        </p>
        <p className="text-base font-bold text-emerald-600">
          AED {totalRevenue.toLocaleString("en-AE", { minimumFractionDigits: 0 })}
        </p>
      </div>
    </div>
  );
}
