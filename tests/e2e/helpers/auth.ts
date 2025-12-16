import { Page } from "@playwright/test";

/**
 * Logs in as test automation user using dev bypass
 * Requires DEV_BYPASS_EMAIL to be set to test_automation@example.com
 */
export async function loginAsTestUser(page: Page) {
  await page.goto("/login");
  
  // Click the dev login button
  await page.click('button:has-text("Dev Login")');
  
  // Wait for redirect to /app
  await page.waitForURL("/app");
}

/**
 * Checks if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  await page.goto("/app");
  
  // If redirected to login, not logged in
  if (page.url().includes("/login")) {
    return false;
  }
  
  return true;
}

/**
 * Clears all cookies and storage to log out
 */
export async function logout(page: Page) {
  await page.context().clearCookies();
  await page.context().clearPermissions();
}
