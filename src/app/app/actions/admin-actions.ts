"use server";

import { checkIsAdmin } from "@/lib/require-admin";

export async function checkIsAdminAction(): Promise<boolean> {
  return await checkIsAdmin();
}
