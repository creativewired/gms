"use client";

import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ConvertToJobButton({
  estimateId,
  vehicleId,
  description,
}: {
  estimateId: number;
  vehicleId: number;
  description: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleConvert = async () => {
    const confirmed = confirm("Convert this estimate to a job?");
    if (!confirmed) return;

    setLoading(true);

    const { data: job, error } = await supabase.from("jobs").insert([{
      vehicle_id: vehicleId,
      problem_description: description || "Converted from estimate",
      status: "pending",
      total_amount: 0,
      checked_in_at: new Date().toISOString(),
    }]).select().single();

    if (error) {
      alert("Error: " + error.message);
      setLoading(false);
      return;
    }

    // Copy estimate items to job items
    const { data: estimateItems } = await supabase
      .from("estimate_items")
      .select("*")
      .eq("estimate_id", estimateId);

    if (estimateItems && estimateItems.length > 0) {
      await supabase.from("job_items").insert(
        estimateItems.map((i) => ({
          job_id: job.id,
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price,
          line_total: i.line_total,
        }))
      );

      const total = estimateItems.reduce((sum, i) => sum + Number(i.line_total), 0);
      await supabase.from("jobs").update({ total_amount: total }).eq("id", job.id);
    }

    await supabase.from("estimates").update({ status: "approved" }).eq("id", estimateId);

    setLoading(false);
    router.push(`/jobs/${job.id}`);
  };

  return (
    <button onClick={handleConvert} disabled={loading}
      style={{ backgroundColor: "#059669" }}
      className="btn-primary">
      {loading ? "Converting..." : "Convert to Job"}
    </button>
  );
}
