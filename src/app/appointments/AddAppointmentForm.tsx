"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Customer = { id: number; name: string };
type Vehicle  = { id: number; plate_number: string; make: string | null; model: string | null; customer_id: number };
type Mechanic = { id: number; name: string };

export default function AddAppointmentForm({
  customers, vehicles, mechanics,
}: {
  customers: Customer[];
  vehicles: Vehicle[];
  mechanics: Mechanic[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState({
    customer_id: "", vehicle_id: "", mechanic_name: "", title: "",
    notes: "", appointment_date: "", appointment_time: "09:00", duration: "60",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "customer_id") {
      setFilteredVehicles(vehicles.filter(v => v.customer_id === Number(value)));
      setForm(prev => ({ ...prev, customer_id: value, vehicle_id: "" }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_id)     return alert("Please select a customer!");
    if (!form.vehicle_id)      return alert("Please select a vehicle!");
    if (!form.title)           return alert("Please enter a service title!");
    if (!form.appointment_date) return alert("Please select a date!");
    setLoading(true);

    const { error } = await supabase.from("appointments").insert([{
      customer_id: Number(form.customer_id),
      vehicle_id: Number(form.vehicle_id),
      mechanic_name: form.mechanic_name || null,
      title: form.title,
      notes: form.notes || null,
      appointment_date: form.appointment_date,
      appointment_time: form.appointment_time,
      duration: Number(form.duration),
      status: "scheduled",
      branch_id: (() => {
        const saved = localStorage.getItem("workshopos_branch");
        return saved ? JSON.parse(saved).id : null;
      })(),
    }]);

    setLoading(false);
    if (error) { alert("Error: " + error.message); }
    else {
      setForm({ customer_id: "", vehicle_id: "", mechanic_name: "", title: "",
        notes: "", appointment_date: "", appointment_time: "09:00", duration: "60" });
      setOpen(false);
      router.refresh();
    }
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} className="btn-primary">+ New Appointment</button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col"
        style={{ maxHeight: "92vh" }}>
        <div className="px-6 py-5 flex items-center justify-between shrink-0"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <h3 className="text-base font-semibold text-slate-800">New Appointment</h3>
          <button onClick={() => setOpen(false)} className="btn-ghost text-xl leading-none">×</button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Service Title <span className="text-red-400">*</span></label>
              <input type="text" name="title" value={form.title} onChange={handleChange}
                placeholder="e.g. Oil Change, Brake Inspection" className="input" />
            </div>
            {/* Customer + Vehicle: stack on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Customer <span className="text-red-400">*</span></label>
                <select name="customer_id" value={form.customer_id} onChange={handleChange} className="input">
                  <option value="">Select customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Vehicle <span className="text-red-400">*</span></label>
                <select name="vehicle_id" value={form.vehicle_id} onChange={handleChange}
                  className="input" disabled={!form.customer_id}>
                  <option value="">Select vehicle...</option>
                  {filteredVehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.plate_number} — {v.make} {v.model}</option>
                  ))}
                </select>
              </div>
            </div>
            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Date <span className="text-red-400">*</span></label>
                <input type="date" name="appointment_date" value={form.appointment_date}
                  onChange={handleChange} className="input"
                  min={new Date().toISOString().split("T")[0]} />
              </div>
              <div>
                <label className="label">Time</label>
                <input type="time" name="appointment_time" value={form.appointment_time}
                  onChange={handleChange} className="input" />
              </div>
            </div>
            {/* Duration + Mechanic */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Duration</label>
                <select name="duration" value={form.duration} onChange={handleChange} className="input">
                  <option value="30">30 min</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                  <option value="180">3 hours</option>
                  <option value="240">4 hours</option>
                </select>
              </div>
              <div>
                <label className="label">Assign Mechanic</label>
                <select name="mechanic_name" value={form.mechanic_name} onChange={handleChange} className="input">
                  <option value="">Unassigned</option>
                  {mechanics.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange}
                placeholder="Any special instructions..." rows={2} className="input resize-none" />
            </div>
            <div className="flex gap-3 pt-1 pb-1">
              <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                {loading ? "Booking..." : "Book Appointment"}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}