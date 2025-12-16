import { db } from "./db";
import { userEntitlements } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export type UserPlan = "FREE" | "PAID_LIFETIME";

export interface UserEntitlement {
  plan: UserPlan;
  isPaid: boolean;
}

/**
 * Get user's current entitlement/plan
 */
export async function getUserEntitlement(userId: string): Promise<UserEntitlement> {
  const entitlement = await db
    .select()
    .from(userEntitlements)
    .where(eq(userEntitlements.userId, userId))
    .limit(1);

  if (entitlement.length === 0) {
    // Default to free if no entitlement found
    return {
      plan: "FREE",
      isPaid: false,
    };
  }

  const plan = entitlement[0].plan;
  return {
    plan,
    isPaid: plan === "PAID_LIFETIME",
  };
}

/**
 * Check if user has a paid plan
 */
export async function isPaidUser(userId: string): Promise<boolean> {
  const entitlement = await getUserEntitlement(userId);
  return entitlement.isPaid;
}

/**
 * Upgrade user to paid lifetime plan
 */
export async function upgradeUserToPaidLifetime(userId: string): Promise<void> {
  await db
    .insert(userEntitlements)
    .values({
      userId,
      plan: "PAID_LIFETIME",
    })
    .onConflictDoUpdate({
      target: userEntitlements.userId,
      set: {
        plan: "PAID_LIFETIME",
        updatedAt: new Date(),
      },
    });
}
