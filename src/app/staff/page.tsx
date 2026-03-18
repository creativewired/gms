import { supabase } from "@/lib/supabaseClient";
import StaffClient from "./StaffClient";

export default async function StaffPage() {
  const { data: staff } = await supabase
    .from("staff")
    .select("*, branches(name)")
    .order("name");

  const { data: branches } = await supabase
    .from("branches")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  const { data: jobs } = await supabase
    .from("jobs")
    .select("mechanic_name, status, total_amount");

  const staffStats: Record<string, { jobs: number; revenue: number; completed: number }> = {};
  (jobs ?? []).forEach(j => {
    if (j.mechanic_name) {
      if (!staffStats[j.mechanic_name])
        staffStats[j.mechanic_name] = { jobs: 0, revenue: 0, completed: 0 };
      staffStats[j.mechanic_name].jobs += 1;
      staffStats[j.mechanic_name].revenue += Number(j.total_amount);
      if (j.status === "completed") staffStats[j.mechanic_name].completed += 1;
    }
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="page-header">
        <div>
          <p className="section-title">People</p>
          <h1 className="page-title">Staff</h1>
        </div>
      </div>
      <StaffClient
        initialStaff={staff ?? []}
        branches={branches ?? []}
        staffStats={staffStats}
      />
    </div>
  );
}