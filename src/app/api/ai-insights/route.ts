import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  try {
    const { branchId } = await req.json();

    let jobsQuery = supabase
      .from("jobs")
      .select("id, status, total_amount, created_at, mechanic_name")
      .order("created_at", { ascending: false })
      .limit(200);
    if (branchId) jobsQuery = jobsQuery.eq("branch_id", branchId);

    let itemsQuery = supabase.from("job_items").select("description, quantity, line_total");

    let appointmentsQuery = supabase
      .from("appointments")
      .select("appointment_date, status")
      .limit(100);
    if (branchId) appointmentsQuery = appointmentsQuery.eq("branch_id", branchId);

    let inventoryQuery = supabase
      .from("inventory")
      .select("part_name, quantity, low_stock_level, unit_price");
    if (branchId) inventoryQuery = inventoryQuery.eq("branch_id", branchId);

    const [
      { data: jobs },
      { data: items },
      { data: appointments },
      { data: inventory },
    ] = await Promise.all([jobsQuery, itemsQuery, appointmentsQuery, inventoryQuery]);

    const allJobs = jobs ?? [];
    const allItems = items ?? [];
    const allInventory = inventory ?? [];

    // ── Core stats ──────────────────────────────────────────────
    const totalRevenue = allJobs.reduce((s, j) => s + Number(j.total_amount), 0);
    const completedJobs = allJobs.filter(j => j.status === "completed").length;
    const pendingJobs = allJobs.filter(j => j.status === "pending").length;
    const inProgressJobs = allJobs.filter(j => j.status === "in_progress").length;
    const avgJobValue = allJobs.length ? totalRevenue / allJobs.length : 0;
    const completionRate = allJobs.length ? Math.round((completedJobs / allJobs.length) * 100) : 0;

    // ── Revenue by day of week ───────────────────────────────────
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const revenueByDay: Record<string, number> = {};
    const jobsByDay: Record<string, number> = {};
    days.forEach(d => { revenueByDay[d] = 0; jobsByDay[d] = 0; });
    allJobs.forEach(j => {
      const day = days[new Date(j.created_at).getDay()];
      revenueByDay[day] += Number(j.total_amount);
      jobsByDay[day] += 1;
    });

    const busiestDay = Object.entries(revenueByDay).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Monday";
    const slowestDay = Object.entries(revenueByDay).sort((a, b) => a[1] - b[1])[0]?.[0] ?? "Sunday";

    // ── Monthly revenue trend ────────────────────────────────────
    const monthlyRevenue: Record<string, number> = {};
    allJobs.forEach(j => {
      const key = new Date(j.created_at).toLocaleDateString("en-AE", { month: "short", year: "2-digit" });
      monthlyRevenue[key] = (monthlyRevenue[key] ?? 0) + Number(j.total_amount);
    });
    const monthlyValues = Object.values(monthlyRevenue);
    const recentAvg = monthlyValues.slice(-2).reduce((s, v) => s + v, 0) / 2 || 0;
    const olderAvg = monthlyValues.slice(-4, -2).reduce((s, v) => s + v, 0) / 2 || 0;
    const revenueTrend: "up" | "down" | "stable" =
      recentAvg > olderAvg * 1.05 ? "up" :
      recentAvg < olderAvg * 0.95 ? "down" : "stable";

    // ── Top services ─────────────────────────────────────────────
    const serviceCount: Record<string, { count: number; revenue: number }> = {};
    allItems.forEach(item => {
      if (!serviceCount[item.description])
        serviceCount[item.description] = { count: 0, revenue: 0 };
      serviceCount[item.description].count += item.quantity;
      serviceCount[item.description].revenue += Number(item.line_total);
    });
    const topServiceEntry = Object.entries(serviceCount)
      .sort((a, b) => b[1].revenue - a[1].revenue)[0];
    const topService = topServiceEntry?.[0] ?? "General Service";
    const topServiceRevenue = topServiceEntry?.[1].revenue ?? 0;

    // ── Mechanic stats ───────────────────────────────────────────
    const mechanicStats: Record<string, { jobs: number; revenue: number }> = {};
    allJobs.forEach(j => {
      if (j.mechanic_name) {
        if (!mechanicStats[j.mechanic_name])
          mechanicStats[j.mechanic_name] = { jobs: 0, revenue: 0 };
        mechanicStats[j.mechanic_name].jobs += 1;
        mechanicStats[j.mechanic_name].revenue += Number(j.total_amount);
      }
    });
    const topMechanic = Object.entries(mechanicStats)
      .sort((a, b) => b[1].revenue - a[1].revenue)[0];

    // ── Inventory alerts ─────────────────────────────────────────
    const lowStock = allInventory.filter(p => p.quantity <= p.low_stock_level);

    // ── Forecast ─────────────────────────────────────────────────
    const lastMonthRevenue = monthlyValues[monthlyValues.length - 1] ?? 0;
    const forecastMultiplier = revenueTrend === "up" ? 1.12 : revenueTrend === "down" ? 0.92 : 1.03;
    const forecastAmount = lastMonthRevenue * forecastMultiplier;
    const forecastConfidence: "low" | "medium" | "high" =
      allJobs.length > 50 ? "high" : allJobs.length > 20 ? "medium" : "low";

    // ── Build insights ────────────────────────────────────────────
    const insights = [];

    // Completion rate insight
    if (completionRate >= 75) {
      insights.push({
        type: "positive",
        title: "Strong Completion Rate",
        description: `${completionRate}% of all jobs are completed successfully. This indicates efficient workflow management and customer satisfaction. Maintaining this rate builds long-term customer loyalty.`,
        metric: `${completionRate}% completion rate`,
        action: "Maintain current workflow and consider showcasing this metric to attract new customers.",
      });
    } else if (completionRate < 50) {
      insights.push({
        type: "warning",
        title: "Low Completion Rate",
        description: `Only ${completionRate}% of jobs are marked as completed. ${pendingJobs} jobs are still pending and ${inProgressJobs} are in progress. This may indicate bottlenecks or resource gaps.`,
        metric: `${completionRate}% completion rate`,
        action: "Review pending jobs older than 3 days and assign mechanics to clear the backlog.",
      });
    }

    // Revenue trend
    if (revenueTrend === "up") {
      insights.push({
        type: "positive",
        title: "Revenue Is Growing",
        description: `Recent months show a positive revenue trend with an average of AED ${recentAvg.toFixed(0)} vs AED ${olderAvg.toFixed(0)} in prior months. Growth is accelerating, indicating strong demand.`,
        metric: `+${Math.round(((recentAvg - olderAvg) / (olderAvg || 1)) * 100)}% vs prior period`,
        action: "Capitalize on growth by hiring an additional mechanic or extending working hours.",
      });
    } else if (revenueTrend === "down") {
      insights.push({
        type: "alert",
        title: "Revenue Decline Detected",
        description: `Revenue has dropped from AED ${olderAvg.toFixed(0)} to AED ${recentAvg.toFixed(0)} on average per month. This may be seasonal or indicate a need for marketing outreach.`,
        metric: `-${Math.round(((olderAvg - recentAvg) / (olderAvg || 1)) * 100)}% vs prior period`,
        action: "Launch an SMS/WhatsApp promotion to inactive customers offering a service discount.",
      });
    }

    // Busiest day opportunity
    insights.push({
      type: "opportunity",
      title: `Maximize ${busiestDay} Revenue`,
      description: `${busiestDay} is your highest revenue day with AED ${revenueByDay[busiestDay].toFixed(0)} earned and ${jobsByDay[busiestDay]} jobs. Ensure full staffing and parts availability on this day.`,
      metric: `AED ${revenueByDay[busiestDay].toFixed(0)} on ${busiestDay}s`,
      action: `Pre-schedule resources every ${busiestDay} and avoid booking mechanic days off.`,
    });

    // Slow day opportunity
    if (revenueByDay[slowestDay] === 0) {
      insights.push({
        type: "opportunity",
        title: `${slowestDay} — Untapped Potential`,
        description: `No revenue is recorded on ${slowestDay}s. If the workshop is open, this day is completely underutilized. If closed, consider extending hours for peak demand periods.`,
        metric: `AED 0 on ${slowestDay}s`,
        action: `Run a "${slowestDay} Special" promotion — 10% off any service booked for ${slowestDay}.`,
      });
    } else {
      insights.push({
        type: "opportunity",
        title: `Grow ${slowestDay} Business`,
        description: `${slowestDay} is your slowest day with only AED ${revenueByDay[slowestDay].toFixed(0)} revenue. Targeted promotions on this day could fill idle mechanic time and increase weekly revenue.`,
        metric: `AED ${revenueByDay[slowestDay].toFixed(0)} on ${slowestDay}s`,
        action: `Offer a limited-time discount for ${slowestDay} appointments to drive bookings.`,
      });
    }

    // Top service
    if (topServiceEntry) {
      insights.push({
        type: "positive",
        title: `"${topService}" Is Your Star Service`,
        description: `This service has generated AED ${topServiceRevenue.toFixed(0)} in revenue and is your top earner. Ensure parts and labor for this service are always available and prioritized.`,
        metric: `AED ${topServiceRevenue.toFixed(0)} total revenue`,
        action: "Feature this service prominently in your customer communication and invoices.",
      });
    }

    // Low stock warning
    if (lowStock.length > 0) {
      insights.push({
        type: "alert",
        title: `${lowStock.length} Parts Running Low`,
        description: `${lowStock.map(p => p.part_name).slice(0, 3).join(", ")}${lowStock.length > 3 ? ` and ${lowStock.length - 3} more` : ""} are at or below reorder level. Running out mid-job causes delays and poor customer experience.`,
        metric: `${lowStock.length} low stock items`,
        action: "Place a reorder for low stock parts immediately to avoid job delays.",
      });
    }

    // Top mechanic
    if (topMechanic) {
      insights.push({
        type: "positive",
        title: `Top Performer: ${topMechanic[0]}`,
        description: `${topMechanic[0]} has handled ${topMechanic[1].jobs} jobs generating AED ${topMechanic[1].revenue.toFixed(0)} in revenue. Recognizing top performers improves retention and team morale.`,
        metric: `AED ${topMechanic[1].revenue.toFixed(0)} · ${topMechanic[1].jobs} jobs`,
        action: "Acknowledge top performers monthly and consider performance-based bonuses.",
      });
    }

    // Avg job value
    insights.push({
      type: avgJobValue > 500 ? "positive" : "opportunity",
      title: "Average Job Value",
      description: `Your average job is worth AED ${avgJobValue.toFixed(0)}. ${avgJobValue < 300 ? "This is relatively low — upselling additional services at checkout could significantly boost revenue." : "This is a healthy average for a UAE workshop. Upselling premium services can push this higher."}`,
      metric: `AED ${avgJobValue.toFixed(0)} per job`,
      action: "Train mechanics to recommend one add-on service per job (e.g. filter change, tyre rotation).",
    });

    // ── Summary ───────────────────────────────────────────────────
    const summary = `Your workshop has processed ${allJobs.length} jobs with a total revenue of AED ${totalRevenue.toFixed(0)} and a ${completionRate}% completion rate. Revenue is trending ${revenueTrend} with ${busiestDay} being the strongest day. ${lowStock.length > 0 ? `Attention needed on ${lowStock.length} low-stock inventory items.` : "Inventory levels are healthy."}`;

    // ── Quick wins ────────────────────────────────────────────────
    const quickWins = [
      `Run a WhatsApp promo on ${slowestDay}s — offer 10% off to fill idle slots`,
      `Upsell one add-on per job — even AED 50 extra per job adds AED ${(allJobs.length * 50).toLocaleString()} over your job history`,
      topMechanic ? `Assign high-value jobs to ${topMechanic[0]} — your proven top earner` : "Track mechanic performance to assign jobs strategically",
      lowStock.length > 0 ? `Reorder ${lowStock[0].part_name} now to avoid job delays` : "Set low-stock alerts for your top 5 fastest-moving parts",
    ];

    return NextResponse.json({
      summary,
      insights: insights.slice(0, 6),
      busiest_day: busiestDay,
      slowest_day: slowestDay,
      top_service: topService,
      revenue_trend: revenueTrend,
      forecast: {
        next_month_estimate: `AED ${forecastAmount.toFixed(0)}`,
        confidence: forecastConfidence,
        reasoning: `Based on ${allJobs.length} jobs and a ${revenueTrend} revenue trend, applying a ${Math.round((forecastMultiplier - 1) * 100)}% ${revenueTrend === "down" ? "reduction" : "growth"} factor to last month's AED ${lastMonthRevenue.toFixed(0)}.`,
      },
      quick_wins: quickWins,
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
