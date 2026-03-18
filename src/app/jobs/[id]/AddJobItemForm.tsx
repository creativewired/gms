"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Part = { id: number; part_name: string; selling_price: number; quantity: number };

export default function AddJobItemForm({ jobId }: { jobId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [parts, setParts] = useState<Part[]>([]);
  const [form, setForm] = useState({ description: "", quantity: "1", unit_price: "", part_id: "" });

  useEffect(() => {
    supabase.from("inventory").select("id, part_name, selling_price, quantity").order("part_name")
      .then(({ data }) => { if (data) setParts(data); });
  }, []);

  const handlePartSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const part = parts.find(p => p.id === Number(e.target.value));
    if (part) {
      setForm({ ...form, part_id: e.target.value, description: part.part_name, unit_price: String(part.selling_price) });
    } else {
      setForm({ ...form, part_id: "", description: "", unit_price: "" });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description) return alert("Description is required!");
    if (!form.unit_price) return alert("Unit price is required!");

    const qty = Number(form.quantity);
    const price = Number(form.unit_price);

    if (form.part_id) {
      const part = parts.find(p => p.id === Number(form.part_id));
      if (part && qty > part.quantity)
        return alert(`Not enough stock! Only ${part.quantity} left for ${part.part_name}`);
    }

    setLoading(true);

    const { error: itemError } = await supabase.from("job_items").insert([{
      job_id: jobId, description: form.description,
      quantity: qty, unit_price: price, line_total: qty * price,
      part_id: form.part_id ? Number(form.part_id) : null,
    }]);

    if (itemError) { setLoading(false); return alert("Error: " + itemError.message); }

    if (form.part_id) {
      const part = parts.find(p => p.id === Number(form.part_id));
      if (part) await supabase.from("inventory").update({ quantity: part.quantity - qty }).eq("id", part.id);
    }

    const { data: allItems } = await supabase.from("job_items").select("line_total").eq("job_id", jobId);
    const newTotal = (allItems ?? []).reduce((sum, i) => sum + Number(i.line_total), 0);
    await supabase.from("jobs").update({ total_amount: newTotal }).eq("id", jobId);

    setLoading(false);
    setForm({ description: "", quantity: "1", unit_price: "", part_id: "" });
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="card p-4 mb-4">
      <h4 className="font-semibold text-slate-700 mb-3 text-sm">Add Part / Labour</h4>

      <div className="space-y-3">
        {/* Row 1: Inventory select + Description */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">From Inventory (optional)</label>
            <select value={form.part_id} onChange={handlePartSelect} className="input">
              <option value="">— Custom / Labour —</option>
              {parts.map(p => (
                <option key={p.id} value={p.id}>
                  {p.part_name} (Stock: {p.quantity}) — AED {p.selling_price}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Description <span className="text-red-400">*</span></label>
            <input type="text" name="description" value={form.description} onChange={handleChange}
              placeholder="e.g. Labour charge" className="input" />
          </div>
        </div>

        {/* Row 2: Qty + Price + Submit */}
        <div className="flex flex-wrap gap-3 items-end">
          <div style={{ width: "80px" }}>
            <label className="label">Qty</label>
            <input type="number" name="quantity" value={form.quantity} onChange={handleChange}
              min="1" className="input" />
          </div>
          <div style={{ width: "120px" }}>
            <label className="label">Unit Price (AED) <span className="text-red-400">*</span></label>
            <input type="number" name="unit_price" value={form.unit_price} onChange={handleChange}
              placeholder="50" className="input" />
          </div>
          {form.quantity && form.unit_price && (
            <div className="pb-2">
              <p className="text-xs text-slate-400 font-mono">
                = AED {(Number(form.quantity) * Number(form.unit_price)).toFixed(2)}
              </p>
            </div>
          )}
          <div className="ml-auto pb-0.5">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Adding..." : "+ Add Item"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}