"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Settings = {
  id: number;
  garage_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  trn_number: string | null;
};

export default function SettingsForm({ settings }: { settings: Settings }) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    garage_name: settings?.garage_name ?? "",
    phone: settings?.phone ?? "",
    email: settings?.email ?? "",
    address: settings?.address ?? "",
    trn_number: settings?.trn_number ?? "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.garage_name) return alert("Garage name is required!");
    setLoading(true);

    const { error } = await supabase
      .from("settings")
      .update({
        garage_name: form.garage_name,
        phone: form.phone,
        email: form.email,
        address: form.address,
        trn_number: form.trn_number,
      })
      .eq("id", settings.id);

    setLoading(false);

    if (error) {
      alert("Error: " + error.message);
    } else {
      setSaved(true);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm max-w-xl space-y-4"
    >
      <div>
        <label className="block text-xs text-slate-500 mb-1">
          Garage Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="garage_name"
          value={form.garage_name}
          onChange={handleChange}
          placeholder="Al Quoz Auto Garage"
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
          placeholder="0501234567"
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
          placeholder="info@garage.ae"
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Address</label>
        <textarea
          name="address"
          value={form.address}
          onChange={handleChange}
          placeholder="Al Quoz Industrial Area, Dubai, UAE"
          rows={2}
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">
          TRN Number{" "}
          <span className="text-slate-400">(for VAT invoices)</span>
        </label>
        <input
          type="text"
          name="trn_number"
          value={form.trn_number}
          onChange={handleChange}
          placeholder="100123456700003"
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>
      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-slate-900 text-white text-sm px-5 py-2 rounded-md hover:bg-slate-700 disabled:opacity-50 transition"
        >
          {loading ? "Saving..." : "Save Settings"}
        </button>
        {saved && (
          <span className="text-green-500 text-sm font-medium">
            ✅ Saved successfully!
          </span>
        )}
      </div>
    </form>
  );
}
