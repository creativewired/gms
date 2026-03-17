import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import AddJobForm from "./AddJobForm";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const { branch } = await searchParams;
  const branchId = branch ? Number(branch) : null;

  let jobsQuery = supabase
    .from("jobs")
    .select("*, vehicles(plate_number, make, model, customers(name))")
    .order("created_at", { ascending: false });

  if (branchId) {
    jobsQuery = jobsQuery.eq("branch_id", branchId);
  }

  const { data: jobs } = await jobsQuery;

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, plate_number, make, model, customer_id, customers(name)")
    .order("plate_number");

  const { data: mechanics } = await supabase
    .from("mechanics")
    .select("id, name")
    .order("name");

  const pending = jobs?.filter((j) => j.status === "pending").length ?? 0;
  const inProgress = jobs?.filter((j) => j.status === "in_progress").length ?? 0;
  const completed = jobs?.filter((j) => j.status === "completed").length ?? 0;
  const totalRevenue = jobs?.reduce((sum, j) => sum + Number(j.total_amount), 0) ?? 0;

  const statusBadge = (status: string) => {
    if (status === "pending") return <span className="badge-pending">Pending</span>;
    if (status === "in_progress") return <span className="badge-progress">In Progress</span>;
    if (status === "completed") return <span className="badge-completed">Completed</span>;
    return <span className="badge-draft">{status}</span>;
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="page-header">
        <div>
          <p className="section-title">Workshop</p>
          <h1 className="page-title">Jobs</h1>
        </div>
<AddJobForm vehicles={(vehicles ?? []) as any} mechanics={mechanics ?? []} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Total Revenue",
            value: `AED ${totalRevenue.toLocaleString("en-AE", { minimumFractionDigits: 0 })}`,
            color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe",
          },
          {
            label: "Pending",
            value: pending,
            color: "#b45309", bg: "#fffbeb", border: "#fde68a",
          },
          {
            label: "In Progress",
            value: inProgress,
            color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe",
          },
          {
            label: "Completed",
            value: completed,
            color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0",
          },
        ].map((s) => (
          <div key={s.label} className="stat-card"
            style={{ borderTop: `3px solid ${s.border}` }}>
            <p className="label">{s.label}</p>
            <p style={{
              fontSize: "1.75rem", fontWeight: 700,
              color: s.color, letterSpacing: "-0.03em", lineHeight: 1.1,
              marginTop: "0.375rem",
            }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", background: "#fafafa" }}>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            All Jobs {branchId ? `— Filtered by Branch` : "— All Branches"}
          </p>
          <p className="text-xs text-slate-400">{jobs?.length ?? 0} total</p>
        </div>
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="table-header">Job #</th>
              <th className="table-header">Vehicle</th>
              <th className="table-header">Customer</th>
              <th className="table-header">Mechanic</th>
              <th className="table-header">Status</th>
              <th className="table-header">Total</th>
              <th className="table-header">Date</th>
              <th className="table-header"></th>
            </tr>
          </thead>
          <tbody>
            {jobs && jobs.length > 0 ? (
              jobs.map((j) => (
                <tr key={j.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="table-cell">
                    <span className="font-mono text-slate-400 text-xs">
                      #{String(j.id).padStart(4, "0")}
                    </span>
                  </td>
                  <td className="table-cell">
                    <p className="font-semibold text-slate-900">{j.vehicles?.plate_number}</p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {j.vehicles?.make} {j.vehicles?.model}
                    </p>
                  </td>
                  <td className="table-cell text-slate-600">
                    {j.vehicles?.customers?.name ?? "—"}
                  </td>
                  <td className="table-cell text-slate-500">
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
                    <Link
                      href={`/jobs/${j.id}`}
                      className="text-xs font-medium text-slate-400 hover:text-slate-900 transition-colors"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="table-cell text-center py-16">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ background: "#f2f2f7" }}>
                      <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor"
                        strokeWidth={1.5} viewBox="0 0 24 24">
                        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
                      </svg>
                    </div>
                    <p className="text-slate-300 text-sm">No jobs yet.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
