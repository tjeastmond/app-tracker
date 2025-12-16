import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { upgradeUserToPaidLifetime } from "@/lib/entitlements";
import { env } from "@/lib/env";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    if (env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );
    } else {
      // In development without webhook secret, parse the body directly
      // This is insecure and should only be used for local testing
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Get user ID from metadata
        const userId = session.metadata?.userId;
        
        if (!userId) {
          console.error("No userId in session metadata");
          return NextResponse.json(
            { error: "Missing userId in metadata" },
            { status: 400 }
          );
        }

        // Verify payment was successful
        if (session.payment_status === "paid") {
          // Upgrade user to paid lifetime plan
          await upgradeUserToPaidLifetime(userId);
          console.log(`User ${userId} upgraded to PAID_LIFETIME`);
        }
        
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Error processing webhook:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
