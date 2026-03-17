import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  try {
    const { jobId, signatureData, signedBy } = await req.json();

    if (!jobId || !signatureData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { error } = await supabase
      .from("jobs")
      .update({
        signature_data: signatureData,
        signed_at: new Date().toISOString(),
        signed_by: signedBy || "Customer",
      })
      .eq("id", jobId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
