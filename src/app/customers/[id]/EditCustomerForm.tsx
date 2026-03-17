"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Customer = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
};

export default function EditCustomerForm({ customer }: { customer: Customer }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: customer.name,
    phone: customer.phone ?? "",
    email: customer.email ?? "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return alert("Name is required!");
    setLoading(true);

    const { error } = await supabase
      .from("customers")
      .update({ name: form.name, phone: form.phone, email: form.email })
      .eq("id", customer.id);

    setLoading(false);

    if (error) {
      alert("Error: " + error.message);
    } else {
      router.push("/customers");
      router.refresh();
    }
  };

  const handleDelete = async () => {
    const confirmed = confirm("Are you sure you want to delete this customer? This will also delete all their vehicles and jobs!");
    if (!confirmed) return;

    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", customer.id);

    if (error) {
      alert("Error: " + error.message);
    } else {
      router.push("/customers");
      router.refresh();
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Full Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Phone</label>
          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
        <div className="flex items-center justify-between pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-slate-900 text-white text-sm px-5 py-2 rounded-md hover:bg-slate-700 disabled:opacity-50 transition"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="text-red-500 text-sm hover:underline"
          >
            Delete Customer
          </button>
        </div>
      </form>
    </div>
  );
}
