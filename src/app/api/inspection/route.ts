import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobId, ...fields } = body;

    if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

    // Upsert — one checklist per job
    const { data, error } = await supabase
      .from("inspection_checklists")
      .upsert({ job_id: jobId, ...fields, updated_at: new Date().toISOString() },
        { onConflict: "job_id" })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
