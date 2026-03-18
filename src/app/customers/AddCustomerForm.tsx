"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AddCustomerForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return alert("Name is required!");
    setLoading(true);
    const { error } = await supabase.from("customers").insert([{
      name: form.name, phone: form.phone, email: form.email,
    }]);
    setLoading(false);
    if (error) {
      alert("Error: " + error.message);
    } else {
      setForm({ name: "", phone: "", email: "" });
      setOpen(false);
      router.refresh();
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary">+ Add Customer</button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)" }}>
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-slate-800">Add New Customer</h3>
          <button onClick={() => setOpen(false)} className="btn-ghost text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name <span className="text-red-400">*</span></label>
            <input type="text" name="name" value={form.name} onChange={handleChange}
              placeholder="Ahmed Khan" className="input" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input type="text" name="phone" value={form.phone} onChange={handleChange}
              placeholder="0501234567" className="input" />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="ahmed@example.com" className="input" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? "Saving..." : "Add Customer"}
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