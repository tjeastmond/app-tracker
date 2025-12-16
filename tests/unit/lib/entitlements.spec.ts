import { describe, it, expect, vi, beforeEach } from "vitest";
import { testDb, createTestUser, createPaidTestUser } from "../setup";

// Mock the db module
vi.mock("@/lib/db", () => ({
  db: testDb,
}));

// Import after mocks
import { getUserEntitlement, isPaidUser, upgradeUserToPaidLifetime } from "@/lib/entitlements";

describe("getUserEntitlement", () => {
  it("returns FREE plan for free user", async () => {
    const user = await createTestUser();

    const entitlement = await getUserEntitlement(user.id);

    expect(entitlement.plan).toBe("FREE");
    expect(entitlement.isPaid).toBe(false);
  });

  it("returns PAID_LIFETIME plan for paid user", async () => {
    const user = await createPaidTestUser();

    const entitlement = await getUserEntitlement(user.id);

    expect(entitlement.plan).toBe("PAID_LIFETIME");
    expect(entitlement.isPaid).toBe(true);
  });

  it("returns FREE plan for non-existent user", async () => {
    const entitlement = await getUserEntitlement(
      "123e4567-e89b-12d3-a456-426614174000"
    );

    expect(entitlement.plan).toBe("FREE");
    expect(entitlement.isPaid).toBe(false);
  });
});

describe("isPaidUser", () => {
  it("returns false for free user", async () => {
    const user = await createTestUser();

    const result = await isPaidUser(user.id);

    expect(result).toBe(false);
  });

  it("returns true for paid user", async () => {
    const user = await createPaidTestUser();

    const result = await isPaidUser(user.id);

    expect(result).toBe(true);
  });

  it("returns false for non-existent user", async () => {
    const result = await isPaidUser("123e4567-e89b-12d3-a456-426614174000");

    expect(result).toBe(false);
  });
});

describe("upgradeUserToPaidLifetime", () => {
  it("upgrades free user to paid", async () => {
    const user = await createTestUser();

    // Verify initially free
    const beforeUpgrade = await isPaidUser(user.id);
    expect(beforeUpgrade).toBe(false);

    // Upgrade
    await upgradeUserToPaidLifetime(user.id);

    // Verify now paid
    const afterUpgrade = await isPaidUser(user.id);
    expect(afterUpgrade).toBe(true);
  });

  it("handles upgrading already paid user", async () => {
    const user = await createPaidTestUser();

    // Upgrade again (should not error)
    await upgradeUserToPaidLifetime(user.id);

    // Verify still paid
    const result = await isPaidUser(user.id);
    expect(result).toBe(true);
  });

  it("creates entitlement for user without one", async () => {
    const user = await createTestUser();

    // Upgrade
    await upgradeUserToPaidLifetime(user.id);

    // Verify upgraded
    const entitlement = await getUserEntitlement(user.id);
    expect(entitlement.plan).toBe("PAID_LIFETIME");
    expect(entitlement.isPaid).toBe(true);
  });
});
