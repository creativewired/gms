"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function UpdateStatusButton({
  jobId,
  currentStatus,
}: {
  jobId: number;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    await supabase.from("jobs").update({ status }).eq("id", jobId);
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="input"
        style={{ width: "auto", minWidth: "140px" }}
      >
        <option value="pending">Pending</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>
      <button
        onClick={handleUpdate}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? "Saving..." : "Update"}
      </button>
    </div>
  );
}
