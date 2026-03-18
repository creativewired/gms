"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Customer = { id: number; name: string };

export default function AddVehicleForm({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vinLoading, setVinLoading] = useState(false);
  const [vinError, setVinError] = useState("");
  const [vinSuccess, setVinSuccess] = useState(false);
  const [form, setForm] = useState({
    customer_id: "",
    plate_number: "",
    vin: "",
    make: "",
    model: "",
    year: "",
    color: "",
    engine: "",
    transmission: "",
    fuel_type: "",
    mileage: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === "vin") {
      setVinError("");
      setVinSuccess(false);
    }
  };

  const handleVinLookup = async () => {
    if (!form.vin || form.vin.length !== 17) {
      setVinError("VIN must be exactly 17 characters");
      return;
    }
    setVinLoading(true);
    setVinError("");
    setVinSuccess(false);
    try {
      const res = await fetch(`/api/vin-lookup?vin=${form.vin}`);
      const data = await res.json();
      if (data.error) {
        setVinError(data.error);
      } else {
        setForm((prev) => ({
          ...prev,
          make: data.make ?? prev.make,
          model: data.model ?? prev.model,
          year: data.year ? String(data.year) : prev.year,
          engine: data.engine ?? prev.engine,
          transmission: data.transmission ?? prev.transmission,
          fuel_type: data.fuel_type ?? prev.fuel_type,
        }));
        setVinSuccess(true);
      }
    } catch {
      setVinError("Lookup failed. Please enter details manually.");
    }
    setVinLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_id) return alert("Please select a customer!");
    if (!form.plate_number) return alert("Plate number is required!");
    setLoading(true);
    const { error } = await supabase.from("vehicles").insert([{
      customer_id: Number(form.customer_id),
      plate_number: form.plate_number.toUpperCase(),
      vin: form.vin || null,
      make: form.make || null,
      model: form.model || null,
      year: form.year ? Number(form.year) : null,
      color: form.color || null,
      engine: form.engine || null,
      transmission: form.transmission || null,
      fuel_type: form.fuel_type || null,
      mileage: form.mileage ? Number(form.mileage) : null,
    }]);
    setLoading(false);
    if (error) {
      alert("Error: " + error.message);
    } else {
      setForm({
        customer_id: "", plate_number: "", vin: "", make: "",
        model: "", year: "", color: "", engine: "",
        transmission: "", fuel_type: "", mileage: "",
      });
      setVinSuccess(false);
      setOpen(false);
      router.refresh();
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary">
        + Add Vehicle
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)" }}>
      <div className="bg-white w-full sm:rounded-2xl shadow-2xl overflow-y-auto rounded-t-2xl"
        style={{ maxWidth: "560px", maxHeight: "92vh" }}>

        {/* Header */}
        <div className="px-5 sm:px-7 py-4 sm:py-5 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <h3 className="text-base font-semibold text-slate-800">Add Vehicle</h3>
          <button onClick={() => setOpen(false)} className="btn-ghost text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-5">

          {/* VIN Lookup Banner */}
          <div className="rounded-2xl p-4"
            style={{ background: "linear-gradient(135deg, #f5f3ff, #ede9fe)", border: "1px solid #ddd6fe" }}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "#7c3aed" }}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">VIN Auto-Fill</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter a 17-character VIN to auto-fill make, model, year & specs
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                name="vin"
                value={form.vin}
                onChange={handleChange}
                placeholder="e.g. 1HGBH41JXMN109186"
                maxLength={17}
                className="input flex-1 min-w-0"
                style={{ fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.05em" }}
              />
              <button
                type="button"
                onClick={handleVinLookup}
                disabled={vinLoading || form.vin.length !== 17}
                className="btn-primary shrink-0"
                style={{ background: "#7c3aed" }}
              >
                {vinLoading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : "Lookup"}
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div>
                {vinError && <p className="text-xs text-red-500">{vinError}</p>}
                {vinSuccess && (
                  <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Vehicle details auto-filled!
                  </p>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">{form.vin.length}/17</p>
            </div>
          </div>

          {/* Customer */}
          <div>
            <label className="label">Customer <span className="text-red-400">*</span></label>
            <select name="customer_id" value={form.customer_id} onChange={handleChange} className="input">
              <option value="">Select customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Plate Number */}
          <div>
            <label className="label">Plate Number <span className="text-red-400">*</span></label>
            <input
              type="text"
              name="plate_number"
              value={form.plate_number}
              onChange={handleChange}
              placeholder="e.g. A 12345 Dubai"
              className="input"
              style={{ textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}
            />
          </div>

          {/* Make / Model / Year */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Make</label>
              <input type="text" name="make" value={form.make}
                onChange={handleChange} placeholder="Toyota" className="input" />
            </div>
            <div>
              <label className="label">Model</label>
              <input type="text" name="model" value={form.model}
                onChange={handleChange} placeholder="Camry" className="input" />
            </div>
            <div>
              <label className="label">Year</label>
              <input type="number" name="year" value={form.year}
                onChange={handleChange} placeholder="2022"
                min="1980" max="2026" className="input" />
            </div>
          </div>

          {/* Color / Mileage */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Color</label>
              <input type="text" name="color" value={form.color}
                onChange={handleChange} placeholder="e.g. White" className="input" />
            </div>
            <div>
              <label className="label">Mileage (km)</label>
              <input type="number" name="mileage" value={form.mileage}
                onChange={handleChange} placeholder="e.g. 45000" min="0" className="input" />
            </div>
          </div>

          {/* Engine / Transmission / Fuel */}
          <div>
            <p className="label mb-2">Technical Specs
              {vinSuccess && (
                <span className="ml-2 text-emerald-500 normal-case font-normal">
                  (auto-filled from VIN)
                </span>
              )}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="label">Engine</label>
                <input type="text" name="engine" value={form.engine}
                  onChange={handleChange} placeholder="e.g. 2.5L V6" className="input" />
              </div>
              <div>
                <label className="label">Transmission</label>
                <input type="text" name="transmission" value={form.transmission}
                  onChange={handleChange} placeholder="Automatic" className="input" />
              </div>
              <div>
                <label className="label">Fuel Type</label>
                <input type="text" name="fuel_type" value={form.fuel_type}
                  onChange={handleChange} placeholder="Petrol" className="input" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={loading} className="btn-primary flex-1 sm:flex-none">
              {loading ? "Adding..." : "Add Vehicle"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1 sm:flex-none">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}