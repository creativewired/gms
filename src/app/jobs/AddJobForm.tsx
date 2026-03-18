"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Vehicle = {
  id: number;
  plate_number: string;
  make: string | null;
  model: string | null;
  customer_id: number;
  customers: { name: string } | null;
};

type Mechanic = { id: number; name: string };

type JobItem = { description: string; quantity: number; unit_price: number };

export default function AddJobForm({
  vehicles,
  mechanics,
}: {
  vehicles: Vehicle[];
  mechanics: Mechanic[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    vehicle_id: "", mechanic_name: "", status: "pending", notes: "",
  });
  const [items, setItems] = useState<JobItem[]>([
    { description: "", quantity: 1, unit_price: 0 },
  ]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleItemChange = (index: number, field: keyof JobItem, value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: field === "description" ? value : Number(value) };
    setItems(updated);
  };

  const addItem = () => setItems([...items, { description: "", quantity: 1, unit_price: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicle_id) return alert("Please select a vehicle!");
    if (items.some(i => !i.description)) return alert("All items need a description!");

    const savedBranch = localStorage.getItem("workshopos_branch");
    const branchId = savedBranch ? JSON.parse(savedBranch).id : null;

    setLoading(true);
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert([{
        vehicle_id: Number(form.vehicle_id),
        mechanic_name: form.mechanic_name || null,
        status: form.status,
        notes: form.notes || null,
        total_amount: totalAmount,
        branch_id: branchId,
      }])
      .select()
      .single();

    if (jobError || !job) {
      setLoading(false);
      return alert("Error creating job: " + jobError?.message);
    }

    const { error: itemsError } = await supabase.from("job_items").insert(
      items.map(item => ({
        job_id: job.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.quantity * item.unit_price,
      }))
    );

    setLoading(false);

    if (itemsError) {
      alert("Job created but error saving items: " + itemsError.message);
    } else {
      setForm({ vehicle_id: "", mechanic_name: "", status: "pending", notes: "" });
      setItems([{ description: "", quantity: 1, unit_price: 0 }]);
      setOpen(false);
      router.refresh();
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary">+ New Job</button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)" }}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col"
        style={{ maxHeight: "92vh" }}>

        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between shrink-0"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <h3 className="text-base font-semibold text-slate-800">New Job</h3>
          <button onClick={() => setOpen(false)} className="btn-ghost text-xl leading-none">×</button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4 flex-1">

          {/* Vehicle */}
          <div>
            <label className="label">Vehicle <span className="text-red-400">*</span></label>
            <select name="vehicle_id" value={form.vehicle_id} onChange={handleChange} className="input">
              <option value="">Select vehicle...</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.plate_number} — {v.make} {v.model}
                  {v.customers ? ` (${v.customers.name})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Mechanic + Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Assign Mechanic</label>
              <select name="mechanic_name" value={form.mechanic_name} onChange={handleChange} className="input">
                <option value="">Unassigned</option>
                {mechanics.map(m => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="input">
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Job Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">
                Services & Parts <span className="text-red-400">*</span>
              </label>
              <button type="button" onClick={addItem} className="btn-ghost text-xs">+ Add line</button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="space-y-2 p-3 rounded-xl sm:p-0 sm:space-y-0 sm:flex sm:gap-2 sm:items-center"
                  style={{ background: "rgba(0,0,0,0.02)", borderRadius: "0.75rem" }}>

                  {/* Description full width on mobile */}
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={e => handleItemChange(index, "description", e.target.value)}
                    className="input w-full sm:flex-1"
                  />

                  {/* Qty + Price + Total in a row on mobile */}
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      min={1}
                      onChange={e => handleItemChange(index, "quantity", e.target.value)}
                      className="input"
                      style={{ width: "60px" }}
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={item.unit_price}
                      min={0}
                      step="0.01"
                      onChange={e => handleItemChange(index, "unit_price", e.target.value)}
                      className="input"
                      style={{ width: "88px" }}
                    />
                    <span className="text-xs text-slate-400 font-mono min-w-[64px] text-right">
                      AED {(item.quantity * item.unit_price).toFixed(2)}
                    </span>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(index)}
                        className="btn-ghost text-slate-300 hover:text-red-400 text-lg leading-none shrink-0">
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex justify-end mt-3 pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="text-right">
                <p className="label">Total</p>
                <p className="text-xl font-bold text-slate-900">AED {totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange}
              placeholder="Any special instructions or observations..."
              rows={2} className="input resize-none" />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1 pb-1">
            <button type="submit" disabled={loading} className="btn-primary flex-1 sm:flex-none">
              {loading ? "Creating..." : "Create Job"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1 sm:flex-none">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}