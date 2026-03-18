import { supabase } from "@/lib/supabaseClient";
import TimeClockBoard from "./TimeClockBoard";

export default async function TimeClockPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const { branch } = await searchParams;
  const branchId = branch ? Number(branch) : null;

  let mechanicsQuery = supabase.from("mechanics").select("id, name").order("name");
  if (branchId) mechanicsQuery = mechanicsQuery.eq("branch_id", branchId);

  let jobsQuery = supabase
    .from("jobs")
    .select("id, vehicles(plate_number, make, model)")
    .in("status", ["pending", "in_progress"])
    .order("created_at", { ascending: false });
  if (branchId) jobsQuery = jobsQuery.eq("branch_id", branchId);

  let clocksQuery = supabase
    .from("time_clocks")
    .select("*, mechanics(name), jobs(id, vehicles(plate_number, make, model))")
    .order("clock_in", { ascending: false })
    .limit(100);
  if (branchId) clocksQuery = clocksQuery.eq("branch_id", branchId);

  const [
    { data: mechanics },
    { data: jobs },
    { data: clocks },
  ] = await Promise.all([mechanicsQuery, jobsQuery, clocksQuery]);

  const activeClocks = (clocks ?? []).filter((c) => !c.clock_out);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayClocks = (clocks ?? []).filter(
    (c) => c.clock_out && new Date(c.clock_in) >= todayStart
  );

  const todayHours: Record<string, number> = {};
  todayClocks.forEach((c) => {
    if (c.duration_minutes) {
      todayHours[c.mechanic_name] =
        (todayHours[c.mechanic_name] ?? 0) + c.duration_minutes;
    }
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="page-header">
        <div>
          <p className="section-title">Workshop</p>
          <h1 className="page-title">Time Clock</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Clocked In",
            value: activeClocks.length,
            color: "#15803d", border: "#bbf7d0",
          },
          {
            label: "Sessions Today",
            value: todayClocks.length,
            color: "#1d4ed8", border: "#bfdbfe",
          },
          {
            label: "Hours Today",
            value: `${(
              Object.values(todayHours).reduce((s, m) => s + m, 0) / 60
            ).toFixed(1)}h`,
            color: "#7c3aed", border: "#ddd6fe",
          },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.border}` }}>
            <p className="label text-xs">{s.label}</p>
            <p style={{
              fontSize: "1.4rem", fontWeight: 700,
              color: s.color, letterSpacing: "-0.03em",
              lineHeight: 1.1, marginTop: "0.375rem",
            }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <TimeClockBoard
        mechanics={mechanics ?? []}
        jobs={(jobs ?? []) as any}
        activeClocks={activeClocks}
        recentClocks={clocks ?? []}
        todayHours={todayHours}
      />
    </div>
  );
}