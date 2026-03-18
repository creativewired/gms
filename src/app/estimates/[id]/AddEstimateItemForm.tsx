"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AddEstimateItemForm({ estimateId }: { estimateId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ description: "", quantity: "1", unit_price: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description) return alert("Description is required!");
    if (!form.unit_price) return alert("Unit price is required!");

    const qty = Number(form.quantity);
    const price = Number(form.unit_price);

    setLoading(true);

    await supabase.from("estimate_items").insert([{
      estimate_id: estimateId,
      description: form.description,
      quantity: qty,
      unit_price: price,
      line_total: qty * price,
    }]);

    const { data: allItems } = await supabase
      .from("estimate_items").select("line_total").eq("estimate_id", estimateId);

    const newTotal = (allItems ?? []).reduce((sum, i) => sum + Number(i.line_total), 0);
    await supabase.from("estimates").update({ total_amount: newTotal }).eq("id", estimateId);

    setLoading(false);
    setForm({ description: "", quantity: "1", unit_price: "" });
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="card p-4">
      <div className="space-y-3">
        {/* Description full width */}
        <div>
          <label className="label">Description <span className="text-red-400">*</span></label>
          <input type="text" name="description" value={form.description} onChange={handleChange}
            placeholder="e.g. Brake pad replacement" className="input" />
        </div>
        {/* Qty + Price + Button on one row */}
        <div className="flex flex-wrap gap-3 items-end">
          <div style={{ width: "80px" }}>
            <label className="label">Qty</label>
            <input type="number" name="quantity" value={form.quantity} onChange={handleChange}
              min="1" className="input" />
          </div>
          <div className="flex-1" style={{ minWidth: "120px" }}>
            <label className="label">Unit Price (AED) <span className="text-red-400">*</span></label>
            <input type="number" name="unit_price" value={form.unit_price} onChange={handleChange}
              placeholder="150" className="input" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary shrink-0">
            {loading ? "Adding..." : "Add Item"}
          </button>
        </div>
      </div>
    </form>
  );
}