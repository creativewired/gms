"use client";

import { useState } from "react";

type Appointment = {
  id: number;
  title: string;
  notes: string | null;
  appointment_date: string;
  appointment_time: string;
  duration: number;
  status: string;
  mechanic_name: string | null;
  customers: { name: string; phone: string | null } | null;
  vehicles: { plate_number: string; make: string | null; model: string | null } | null;
};

const statusConfig: Record<string, { label: string; dot: string; row: string }> = {
  scheduled: { label: "Scheduled", dot: "bg-blue-400",    row: "border-l-4 border-blue-300 bg-blue-50/60" },
  confirmed: { label: "Confirmed", dot: "bg-emerald-400", row: "border-l-4 border-emerald-300 bg-emerald-50/60" },
  completed: { label: "Completed", dot: "bg-slate-300",   row: "border-l-4 border-slate-200 bg-slate-50/60" },
  cancelled: { label: "Cancelled", dot: "bg-red-300",     row: "border-l-4 border-red-200 bg-red-50/40 opacity-60" },
};

function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year: number, month: number) { return new Date(year, month, 1).getDay(); }

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_FULL  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DAYS_SHORT = ["S","M","T","W","T","F","S"];

export default function AppointmentsCalendar({ appointments }: { appointments: Appointment[] }) {
  const today = new Date();
  const [currentYear, setCurrentYear]   = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(today.toISOString().split("T")[0]);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [dayPanelOpen, setDayPanelOpen] = useState(false);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay    = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const getAppointmentsForDate = (dateStr: string) =>
    appointments.filter(a => a.appointment_date === dateStr);

  const selectedAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];
  const upcomingAppointments = appointments.filter(
    a => a.appointment_date >= today.toISOString().split("T")[0] && a.status !== "cancelled"
  );

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setDayPanelOpen(true);
  };

  return (
    <div className="space-y-4">

      {/* View Toggle */}
      <div className="flex items-center gap-2">
        {(["calendar", "list"] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
              view === v
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-500 hover:text-slate-800"
            }`}>
            {v === "calendar" ? "Calendar" : "List"}
          </button>
        ))}
      </div>

      {view === "calendar" ? (
        <>
          {/* Calendar + side panel: stacked on mobile, side-by-side on lg */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Calendar */}
            <div className="lg:col-span-2 card p-4 sm:p-6">
              {/* Month Nav */}
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <h2 className="text-sm sm:text-base font-semibold text-slate-800">
                  {MONTHS[currentMonth]} {currentYear}
                </h2>
                <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>

              {/* Day headers — short on mobile */}
              <div className="grid grid-cols-7 mb-1">
                {DAYS_FULL.map((d, i) => (
                  <div key={d} className="text-center py-1.5">
                    <span className="hidden sm:inline text-xs font-medium text-slate-400">{d}</span>
                    <span className="sm:hidden text-xs font-medium text-slate-400">{DAYS_SHORT[i]}</span>
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayAppts = getAppointmentsForDate(dateStr);
                  const isToday    = dateStr === today.toISOString().split("T")[0];
                  const isSelected = dateStr === selectedDate;

                  return (
                    <button key={day} onClick={() => handleDayClick(dateStr)}
                      className={`relative aspect-square flex flex-col items-center justify-start pt-1 sm:pt-1.5 rounded-lg sm:rounded-xl text-xs transition-all ${
                        isSelected ? "bg-slate-900 text-white"
                        : isToday  ? "bg-slate-100 text-slate-900 font-semibold"
                        : "hover:bg-slate-50 text-slate-600"
                      }`}>
                      <span className="font-medium">{day}</span>
                      {dayAppts.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center px-0.5">
                          {dayAppts.slice(0, 2).map(a => (
                            <span key={a.id}
                              className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${
                                isSelected ? "bg-white/70" : statusConfig[a.status]?.dot ?? "bg-slate-300"
                              }`} />
                          ))}
                          {dayAppts.length > 2 && (
                            <span className={`text-[8px] leading-none ${isSelected ? "text-white/70" : "text-slate-400"}`}>
                              +{dayAppts.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Day Panel — hidden on mobile until a day is tapped (bottom sheet), always visible on lg */}
            {/* Desktop: always show in grid */}
            <div className="hidden lg:block card p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">
                {selectedDate
                  ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-AE", {
                      weekday: "long", month: "long", day: "numeric",
                    })
                  : "Select a date"}
              </h3>
              <DayAppointments appointments={selectedAppointments} />
            </div>
          </div>

          {/* Mobile Day Panel — bottom sheet */}
          {dayPanelOpen && selectedDate && (
            <div className="lg:hidden fixed inset-0 z-50 flex items-end"
              style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }}
              onClick={() => setDayPanelOpen(false)}>
              <div className="bg-white w-full rounded-t-2xl p-5 max-h-[70vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-700">
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-AE", {
                      weekday: "long", month: "long", day: "numeric",
                    })}
                  </h3>
                  <button onClick={() => setDayPanelOpen(false)}
                    className="btn-ghost text-xl leading-none">×</button>
                </div>
                <DayAppointments appointments={selectedAppointments} />
              </div>
            </div>
          )}
        </>
      ) : (
        /* List View */
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Upcoming Appointments</p>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-slate-50">
            {upcomingAppointments.length > 0 ? upcomingAppointments.map(a => (
              <div key={a.id} className={`px-4 py-3 ${statusConfig[a.status]?.row ?? ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{a.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{a.customers?.name}</p>
                    <p className="text-xs text-slate-400">
                      {a.vehicles?.plate_number} · {a.vehicles?.make} {a.vehicles?.model}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-slate-700">
                      {new Date(a.appointment_date + "T00:00:00").toLocaleDateString("en-AE", { month: "short", day: "numeric" })}
                    </p>
                    <p className="text-xs font-mono text-slate-400">{a.appointment_time.slice(0, 5)}</p>
                    <span className={`inline-flex items-center gap-1 mt-1 text-xs`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[a.status]?.dot}`} />
                      <span className="text-slate-500">{statusConfig[a.status]?.label}</span>
                    </span>
                  </div>
                </div>
              </div>
            )) : (
              <p className="px-5 py-10 text-center text-slate-300 text-sm">No upcoming appointments.</p>
            )}
          </div>

          {/* Desktop table */}
          <table className="hidden md:table min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {["Date & Time","Service","Customer","Vehicle","Mechanic","Status"].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {upcomingAppointments.length > 0 ? upcomingAppointments.map((a, i) => (
                <tr key={a.id}
                  className={`hover:bg-slate-50/70 transition-colors ${i !== 0 ? "border-t border-slate-50" : ""}`}>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-800 text-xs">
                      {new Date(a.appointment_date + "T00:00:00").toLocaleDateString("en-AE", {
                        weekday: "short", month: "short", day: "numeric",
                      })}
                    </p>
                    <p className="text-slate-400 text-xs font-mono mt-0.5">{a.appointment_time.slice(0, 5)}</p>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">{a.title}</td>
                  <td className="px-6 py-4">
                    <p className="text-slate-700">{a.customers?.name}</p>
                    <p className="text-slate-400 text-xs">{a.customers?.phone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-700">{a.vehicles?.plate_number}</p>
                    <p className="text-slate-400 text-xs">{a.vehicles?.make} {a.vehicles?.model}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">{a.mechanic_name ?? "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      a.status === "scheduled" ? "bg-blue-50 text-blue-600 border-blue-100" :
                      a.status === "confirmed" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      a.status === "completed" ? "bg-slate-100 text-slate-500 border-slate-200" :
                      "bg-red-50 text-red-400 border-red-100"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[a.status]?.dot}`} />
                      {statusConfig[a.status]?.label}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-300 text-sm">
                    No upcoming appointments.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Extracted to avoid duplication between desktop panel and mobile sheet
function DayAppointments({ appointments }: { appointments: Appointment[] }) {
  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-28 text-center">
        <p className="text-slate-300 text-sm">No appointments</p>
        <p className="text-slate-200 text-xs mt-1">on this day</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {appointments.map(a => (
        <div key={a.id} className={`rounded-xl p-3 ${statusConfig[a.status]?.row ?? "bg-slate-50"}`}>
          <div className="flex items-start justify-between">
            <p className="text-sm font-semibold text-slate-800">{a.title}</p>
            <span className="text-xs text-slate-400 font-mono">{a.appointment_time.slice(0, 5)}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{a.customers?.name}</p>
          <p className="text-xs text-slate-400">{a.vehicles?.plate_number} · {a.vehicles?.make} {a.vehicles?.model}</p>
          {a.mechanic_name && <p className="text-xs text-slate-400 mt-1">Mechanic: {a.mechanic_name}</p>}
          <div className="flex items-center justify-between mt-2">
            <span className="inline-flex items-center gap-1 text-xs">
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[a.status]?.dot}`} />
              <span className="text-slate-500">{statusConfig[a.status]?.label}</span>
            </span>
            <span className="text-xs text-slate-400">{a.duration} min</span>
          </div>
        </div>
      ))}
    </div>
  );
}