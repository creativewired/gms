import { supabase } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";
import PrintClient from "./PrintClient";

export default async function PrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jobId = Number(id);

  const [{ data: job }, { data: items }, { data: settings }, { data: inspection }] =
    await Promise.all([
      supabase
        .from("jobs")
        .select(`
          *,
          vehicles (
            plate_number, make, model, year, color, vin, mileage,
            customers ( name, phone, email )
          )
        `)
        .eq("id", jobId)
        .single(),
      supabase.from("job_items").select("*").eq("job_id", jobId).order("id"),
      supabase.from("settings").select("*").single(),
      supabase
        .from("inspection_checklists")
        .select("*")
        .eq("job_id", jobId)
        .single(),
    ]);

  if (!job) return notFound();

  return (
    <PrintClient
      job={job}
      items={items ?? []}
      settings={settings}
      inspection={inspection}
    />
  );
}
