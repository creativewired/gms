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
    await supabase
      .from("jobs")
      .update({ problem_description: value })
      .eq("id", jobId);
    setLoading(false);
    setEditing(false);
    router.refresh();
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-slate-700 text-sm">{currentDescription ?? "—"}</span>
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-blue-500 hover:underline"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-1">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="border border-slate-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 w-64"
      />
      <button
        onClick={handleSave}
        disabled={loading}
        className="text-xs bg-slate-900 text-white px-3 py-1 rounded-md hover:bg-slate-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save"}
      </button>
      <button
        onClick={() => setEditing(false)}
        className="text-xs text-slate-400 hover:underline"
      >
        Cancel
      </button>
    </div>
  );
}
