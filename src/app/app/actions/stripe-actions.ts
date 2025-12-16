"use server";

import { requireAppUserId } from "@/lib/require-user";
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe";
import { getUserEntitlement as getUserEntitlementLib } from "@/lib/entitlements";
import { env } from "@/lib/env";

export async function createCheckoutSession(): Promise<{ url: string }> {
  const userId = await requireAppUserId();

  // Get or create Stripe customer
  const customerId = await getOrCreateStripeCustomer(userId);

  // Determine the base URL for redirects
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price: env.STRIPE_PRICE_ID_LIFETIME,
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${baseUrl}/app?upgraded=true`,
    cancel_url: `${baseUrl}/app?cancelled=true`,
    metadata: {
      userId,
    },
  });

  if (!session.url) {
    throw new Error("Failed to create checkout session");
  }

  return { url: session.url };
}

export async function getUserEntitlement() {
  const userId = await requireAppUserId();
  return getUserEntitlementLib(userId);
}
