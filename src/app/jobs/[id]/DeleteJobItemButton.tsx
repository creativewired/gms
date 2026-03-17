"use client";

import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function DeleteJobItemButton({
  itemId,
  jobId,
}: {
  itemId: number;
  jobId: number;
}) {
  const router = useRouter();

  const handleDelete = async () => {
    const confirmed = confirm("Remove this item?");
    if (!confirmed) return;

    await supabase.from("job_items").delete().eq("id", itemId);

    // Recalculate total
    const { data: remaining } = await supabase
      .from("job_items")
      .select("line_total")
      .eq("job_id", jobId);

    const newTotal = (remaining ?? []).reduce(
      (sum, i) => sum + Number(i.line_total),
      0
    );

    await supabase
      .from("jobs")
      .update({ total_amount: newTotal })
      .eq("id", jobId);

    router.refresh();
  };

  return (
    <button
      onClick={handleDelete}
      className="text-red-400 hover:text-red-600 text-xs hover:underline"
    >
      Remove
    </button>
  );
}
