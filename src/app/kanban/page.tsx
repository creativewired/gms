import { supabase } from "@/lib/supabaseClient";
import KanbanBoard from "./KanbanBoard";

export default async function KanbanPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const { branch } = await searchParams;
  const branchId = branch ? Number(branch) : null;

  let query = supabase
    .from("jobs")
    .select(`
      id,
      status,
      total_amount,
      created_at,
      mechanic_name,
      vehicle_id,
      vehicles (
        plate_number,
        make,
        model,
        customers ( name )
      )
    `)
    .order("created_at", { ascending: false });

  if (branchId) query = query.eq("branch_id", branchId);

  const { data: jobs, error } = await query;

  const { data: branches } = await supabase
    .from("branches")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  // Flatten the nested customer name onto each job
  const flatJobs = (jobs ?? []).map((j: any) => ({
    ...j,
    customers: j.vehicles?.customers ?? null,
  }));

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <p className="section-title">Workshop</p>
          <h1 className="page-title">Job Board</h1>
        </div>
      </div>
      <KanbanBoard
        initialJobs={flatJobs}
        branches={branches ?? []}
        activeBranchId={branchId}
      />
    </div>
  );
}
