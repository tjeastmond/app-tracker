"use server";

import { requireAdmin } from "@/lib/require-admin";
import { db } from "@/lib/db";
import { users, userEntitlements, userSettings } from "@drizzle/schema";
import { UserCreateSchema, UserUpdateSchema } from "@/lib/validators";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function listUsers() {
  await requireAdmin();

  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      plan: userEntitlements.plan,
    })
    .from(users)
    .leftJoin(userEntitlements, eq(users.id, userEntitlements.userId))
    .orderBy(desc(users.createdAt));

  return allUsers;
}

export async function createUser(input: unknown) {
  await requireAdmin();
  const data = UserCreateSchema.parse(input);

  // Check if user with this email already exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, data.email),
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  const [user] = await db
    .insert(users)
    .values({
      email: data.email,
      isAdmin: data.isAdmin ?? false,
    })
    .returning();

  // Bootstrap entitlements and settings for new user
  await db.insert(userEntitlements).values({
    userId: user.id,
    plan: "FREE",
  });

  await db.insert(userSettings).values({
    userId: user.id,
    appliedFollowupDays: 7,
    interviewFollowupDays: 5,
    remindersEnabled: 1,
  });

  revalidatePath("/admin/users");
  return user;
}

export async function updateUser(input: unknown) {
  await requireAdmin();
  const data = UserUpdateSchema.parse(input);

  // Check if email is being changed and if it's already in use
  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, data.id),
  });

  if (!existingUser) {
    throw new Error("User not found");
  }

  if (data.email !== existingUser.email) {
    const emailInUse = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    });

    if (emailInUse) {
      throw new Error("Email already in use by another user");
    }
  }

  const [user] = await db
    .update(users)
    .set({
      email: data.email,
      isAdmin: data.isAdmin,
      updatedAt: new Date(),
    })
    .where(eq(users.id, data.id))
    .returning();

  if (!user) {
    throw new Error("User not found");
  }

  revalidatePath("/admin/users");
  return user;
}

export async function deleteUser(id: string) {
  await requireAdmin();

  const [user] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning();

  if (!user) {
    throw new Error("User not found");
  }

  revalidatePath("/admin/users");
  return user;
}

export async function getUserById(id: string) {
  await requireAdmin();

  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}
