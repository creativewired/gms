"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Part = {
  id: number;
  part_name: string;
  selling_price: number;
  quantity: number;
};

export default function AddJobItemForm({ jobId }: { jobId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [parts, setParts] = useState<Part[]>([]);
  const [form, setForm] = useState({
    description: "",
    quantity: "1",
    unit_price: "",
    part_id: "",
  });

  useEffect(() => {
    const fetchParts = async () => {
      const { data } = await supabase
        .from("inventory")
        .select("id, part_name, selling_price, quantity")
        .order("part_name");
      if (data) setParts(data);
    };
    fetchParts();
  }, []);

  const handlePartSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const part = parts.find((p) => p.id === Number(selectedId));
    if (part) {
      setForm({
        ...form,
        part_id: selectedId,
        description: part.part_name,
        unit_price: String(part.selling_price),
      });
    } else {
      setForm({ ...form, part_id: "", description: "", unit_price: "" });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description) return alert("Description is required!");
    if (!form.unit_price) return alert("Unit price is required!");

    const qty = Number(form.quantity);
    const price = Number(form.unit_price);
    const lineTotal = qty * price;

    // Check stock if a part is selected
    if (form.part_id) {
      const part = parts.find((p) => p.id === Number(form.part_id));
      if (part && qty > part.quantity) {
        return alert(`Not enough stock! Only ${part.quantity} left for ${part.part_name}`);
      }
    }

    setLoading(true);

    // Insert job item
    const { error: itemError } = await supabase.from("job_items").insert([{
      job_id: jobId,
      description: form.description,
      quantity: qty,
      unit_price: price,
      line_total: lineTotal,
      part_id: form.part_id ? Number(form.part_id) : null,
    }]);

    if (itemError) {
      setLoading(false);
      return alert("Error: " + itemError.message);
    }

    // Reduce inventory stock if part selected
    if (form.part_id) {
      const part = parts.find((p) => p.id === Number(form.part_id));
      if (part) {
        await supabase
          .from("inventory")
          .update({ quantity: part.quantity - qty })
          .eq("id", part.id);
      }
    }

    // Recalculate job total
    const { data: allItems } = await supabase
      .from("job_items")
      .select("line_total")
      .eq("job_id", jobId);

    const newTotal = (allItems ?? []).reduce((sum, i) => sum + Number(i.line_total), 0);
    await supabase.from("jobs").update({ total_amount: newTotal }).eq("id", jobId);

    setLoading(false);
    setForm({ description: "", quantity: "1", unit_price: "", part_id: "" });
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 mb-4 shadow-sm">
      <h4 className="font-semibold text-slate-700 mb-3 text-sm">Add Part / Labour</h4>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs text-slate-500 mb-1">Select from Inventory (optional)</label>
          <select
            value={form.part_id}
            onChange={handlePartSelect}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="">— Custom / Labour —</option>
            {parts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.part_name} (Stock: {p.quantity}) — AED {p.selling_price}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-slate-500 mb-1">Description <span className="text-red-500">*</span></label>
          <input type="text" name="description" value={form.description} onChange={handleChange}
            placeholder="e.g. Labour charge"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Quantity</label>
          <input type="number" name="quantity" value={form.quantity} onChange={handleChange} min="1"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Unit Price (AED) <span className="text-red-500">*</span></label>
          <input type="number" name="unit_price" value={form.unit_price} onChange={handleChange}
            placeholder="50"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
        </div>
      </div>
      <button type="submit" disabled={loading}
        className="mt-3 bg-slate-900 text-white text-sm px-5 py-2 rounded-md hover:bg-slate-700 disabled:opacity-50 transition">
        {loading ? "Adding..." : "Add Item"}
      </button>
    </form>
  );
}
