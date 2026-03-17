"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function EstimateStatusSelect({
  estimateId,
  currentStatus,
}: {
  estimateId: number;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    await supabase.from("estimates").update({ status }).eq("id", estimateId);
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-3">
      <select value={status} onChange={(e) => setStatus(e.target.value)} className="input w-auto">
        <option value="draft">Draft</option>
        <option value="sent">Sent</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
      <button onClick={handleUpdate} disabled={loading} className="btn-primary">
        {loading ? "Saving..." : "Update Status"}
      </button>
    </div>
  );
}
