"use client";

import { useState } from "react";
import Link from "next/link";

type Customer = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
};

export default function CustomersTable({ customers }: { customers: Customer[] }) {
  const [search, setSearch] = useState("");

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? "").includes(search) ||
    (c.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <input type="text" placeholder="Search by name, phone or email..."
        value={search} onChange={e => setSearch(e.target.value)}
        className="input mb-4" />

      {/* Mobile card list */}
      <div className="md:hidden divide-y divide-slate-50 card overflow-hidden">
        {filtered.length > 0 ? filtered.map(c => (
          <Link key={c.id} href={`/customers/${c.id}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60 transition-colors">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-slate-600 shrink-0"
              style={{ background: "#f2f2f7" }}>
              {c.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate">{c.name}</p>
              <p className="text-xs text-slate-400 truncate">{c.phone ?? c.email ?? "—"}</p>
            </div>
            <span className="text-xs text-slate-400 shrink-0">
              {new Date(c.created_at).toLocaleDateString("en-AE", { month: "short", day: "numeric" })}
            </span>
          </Link>
        )) : (
          <p className="px-4 py-10 text-center text-slate-400 text-sm">No customers found.</p>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-500 text-xs uppercase tracking-wide">Name</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 text-xs uppercase tracking-wide">Phone</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 text-xs uppercase tracking-wide">Email</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 text-xs uppercase tracking-wide">Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map(c => (
              <tr key={c.id} className="border-t hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">
                  <a href={`/customers/${c.id}`} className="text-blue-600 hover:underline">{c.name}</a>
                </td>
                <td className="px-4 py-3 text-slate-600">{c.phone ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{c.email ?? "—"}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {new Date(c.created_at).toLocaleDateString()}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">No customers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}