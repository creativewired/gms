"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AddInventoryForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    part_name: "", sku: "", quantity: "", unit_price: "", low_stock_level: "5",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.part_name) return alert("Part name is required!");
    if (!form.quantity) return alert("Quantity is required!");
    if (!form.unit_price) return alert("Unit price is required!");

    const savedBranch = localStorage.getItem("workshopos_branch");
    const branchId = savedBranch ? JSON.parse(savedBranch).id : null;

    setLoading(true);
    const { error } = await supabase.from("inventory").insert([{
      part_name: form.part_name,
      sku: form.sku || null,
      quantity: Number(form.quantity),
      unit_price: Number(form.unit_price),
      low_stock_level: Number(form.low_stock_level),
      branch_id: branchId,
    }]);

    setLoading(false);
    if (error) {
      alert("Error: " + error.message);
    } else {
      setForm({ part_name: "", sku: "", quantity: "", unit_price: "", low_stock_level: "5" });
      setOpen(false);
      router.refresh();
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary">+ Add Part</button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)" }}>
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-slate-800">Add Part to Inventory</h3>
          <button onClick={() => setOpen(false)} className="btn-ghost text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Part Name <span className="text-red-400">*</span></label>
            <input type="text" name="part_name" value={form.part_name}
              onChange={handleChange} placeholder="e.g. Oil Filter" className="input" />
          </div>
          <div>
            <label className="label">SKU / Part Number</label>
            <input type="text" name="sku" value={form.sku}
              onChange={handleChange} placeholder="e.g. OF-1234" className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Quantity <span className="text-red-400">*</span></label>
              <input type="number" name="quantity" value={form.quantity}
                onChange={handleChange} placeholder="0" min="0" className="input" />
            </div>
            <div>
              <label className="label">Unit Price (AED) <span className="text-red-400">*</span></label>
              <input type="number" name="unit_price" value={form.unit_price}
                onChange={handleChange} placeholder="0.00" min="0" step="0.01" className="input" />
            </div>
          </div>
          <div>
            <label className="label">Low Stock Alert At</label>
            <input type="number" name="low_stock_level" value={form.low_stock_level}
              onChange={handleChange} placeholder="5" min="0" className="input" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? "Saving..." : "Add Part"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}