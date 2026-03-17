import { supabase } from "@/lib/supabaseClient";
import AIInsightsClient from "./AIInsightsClient";

export default async function AIInsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const { branch } = await searchParams;
  const branchId = branch ? Number(branch) : null;

  const { data: branches } = await supabase
    .from("branches")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="page-header">
        <div>
          <p className="section-title">Intelligence</p>
          <h1 className="page-title">AI Insights</h1>
        </div>
      </div>

      <AIInsightsClient branchId={branchId} branches={branches ?? []} />
    </div>
  );
}
