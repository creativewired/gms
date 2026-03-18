"use client";

import { useState } from "react";
import Link from "next/link";

type Job = {
  id: number;
  status: string;
  problem_description: string | null;
  total_amount: number;
  created_at: string;
  vehicles: {
    plate_number: string;
    make: string | null;
    model: string | null;
    mechanic_name: string | null;
  } | null;
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  pending:     { bg: "#fffbeb", color: "#92400e" },
  in_progress: { bg: "#eff6ff", color: "#1e40af" },
  completed:   { bg: "#f0fdf4", color: "#14532d" },
};

export default function JobsTable({ jobs }: { jobs: Job[] }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = jobs.filter(j => {
    const matchesStatus = filter === "all" || j.status === filter;
    const matchesSearch =
      (j.vehicles?.plate_number ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (j.problem_description ?? "").toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filterButtons = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "In Progress", value: "in_progress" },
    { label: "Completed", value: "completed" },
  ];

  return (
    <div>
      {/* Search */}
      <input
        type="text"
        placeholder="Search by plate or problem..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="input w-full mb-3"
      />

      {/* Filter pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {filterButtons.map(btn => (
          <button key={btn.value} onClick={() => setFilter(btn.value)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all"
            style={{
              background: filter === btn.value ? "#1c1c1e" : "#f2f2f7",
              color: filter === btn.value ? "white" : "#6b7280",
            }}>
            {btn.label}
          </button>
        ))}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {filtered.length > 0 ? filtered.map(j => {
          const s = STATUS_STYLES[j.status] ?? { bg: "#f2f2f7", color: "#6b7280" };
          return (
            <Link key={j.id} href={`/jobs/${j.id}`}
              className="block bg-white rounded-xl p-4 transition-all hover:shadow-md"
              style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-slate-900">{j.vehicles?.plate_number ?? "—"}</p>
                  <p className="text-xs text-slate-400">{j.vehicles?.make} {j.vehicles?.model}</p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full"
                  style={{ background: s.bg, color: s.color }}>
                  {j.status.replace("_", " ")}
                </span>
              </div>
              {j.problem_description && (
                <p className="text-xs text-slate-500 truncate mb-2">{j.problem_description}</p>
              )}
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-mono text-slate-400">#{String(j.id).padStart(4, "0")}</span>
                <span className="text-sm font-bold text-slate-800">
                  AED {Number(j.total_amount).toFixed(2)}
                </span>
              </div>
            </Link>
          );
        }) : (
          <p className="text-center py-10 text-slate-300 text-sm">No jobs found.</p>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-slate-100 bg-white">
        <table className="min-w-full text-sm">
          <thead style={{ background: "#fafafa" }}>
            <tr>
              <th className="table-header">Job #</th>
              <th className="table-header">Vehicle</th>
              <th className="table-header">Problem</th>
              <th className="table-header">Status</th>
              <th className="table-header">Total (AED)</th>
              <th className="table-header">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map(j => {
              const s = STATUS_STYLES[j.status] ?? { bg: "#f2f2f7", color: "#6b7280" };
              return (
                <tr key={j.id} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                  <td className="table-cell">
                    <Link href={`/jobs/${j.id}`} className="font-mono text-xs text-slate-400 hover:text-slate-900 transition-colors">
                      #{String(j.id).padStart(4, "0")}
                    </Link>
                  </td>
                  <td className="table-cell">
                    <p className="font-semibold text-slate-900">{j.vehicles?.plate_number}</p>
                    <p className="text-slate-400 text-xs">{j.vehicles?.make} {j.vehicles?.model}</p>
                  </td>
                  <td className="table-cell text-slate-500 max-w-xs truncate">
                    {j.problem_description ?? "—"}
                  </td>
                  <td className="table-cell">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full"
                      style={{ background: s.bg, color: s.color }}>
                      {j.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="table-cell font-semibold text-slate-800">
                    {Number(j.total_amount).toFixed(2)}
                  </td>
                  <td className="table-cell text-slate-400 text-xs">
                    {new Date(j.created_at).toLocaleDateString("en-AE", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={6} className="table-cell text-center py-12 text-slate-300 text-sm">
                  No jobs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}