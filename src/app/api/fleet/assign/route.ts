import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  const { vehicleId, fleetId } = await req.json();
  const { error } = await supabase.from("vehicles").update({ fleet_id: fleetId }).eq("id", vehicleId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { vehicleId } = await req.json();
  const { error } = await supabase.from("vehicles").update({ fleet_id: null }).eq("id", vehicleId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
