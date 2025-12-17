import { redirect } from "next/navigation";
import { auth } from "./auth";
import { db } from "./db";
import { users } from "@drizzle/schema";
import { eq } from "drizzle-orm";

export async function requireAdmin(): Promise<string> {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }
  
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });
  
  if (!user?.isAdmin) {
    redirect("/app");
  }
  
  return session.user.id;
}

export async function checkIsAdmin(): Promise<boolean> {
  const session = await auth();
  
  if (!session?.user?.id) {
    return false;
  }
  
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });
  
  return user?.isAdmin ?? false;
}
