import { supabase } from "@/lib/supabaseClient";
import AppointmentsCalendar from "./AppointmentsCalendar";
import AddAppointmentForm from "./AddAppointmentForm";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const { branch } = await searchParams;
  const branchId = branch ? Number(branch) : null;

  let apptQuery = supabase
    .from("appointments")
    .select("*, customers(name, phone), vehicles(plate_number, make, model)")
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true });

  if (branchId) apptQuery = apptQuery.eq("branch_id", branchId);

  const { data: appointments } = await apptQuery;

  const [{ data: customers }, { data: vehicles }, { data: mechanics }] = await Promise.all([
    supabase.from("customers").select("id, name").order("name"),
    supabase.from("vehicles").select("id, plate_number, make, model, customer_id").order("plate_number"),
    supabase.from("mechanics").select("id, name").order("name"),
  ]);

  const today = new Date().toISOString().split("T")[0];
  const upcoming    = (appointments ?? []).filter(a => a.appointment_date >= today && a.status !== "cancelled").length;
  const todayCount  = (appointments ?? []).filter(a => a.appointment_date === today).length;
  const totalCount  = (appointments ?? []).length;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="page-header">
        <div>
          <p className="section-title">Scheduling</p>
          <h1 className="page-title">Appointments</h1>
        </div>
        <AddAppointmentForm customers={customers ?? []} vehicles={vehicles ?? []} mechanics={mechanics ?? []} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total",    value: totalCount,  color: "#7c3aed", border: "#ddd6fe" },
          { label: "Today",    value: todayCount,  color: "#1d4ed8", border: "#bfdbfe" },
          { label: "Upcoming", value: upcoming,    color: "#15803d", border: "#bbf7d0" },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.border}` }}>
            <p className="label text-xs">{s.label}</p>
            <p style={{ fontSize: "1.6rem", fontWeight: 700, color: s.color, letterSpacing: "-0.03em", lineHeight: 1.1, marginTop: "0.3rem" }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <AppointmentsCalendar appointments={appointments ?? []} />
    </div>
  );
}