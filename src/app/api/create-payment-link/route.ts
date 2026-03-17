import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  try {
    const { jobId } = await req.json();

    if (!jobId) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    // Fetch job with items
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*, vehicles(plate_number, make, model, customers(name, email))")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const { data: items } = await supabase
      .from("job_items")
      .select("*")
      .eq("job_id", jobId);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const customerName = job.vehicles?.customers?.name ?? "Customer";
    const plateNumber = job.vehicles?.plate_number ?? "Vehicle";

    // Build Stripe line items
    const lineItems = (items ?? []).map((item) => ({
      price_data: {
        currency: "aed",
        product_data: {
          name: item.description,
          metadata: { job_id: String(jobId) },
        },
        unit_amount: Math.round(Number(item.unit_price) * 100),
      },
      quantity: item.quantity,
    }));

    // Fallback if no items
    if (lineItems.length === 0) {
      lineItems.push({
        price_data: {
          currency: "aed",
          product_data: {
            name: `Workshop Service — ${plateNumber}`,
            metadata: { job_id: String(jobId) },
          },
          unit_amount: Math.round(Number(job.total_amount) * 100),
        },
        quantity: 1,
      });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${appUrl}/jobs/${jobId}?payment=success`,
      cancel_url: `${appUrl}/jobs/${jobId}?payment=cancelled`,
      customer_email: job.vehicles?.customers?.email ?? undefined,
      metadata: {
        job_id: String(jobId),
        customer_name: customerName,
        plate_number: plateNumber,
      },
      custom_text: {
        submit: {
          message: `Payment for workshop services — ${plateNumber} (${customerName})`,
        },
      },
    });

    // Save payment link to job
    await supabase
      .from("jobs")
      .update({
        payment_link: session.url,
        payment_status: "pending",
        stripe_session_id: session.id,
      })
      .eq("id", jobId);

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err: any) {
    console.error("Stripe error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
