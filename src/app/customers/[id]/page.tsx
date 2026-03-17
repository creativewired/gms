import { supabase } from "@/lib/supabaseClient";
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

  const totalSpent = (vehicles ?? []).flatMap((v) => v.jobs ?? []).reduce(
    (sum, j) => sum + Number(j.total_amount), 0
  );

  const totalJobs = (vehicles ?? []).flatMap((v) => v.jobs ?? []).length;

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
  };

  return (
    <div className="space-y-6">
      {/* Back */}
      <a href="/customers" className="text-sm text-slate-500 hover:underline">
        ← Back to Customers
      </a>

      {/* Customer Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{customer.name}</h1>
            <div className="flex gap-4 mt-2 text-sm text-slate-500">
              {customer.phone && <span>📞 {customer.phone}</span>}
              {customer.email && <span>✉️ {customer.email}</span>}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Customer since {new Date(customer.created_at).toLocaleDateString("en-AE", {
                year: "numeric", month: "long", day: "numeric"
              })}
            </p>
          </div>
          {/* Quick Stats */}
          <div className="flex gap-4">
            <div className="text-center bg-slate-50 rounded-xl px-5 py-3 border border-slate-200">
              <p className="text-2xl font-bold text-slate-800">{vehicles?.length ?? 0}</p>
              <p className="text-xs text-slate-400 mt-0.5">Vehicles</p>
            </div>
            <div className="text-center bg-slate-50 rounded-xl px-5 py-3 border border-slate-200">
              <p className="text-2xl font-bold text-slate-800">{totalJobs}</p>
              <p className="text-xs text-slate-400 mt-0.5">Jobs</p>
            </div>
            <div className="text-center bg-emerald-50 rounded-xl px-5 py-3 border border-emerald-200">
              <p className="text-2xl font-bold text-emerald-700">
                AED {totalSpent.toFixed(0)}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Total Spent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div>
        <h2 className="font-semibold text-slate-700 mb-3">Edit Details</h2>
        <EditCustomerForm customer={customer} />
      </div>

      {/* Vehicles & Job History */}
      <div>
        <h2 className="font-semibold text-slate-700 mb-3">🚗 Vehicles & Repair History</h2>

        {vehicles && vehicles.length > 0 ? (
          <div className="space-y-4">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
              >
                {/* Vehicle Header */}
                <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🚗</span>
                    <div>
                      <p className="font-bold text-slate-800 font-mono">
                        {vehicle.plate_number}
                      </p>
                      <p className="text-xs text-slate-500">
                        {vehicle.make} {vehicle.model} {vehicle.year ?? ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">
                    {vehicle.jobs?.length ?? 0} job{(vehicle.jobs?.length ?? 0) !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Jobs for this vehicle */}
                {vehicle.jobs && vehicle.jobs.length > 0 ? (
                  <table className="min-w-full text-sm">
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
                            <a
                              href={`/jobs/${job.id}`}
                              className="font-mono text-blue-600 hover:underline text-xs"
                            >
                              #{job.id}
                            </a>
                          </td>
                          <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                            {job.problem_description ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {job.mechanic_name ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[job.status] ?? "bg-slate-100 text-slate-600"}`}>
                              {job.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-sm">
                            AED {Number(job.total_amount).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs">
                            {new Date(job.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="px-5 py-4 text-sm text-slate-400">
                    No jobs for this vehicle yet.
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-slate-400">
            No vehicles registered for this customer yet.
          </div>
        )}
      </div>
    </div>
  );
}
