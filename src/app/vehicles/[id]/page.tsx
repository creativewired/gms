import { supabase } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("*, customers(id, name, phone, email)")
    .eq("id", id)
    .single();

  if (!vehicle) notFound();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, status, total_amount, created_at, mechanic_name")
    .eq("vehicle_id", id)
    .order("created_at", { ascending: false });

  const totalSpent = (jobs ?? []).reduce((sum, j) => sum + Number(j.total_amount), 0);
  const completedJobs = (jobs ?? []).filter((j) => j.status === "completed").length;

  const statusBadge = (status: string) => {
    if (status === "pending") return <span className="badge-pending">Pending</span>;
    if (status === "in_progress") return <span className="badge-progress">In Progress</span>;
    if (status === "completed") return <span className="badge-completed">Completed</span>;
    return <span className="badge-draft">{status}</span>;
  };

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div>
        <Link href="/vehicles"
          className="text-xs text-slate-400 hover:text-slate-700 transition-colors mb-2 block">
          ← Back to Vehicles
        </Link>
        <div className="page-header">
          <div>
            <p className="section-title">Vehicle Profile</p>
            <h1 className="page-title font-mono tracking-wider">
              {vehicle.plate_number}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {vehicle.make} {vehicle.model} {vehicle.year ? `· ${vehicle.year}` : ""}
            </p>
          </div>
          {vehicle.color && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: "#f2f2f7" }}>
              <div className="w-4 h-4 rounded-full border border-slate-200"
                style={{
                  background: vehicle.color.toLowerCase() === "white" ? "#f8fafc"
                    : vehicle.color.toLowerCase() === "black" ? "#1c1c1e"
                    : vehicle.color.toLowerCase() === "silver" ? "#c0c0c0"
                    : vehicle.color.toLowerCase() === "red" ? "#ef4444"
                    : vehicle.color.toLowerCase() === "blue" ? "#3b82f6"
                    : "#e2e8f0",
                }} />
              <span className="text-sm font-medium text-slate-600">{vehicle.color}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">

        {/* Left col */}
        <div className="col-span-2 space-y-5">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Jobs", value: jobs?.length ?? 0, color: "#1d4ed8", border: "#bfdbfe" },
              { label: "Completed", value: completedJobs, color: "#15803d", border: "#bbf7d0" },
              { label: "Total Spent", value: `AED ${totalSpent.toLocaleString("en-AE", { minimumFractionDigits: 0 })}`, color: "#7c3aed", border: "#ddd6fe" },
            ].map((s) => (
              <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.border}` }}>
                <p className="label">{s.label}</p>
                <p style={{
                  fontSize: "1.4rem", fontWeight: 700,
                  color: s.color, letterSpacing: "-0.02em",
                  lineHeight: 1.1, marginTop: "0.25rem",
                }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* Technical Specs */}
          {(vehicle.vin || vehicle.engine || vehicle.transmission || vehicle.fuel_type || vehicle.mileage) && (
            <div className="card p-6">
              <p className="section-title">Technical Specs</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                {vehicle.vin && (
                  <div className="col-span-2 sm:col-span-3">
                    <p className="label">VIN</p>
                    <p className="font-mono text-sm font-semibold text-slate-700 tracking-widest mt-0.5">
                      {vehicle.vin}
                    </p>
                  </div>
                )}
                {vehicle.engine && (
                  <div>
                    <p className="label">Engine</p>
                    <p className="text-sm font-semibold text-slate-700 mt-0.5">{vehicle.engine}</p>
                  </div>
                )}
                {vehicle.transmission && (
                  <div>
                    <p className="label">Transmission</p>
                    <p className="text-sm font-semibold text-slate-700 mt-0.5">{vehicle.transmission}</p>
                  </div>
                )}
                {vehicle.fuel_type && (
                  <div>
                    <p className="label">Fuel Type</p>
                    <p className="text-sm font-semibold text-slate-700 mt-0.5">{vehicle.fuel_type}</p>
                  </div>
                )}
                {vehicle.mileage && (
                  <div>
                    <p className="label">Mileage</p>
                    <p className="text-sm font-semibold text-slate-700 mt-0.5">
                      {vehicle.mileage.toLocaleString()} km
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Job History */}
          <div>
            <p className="section-title">Service History</p>
            <div className="card overflow-hidden">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="table-header">Job #</th>
                    <th className="table-header">Mechanic</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Amount</th>
                    <th className="table-header">Date</th>
                    <th className="table-header"></th>
                  </tr>
                </thead>
                <tbody>
                  {jobs && jobs.length > 0 ? (
                    jobs.map((j) => (
                      <tr key={j.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="table-cell font-mono text-slate-400 text-xs">
                          #{String(j.id).padStart(4, "0")}
                        </td>
                        <td className="table-cell text-slate-600">
                          {j.mechanic_name ?? "—"}
                        </td>
                        <td className="table-cell">{statusBadge(j.status)}</td>
                        <td className="table-cell font-semibold text-slate-800">
                          AED {Number(j.total_amount).toFixed(2)}
                        </td>
                        <td className="table-cell text-slate-400 text-xs">
                          {new Date(j.created_at).toLocaleDateString("en-AE", {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                        </td>
                        <td className="table-cell">
                          <Link href={`/jobs/${j.id}`}
                            className="text-xs font-medium text-slate-400 hover:text-slate-900 transition-colors">
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="table-cell text-center py-12 text-slate-300 text-sm">
                        No jobs for this vehicle yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right col — Owner info */}
        <div className="space-y-4">
          <div className="card p-5">
            <p className="text-sm font-semibold text-slate-800 mb-4">Owner</p>
            {vehicle.customers ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ background: "#3b82f6" }}>
                    {vehicle.customers.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {vehicle.customers.name}
                    </p>
                    <Link href={`/customers/${vehicle.customers.id}`}
                      className="text-xs text-slate-400 hover:text-slate-700 transition-colors">
                      View profile →
                    </Link>
                  </div>
                </div>
                <hr style={{ border: "none", borderTop: "1px solid rgba(0,0,0,0.05)" }} />
                {vehicle.customers.phone && (
                  <div>
                    <p className="label">Phone</p>
                    <p className="text-sm text-slate-700">{vehicle.customers.phone}</p>
                  </div>
                )}
                {vehicle.customers.email && (
                  <div>
                    <p className="label">Email</p>
                    <p className="text-sm text-slate-700">{vehicle.customers.email}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No owner linked.</p>
            )}
          </div>

          {/* Quick Info */}
          <div className="card p-5">
            <p className="text-sm font-semibold text-slate-800 mb-4">Details</p>
            <div className="space-y-3">
              {[
                { label: "Plate", value: vehicle.plate_number },
                { label: "Make", value: vehicle.make ?? "—" },
                { label: "Model", value: vehicle.model ?? "—" },
                { label: "Year", value: vehicle.year ?? "—" },
                { label: "Color", value: vehicle.color ?? "—" },
                { label: "Mileage", value: vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : "—" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">{row.label}</p>
                  <p className="text-xs font-semibold text-slate-700">{row.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
