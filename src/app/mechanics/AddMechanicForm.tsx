"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AddMechanicForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return alert("Name is required!");
    const savedBranch = localStorage.getItem("workshopos_branch");
    const branchId = savedBranch ? JSON.parse(savedBranch).id : null;
    setLoading(true);
    const { error } = await supabase.from("mechanics").insert([{
      name: form.name,
      phone: form.phone || null,
      branch_id: branchId,
    }]);
    setLoading(false);
    if (error) {
      alert("Error: " + error.message);
    } else {
      setForm({ name: "", phone: "" });
      setOpen(false);
      router.refresh();
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary">
        + Add Mechanic
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)" }}>
      <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-slate-800">Add Mechanic</h3>
          <button onClick={() => setOpen(false)} className="btn-ghost text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name <span className="text-red-400">*</span></label>
            <input type="text" name="name" value={form.name}
              onChange={handleChange} placeholder="e.g. Ahmed Al Rashidi" className="input" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input type="text" name="phone" value={form.phone}
              onChange={handleChange} placeholder="e.g. +971 50 123 4567" className="input" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? "Saving..." : "Add Mechanic"}
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