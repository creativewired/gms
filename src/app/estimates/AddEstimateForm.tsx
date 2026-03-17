"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AddEstimateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<{ id: number; name: string }[]>([]);
  const [vehicles, setVehicles] = useState<{ id: number; plate_number: string; make: string; model: string; customer_id: number }[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<typeof vehicles>([]);
  const [form, setForm] = useState({
    customer_id: "",
    vehicle_id: "",
    notes: "",
    valid_until: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: c }, { data: v }] = await Promise.all([
        supabase.from("customers").select("id, name").order("name"),
        supabase.from("vehicles").select("id, plate_number, make, model, customer_id").order("plate_number"),
      ]);
      if (c) setCustomers(c);
      if (v) setVehicles(v);
    };
    fetchData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "customer_id") {
      setFilteredVehicles(vehicles.filter((v) => v.customer_id === Number(value)));
      setForm((prev) => ({ ...prev, customer_id: value, vehicle_id: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_id) return alert("Please select a customer!");
    if (!form.vehicle_id) return alert("Please select a vehicle!");
    setLoading(true);

    const { data, error } = await supabase.from("estimates").insert([{
      customer_id: Number(form.customer_id),
      vehicle_id: Number(form.vehicle_id),
      notes: form.notes || null,
      valid_until: form.valid_until || null,
      status: "draft",
      total_amount: 0,
    }]).select().single();

    setLoading(false);
    if (error) {
      alert("Error: " + error.message);
    } else {
      setOpen(false);
      router.push(`/estimates/${data.id}`);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary">
        + New Estimate
      </button>
    );
  }

  return (
    <div className="card p-7">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-slate-800">New Estimate</h3>
        <button onClick={() => setOpen(false)} className="btn-ghost text-xs">Cancel</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Customer <span className="text-red-400">*</span></label>
            <select name="customer_id" value={form.customer_id} onChange={handleChange} className="input">
              <option value="">Select customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Vehicle <span className="text-red-400">*</span></label>
            <select name="vehicle_id" value={form.vehicle_id} onChange={handleChange} className="input"
              disabled={!form.customer_id}>
              <option value="">Select vehicle...</option>
              {filteredVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate_number} — {v.make} {v.model}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Valid Until</label>
            <input type="date" name="valid_until" value={form.valid_until}
              onChange={handleChange} className="input" />
          </div>
          <div>
            <label className="label">Notes</label>
            <input type="text" name="notes" value={form.notes}
              onChange={handleChange} placeholder="Optional notes..." className="input" />
          </div>
        </div>
        <div className="pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Creating..." : "Create Estimate"}
          </button>
        </div>
      </form>
    </div>
  );
}
