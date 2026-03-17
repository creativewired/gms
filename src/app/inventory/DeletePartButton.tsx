"use client";

import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeletePartButton({ partId }: { partId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    const confirmed = confirm("Delete this part from inventory?");
    if (!confirmed) return;

    setLoading(true);
    await supabase.from("inventory").delete().eq("id", partId);
    setLoading(false);
    router.refresh();
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="btn-danger"
    >
      {loading ? "..." : "Delete"}
    </button>
  );
}
