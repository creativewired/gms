"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function EditJobForm({
  jobId,
  currentDescription,
}: {
  jobId: number;
  currentDescription: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentDescription ?? "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await supabase.from("jobs").update({ problem_description: value }).eq("id", jobId);
    setLoading(false);
    setEditing(false);
    router.refresh();
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-slate-700 text-sm">{currentDescription ?? "—"}</span>
        <button onClick={() => setEditing(true)} className="text-xs text-blue-500 hover:underline shrink-0">
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 mt-1">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        className="input flex-1"
      />
      <div className="flex gap-2 shrink-0">
        <button onClick={handleSave} disabled={loading} className="btn-primary text-xs">
          {loading ? "Saving..." : "Save"}
        </button>
        <button onClick={() => setEditing(false)} className="btn-ghost text-xs">Cancel</button>
      </div>
    </div>
  );
}