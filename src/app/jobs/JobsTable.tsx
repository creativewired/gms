"use client";

import { useState } from "react";

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

export default function JobsTable({ jobs }: { jobs: Job[] }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = jobs.filter((j) => {
    const matchesStatus = filter === "all" || j.status === filter;
    const matchesSearch =
      (j.vehicles?.plate_number ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (j.problem_description ?? "").toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
  };

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
        placeholder="Search by plate number or problem..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-slate-300 rounded-md px-4 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-slate-400"
      />

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-4">
        {filterButtons.map((btn) => (
          <button
            key={btn.value}
            onClick={() => setFilter(btn.value)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
              filter === btn.value
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Job #</th>
              <th className="px-4 py-3 text-left font-medium">Vehicle</th>
              <th className="px-4 py-3 text-left font-medium">Problem</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Total (AED)</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((j) => (
                <tr key={j.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <a href={`/jobs/${j.id}`} className="font-mono text-blue-600 hover:underline">
                      #{j.id}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold">{j.vehicles?.plate_number}</span>
                    <span className="text-slate-400 text-xs ml-1">
                      {j.vehicles?.make} {j.vehicles?.model}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                    {j.problem_description ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[j.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {j.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{Number(j.total_amount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(j.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
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
