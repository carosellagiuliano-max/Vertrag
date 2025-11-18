import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { env } from "@/lib/config/env";
import { getServiceRoleClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  if (!env.stripeSecretKey || !sig) {
    return NextResponse.json({ error: "Missing keys" }, { status: 400 });
  }

  const stripe = new Stripe(env.stripeSecretKey, { apiVersion: "2024-11-20" });

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, "whsec_test_123"); // Use real webhook secret in prod
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata?.orderId;

    if (orderId) {
      const client = getServiceRoleClient();
      if (client) {
        await client
          .from("orders")
          .update({ status: "paid", stripe_payment_intent: paymentIntent.id })
          .eq("id", orderId)
          .eq("status", "pending");
      }
    }
  }

  return NextResponse.json({ received: true });
}