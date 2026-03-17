import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import AddCustomerForm from "./AddCustomerForm";

export default async function CustomersPage() {
  const { data: customers } = await supabase
    .from("customers")
    .select("*, vehicles(count)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="page-header">
        <div>
          <p className="section-title">Directory</p>
          <h1 className="page-title">Customers</h1>
        </div>
        <AddCustomerForm />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Customers", value: customers?.length ?? 0 },
          { label: "Added This Month", value: customers?.filter(c =>
              new Date(c.created_at) > new Date(new Date().setDate(1))
            ).length ?? 0 },
          { label: "With Vehicles", value: customers?.filter(c =>
              (c.vehicles as any)?.[0]?.count > 0
            ).length ?? 0 },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <p className="label">{s.label}</p>
            <p style={{ fontSize: "2.25rem", fontWeight: 700, color: "#1c1c1e", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", background: "#fafafa" }}>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">All Customers</p>
        </div>
        <table className="min-w-full">
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
            {customers && customers.length > 0 ? (
              customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-slate-600"
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
              ))
            ) : (
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
