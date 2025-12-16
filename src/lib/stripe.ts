import Stripe from "stripe";
import { env } from "./env";
import { db } from "./db";
import { stripeCustomers, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-11-17.clover",
  typescript: true,
});

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  // Check if customer already exists
  const existing = await db
    .select()
    .from(stripeCustomers)
    .where(eq(stripeCustomers.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].stripeCustomerId;
  }

  // Get user email
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user.length === 0) {
    throw new Error("User not found");
  }

  // Create Stripe customer
  const customer = await stripe.customers.create({
    email: user[0].email,
    metadata: {
      userId,
    },
  });

  // Store customer ID
  await db.insert(stripeCustomers).values({
    userId,
    stripeCustomerId: customer.id,
  });

  return customer.id;
}
