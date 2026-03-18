import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import AddCustomerForm from "./AddCustomerForm";
import CustomersTable from "./CustomersTable";

export default async function CustomersPage() {
  const { data: customers } = await supabase
    .from("customers")
    .select("*, vehicles(count)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="page-header">
        <div>
          <p className="section-title">Directory</p>
          <h1 className="page-title">Customers</h1>
        </div>
        <AddCustomerForm />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: customers?.length ?? 0 },
          {
            label: "This Month",
            value: customers?.filter(c =>
              new Date(c.created_at) > new Date(new Date().setDate(1))
            ).length ?? 0,
          },
          {
            label: "With Vehicles",
            value: customers?.filter(c =>
              (c.vehicles as any)?.[0]?.count > 0
            ).length ?? 0,
          },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <p className="label text-xs">{s.label}</p>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "#1c1c1e", letterSpacing: "-0.03em", lineHeight: 1.1, marginTop: "0.25rem" }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", background: "#fafafa" }}>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">All Customers</p>
          <p className="text-xs text-slate-400">{customers?.length ?? 0} total</p>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden divide-y divide-slate-50">
          {customers && customers.length > 0 ? customers.map(c => (
            <Link key={c.id} href={`/customers/${c.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60 transition-colors">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-slate-600 shrink-0"
                style={{ background: "#f2f2f7" }}>
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 truncate">{c.name}</p>
                <p className="text-xs text-slate-400">{c.phone ?? c.email ?? "—"}</p>
              </div>
              <span className="text-xs text-slate-400 shrink-0">
                {new Date(c.created_at).toLocaleDateString("en-AE", { month: "short", day: "numeric" })}
              </span>
            </Link>
          )) : (
            <p className="text-center py-12 text-slate-300 text-sm">No customers yet.</p>
          )}
        </div>

        {/* Desktop table */}
        <table className="hidden md:table min-w-full">
          <thead>
            <tr>
              <th className="table-header">Name</th>
              <th className="table-header">Phone</th>
              <th className="table-header">Email</th>
              <th className="table-header">Joined</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers && customers.length > 0 ? customers.map(c => (
              <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="table-cell">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-slate-600 shrink-0"
                      style={{ background: "#f2f2f7" }}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-900">{c.name}</span>
                  </div>
                </td>
                <td className="table-cell text-slate-500">{c.phone ?? "—"}</td>
                <td className="table-cell text-slate-500">{c.email ?? "—"}</td>
                <td className="table-cell text-slate-400 text-xs">
                  {new Date(c.created_at).toLocaleDateString("en-AE", { year: "numeric", month: "short", day: "numeric" })}
                </td>
                <td className="table-cell">
                  <Link href={`/customers/${c.id}`}
                    className="text-xs font-medium text-slate-400 hover:text-slate-900 transition-colors">
                    View →
                  </Link>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="table-cell text-center text-slate-300 py-16">
                  No customers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}