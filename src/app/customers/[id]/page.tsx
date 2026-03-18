import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import EditCustomerForm from "./EditCustomerForm";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [{ data: customer }, { data: vehicles }] = await Promise.all([
    supabase.from("customers").select("*").eq("id", id).single(),
    supabase
      .from("vehicles")
      .select("*, jobs(id, problem_description, status, total_amount, mechanic_name, created_at)")
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!customer) return <p className="text-red-500">Customer not found.</p>;

  const allJobs = (vehicles ?? []).flatMap(v => v.jobs ?? []);
  const totalSpent = allJobs.reduce((sum, j) => sum + Number(j.total_amount), 0);
  const totalJobs = allJobs.length;

  const statusColors: Record<string, string> = {
    pending:     "bg-yellow-100 text-yellow-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed:   "bg-green-100 text-green-700",
  };

  return (
    <div className="space-y-5 max-w-5xl">

      {/* Back */}
      <a href="/customers" className="text-sm text-slate-500 hover:underline block">
        ← Back to Customers
      </a>

      {/* Customer Header */}
      <div className="card p-5">
        {/* Name + contact */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">{customer.name}</h1>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500">
              {customer.phone && <span>📞 {customer.phone}</span>}
              {customer.email && <span>✉️ {customer.email}</span>}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Customer since {new Date(customer.created_at).toLocaleDateString("en-AE", {
                year: "numeric", month: "long", day: "numeric"
              })}
            </p>
          </div>

          {/* Quick Stats — wraps to row below name on mobile */}
          <div className="flex gap-3 flex-wrap sm:flex-nowrap">
            <div className="text-center rounded-xl px-4 py-3 flex-1 sm:flex-none"
              style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <p className="text-xl font-bold text-slate-800">{vehicles?.length ?? 0}</p>
              <p className="text-xs text-slate-400 mt-0.5">Vehicles</p>
            </div>
            <div className="text-center rounded-xl px-4 py-3 flex-1 sm:flex-none"
              style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <p className="text-xl font-bold text-slate-800">{totalJobs}</p>
              <p className="text-xs text-slate-400 mt-0.5">Jobs</p>
            </div>
            <div className="text-center rounded-xl px-4 py-3 flex-1 sm:flex-none"
              style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <p className="text-lg sm:text-xl font-bold text-emerald-700">
                AED {totalSpent.toFixed(0)}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Total Spent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div>
        <h2 className="font-semibold text-slate-700 mb-3 text-sm">Edit Details</h2>
        <EditCustomerForm customer={customer} />
      </div>

      {/* Vehicles & Job History */}
      <div>
        <h2 className="font-semibold text-slate-700 mb-3 text-sm">🚗 Vehicles & Repair History</h2>

        {vehicles && vehicles.length > 0 ? (
          <div className="space-y-4">
            {vehicles.map(vehicle => (
              <div key={vehicle.id} className="card overflow-hidden">

                {/* Vehicle Header */}
                <div className="px-5 py-3 flex items-center justify-between"
                  style={{ background: "#fafafa", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🚗</span>
                    <div>
                      <p className="font-bold text-slate-800 font-mono text-sm">{vehicle.plate_number}</p>
                      <p className="text-xs text-slate-500">{vehicle.make} {vehicle.model} {vehicle.year ?? ""}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">
                    {vehicle.jobs?.length ?? 0} job{(vehicle.jobs?.length ?? 0) !== 1 ? "s" : ""}
                  </span>
                </div>

                {vehicle.jobs && vehicle.jobs.length > 0 ? (
                  <>
                    {/* Mobile stacked job list */}
                    <div className="md:hidden divide-y divide-slate-50">
                      {vehicle.jobs.map((job: any) => (
                        <div key={job.id} className="px-4 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <a href={`/jobs/${job.id}`}
                                  className="font-mono text-xs text-blue-600 hover:underline">
                                  #{String(job.id).padStart(4, "0")}
                                </a>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[job.status] ?? "bg-slate-100 text-slate-600"}`}>
                                  {job.status.replace("_", " ")}
                                </span>
                              </div>
                              <p className="text-sm text-slate-600 truncate">
                                {job.problem_description ?? "—"}
                              </p>
                              {job.mechanic_name && (
                                <p className="text-xs text-slate-400 mt-0.5">{job.mechanic_name}</p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-semibold text-slate-800">
                                AED {Number(job.total_amount).toFixed(2)}
                              </p>
                              <p className="text-xs text-slate-400">
                                {new Date(job.created_at).toLocaleDateString("en-AE", { month: "short", day: "numeric" })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop table */}
                    <table className="hidden md:table min-w-full text-sm">
                      <thead className="border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Job #</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Problem</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Mechanic</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Status</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Total</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vehicle.jobs.map((job: any) => (
                          <tr key={job.id} className="border-t border-slate-50 hover:bg-slate-50 transition">
                            <td className="px-4 py-3">
                              <a href={`/jobs/${job.id}`}
                                className="font-mono text-blue-600 hover:underline text-xs">
                                #{String(job.id).padStart(4, "0")}
                              </a>
                            </td>
                            <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                              {job.problem_description ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-xs">{job.mechanic_name ?? "—"}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[job.status] ?? "bg-slate-100 text-slate-600"}`}>
                                {job.status.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-medium">AED {Number(job.total_amount).toFixed(2)}</td>
                            <td className="px-4 py-3 text-slate-400 text-xs">
                              {new Date(job.created_at).toLocaleDateString("en-AE", { month: "short", day: "numeric", year: "numeric" })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                ) : (
                  <p className="px-5 py-4 text-sm text-slate-400">No jobs for this vehicle yet.</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center text-slate-400 text-sm">
            No vehicles registered for this customer yet.
          </div>
        )}
      </div>
    </div>
  );
}