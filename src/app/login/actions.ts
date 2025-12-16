"use server";

export async function getDevBypassEmail() {
  const devEmail = process.env.DEV_BYPASS_EMAIL;
  const isDev = process.env.NODE_ENV === "development";

  if (!isDev || !devEmail) {
    return null;
  }

  return devEmail;
}

export async function shouldShowDevLogin(): Promise<boolean> {
  const isDev = process.env.NODE_ENV === "development";
  const devEmail = process.env.DEV_BYPASS_EMAIL;
  return isDev && !!devEmail && devEmail !== "dev@example.com";
}
