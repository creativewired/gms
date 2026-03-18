"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Customer = { id: number; name: string; phone: string | null; email: string | null };

export default function EditCustomerForm({ customer }: { customer: Customer }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: customer.name,
    phone: customer.phone ?? "",
    email: customer.email ?? "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return alert("Name is required!");
    setLoading(true);
    const { error } = await supabase.from("customers")
      .update({ name: form.name, phone: form.phone, email: form.email })
      .eq("id", customer.id);
    setLoading(false);
    if (error) { alert("Error: " + error.message); }
    else { router.push("/customers"); router.refresh(); }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this customer? This will also delete all their vehicles and jobs!")) return;
    const { error } = await supabase.from("customers").delete().eq("id", customer.id);
    if (error) { alert("Error: " + error.message); }
    else { router.push("/customers"); router.refresh(); }
  };

  return (
    <div className="card p-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Full Name <span className="text-red-400">*</span></label>
          <input type="text" name="name" value={form.name} onChange={handleChange} className="input" />
        </div>
        <div>
          <label className="label">Phone</label>
          <input type="text" name="phone" value={form.phone} onChange={handleChange} className="input" />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} className="input" />
        </div>
        <div className="flex items-center justify-between pt-1">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <button type="button" onClick={handleDelete}
            className="text-red-500 text-sm hover:underline">
            Delete Customer
          </button>
        </div>
      </form>
    </div>
  );
}