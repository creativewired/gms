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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    if (error) alert("Error: " + error.message);
    else setSaved(true);
  };

  const fields = [
    {
      label: "Garage Name",
      name: "garage_name",
      type: "text",
      placeholder: "Al Quoz Auto Garage",
      required: true,
      hint: null,
    },
    {
      label: "Phone",
      name: "phone",
      type: "text",
      placeholder: "+971 50 123 4567",
      required: false,
      hint: null,
    },
    {
      label: "Email",
      name: "email",
      type: "email",
      placeholder: "info@garage.ae",
      required: false,
      hint: null,
    },
    {
      label: "TRN Number",
      name: "trn_number",
      type: "text",
      placeholder: "100123456700003",
      required: false,
      hint: "Used on VAT invoices",
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Garage Identity */}
      <div className="card p-5 sm:p-6 space-y-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Garage Identity
        </p>

        {fields.slice(0, 1).map(f => (
          <div key={f.name}>
            <label className="label">
              {f.label}
              {f.required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            <input
              type={f.type}
              name={f.name}
              value={form[f.name as keyof typeof form]}
              onChange={handleChange}
              placeholder={f.placeholder}
              className="input"
            />
          </div>
        ))}

        <div>
          <label className="label">Address</label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Al Quoz Industrial Area, Dubai, UAE"
            rows={2}
            className="input resize-none"
          />
        </div>
      </div>

      {/* Contact Details */}
      <div className="card p-5 sm:p-6 space-y-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Contact Details
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.slice(1, 3).map(f => (
            <div key={f.name}>
              <label className="label">{f.label}</label>
              <input
                type={f.type}
                name={f.name}
                value={form[f.name as keyof typeof form]}
                onChange={handleChange}
                placeholder={f.placeholder}
                className="input"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Tax & Legal */}
      <div className="card p-5 sm:p-6 space-y-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Tax & Legal
        </p>
        {fields.slice(3).map(f => (
          <div key={f.name}>
            <label className="label">
              {f.label}
              {f.hint && <span className="ml-1.5 text-slate-400 normal-case font-normal">({f.hint})</span>}
            </label>
            <input
              type={f.type}
              name={f.name}
              value={form[f.name as keyof typeof form]}
              onChange={handleChange}
              placeholder={f.placeholder}
              className="input"
            />
          </div>
        ))}
      </div>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Saving..." : "Save Settings"}
        </button>
        {saved && (
          <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Saved successfully
          </div>
        )}
      </div>
    </form>
  );
}