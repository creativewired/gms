import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const vin = searchParams.get("vin");

  if (!vin) {
    return NextResponse.json({ error: "VIN required" }, { status: 400 });
  }

  if (vin.length !== 17) {
    return NextResponse.json({ error: "VIN must be 17 characters" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.api-ninjas.com/v1/vinlookup?vin=${vin}`,
      {
        headers: { "X-Api-Key": process.env.API_NINJAS_KEY! },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "VIN lookup failed" }, { status: 400 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
