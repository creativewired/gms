import { supabase } from "@/lib/supabaseClient";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();

  const [
    { data: allJobs },
    { data: monthJobs },
    { data: lastMonthJobs },
    { data: weekJobs },
    { data: customers },
    { data: vehicles },
    { data: appointments },
    { data: inventory },
    { data: staff },
    { data: recentJobs },
  ] = await Promise.all([
    supabase.from("jobs").select("id, status, total_amount, created_at, mechanic_name"),
    supabase.from("jobs").select("id, status, total_amount, created_at").gte("created_at", startOfMonth),
    supabase.from("jobs").select("id, total_amount").gte("created_at", startOfLastMonth).lte("created_at", endOfLastMonth),
    supabase.from("jobs").select("id, total_amount").gte("created_at", startOfWeek),
    supabase.from("customers").select("id, created_at"),
    supabase.from("vehicles").select("id"),
    supabase.from("appointments").select("id, appointment_date, status, title").gte("appointment_date", new Date().toISOString().split("T")[0]).order("appointment_date").limit(5),
    supabase.from("inventory").select("id, part_name, quantity, low_stock_level"),
    supabase.from("staff").select("id, name, avatar_color").eq("is_active", true).limit(5),
    supabase.from("jobs").select(`
      id, status, total_amount, created_at, mechanic_name,
      vehicles ( plate_number, make, model )
    `).order("created_at", { ascending: false }).limit(8),
  ]);

  // ── Compute stats ─────────────────────────────────────────────
  const monthRevenue = (monthJobs ?? []).reduce((s, j) => s + Number(j.total_amount), 0);
  const lastMonthRevenue = (lastMonthJobs ?? []).reduce((s, j) => s + Number(j.total_amount), 0);
  const weekRevenue = (weekJobs ?? []).reduce((s, j) => s + Number(j.total_amount), 0);
  const revenueGrowth = lastMonthRevenue > 0
    ? Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
    : 0;

  const pendingJobs = (allJobs ?? []).filter(j => j.status === "pending").length;
  const inProgressJobs = (allJobs ?? []).filter(j => j.status === "in_progress").length;
  const completedJobs = (allJobs ?? []).filter(j => j.status === "completed").length;
  const lowStock = (inventory ?? []).filter(p => p.quantity <= p.low_stock_level);

  // ── Monthly revenue chart (last 6 months) ────────────────────
  const monthlyData: { month: string; revenue: number; jobs: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toLocaleDateString("en-AE", { month: "short", year: "2-digit" });
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const mJobs = (allJobs ?? []).filter(j => {
      const jd = new Date(j.created_at);
      return jd >= monthStart && jd <= monthEnd;
    });
    monthlyData.push({
      month: key,
      revenue: mJobs.reduce((s, j) => s + Number(j.total_amount), 0),
      jobs: mJobs.length,
    });
  }

  // ── Status breakdown ─────────────────────────────────────────
  const statusData = [
    { label: "Pending",     value: pendingJobs,    color: "#f59e0b", bg: "#fffbeb" },
    { label: "In Progress", value: inProgressJobs, color: "#3b82f6", bg: "#eff6ff" },
    { label: "Completed",   value: completedJobs,  color: "#22c55e", bg: "#f0fdf4" },
    { label: "Cancelled",   value: (allJobs ?? []).filter(j => j.status === "cancelled").length, color: "#94a3b8", bg: "#f8fafc" },
  ];

  // ── Top mechanics ─────────────────────────────────────────────
  const mechanicMap: Record<string, { jobs: number; revenue: number }> = {};
  (allJobs ?? []).forEach(j => {
    if (j.mechanic_name) {
      if (!mechanicMap[j.mechanic_name]) mechanicMap[j.mechanic_name] = { jobs: 0, revenue: 0 };
      mechanicMap[j.mechanic_name].jobs += 1;
      mechanicMap[j.mechanic_name].revenue += Number(j.total_amount);
    }
  });
  const topMechanics = Object.entries(mechanicMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5);

  return (
    <DashboardClient
      stats={{
        monthRevenue, lastMonthRevenue, weekRevenue, revenueGrowth,
        totalJobs: (allJobs ?? []).length,
        monthJobs: (monthJobs ?? []).length,
        pendingJobs, inProgressJobs, completedJobs,
        totalCustomers: (customers ?? []).length,
        totalVehicles: (vehicles ?? []).length,
        lowStockCount: lowStock.length,
        activeStaff: (staff ?? []).length,
      }}
      monthlyData={monthlyData}
      statusData={statusData}
      topMechanics={topMechanics}
      recentJobs={recentJobs ?? []}
      upcomingAppointments={appointments ?? []}
      lowStockItems={lowStock.slice(0, 5)}
      activeStaff={staff ?? []}
    />
  );
}
