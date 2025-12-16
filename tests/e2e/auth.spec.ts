import { test, expect } from "@playwright/test";
import { loginAsTestUser, logout } from "./helpers/auth";

test.describe("Authentication", () => {
  test("redirects unauthenticated user to login", async ({ page }) => {
    await page.goto("/app");

    await expect(page).toHaveURL(/\/login/);
  });

  test("user can login with dev bypass", async ({ page }) => {
    await page.goto("/login");

    // Verify dev login button is visible
    await expect(page.locator('button:has-text("Dev Login")')).toBeVisible();

    // Click dev login
    await page.click('button:has-text("Dev Login")');

    // Should redirect to app
    await expect(page).toHaveURL("/app");
  });

  test("logged in user can access app", async ({ page }) => {
    await loginAsTestUser(page);

    // Verify on app page
    await expect(page).toHaveURL("/app");
    
    // Verify app content is visible
    await expect(page.locator("text=Job Tracker")).toBeVisible();
  });

  test("user session persists across page reloads", async ({ page }) => {
    await loginAsTestUser(page);

    // Reload page
    await page.reload();

    // Should still be on app page
    await expect(page).toHaveURL("/app");
  });

  test("user can logout", async ({ page }) => {
    await loginAsTestUser(page);

    // Logout
    await logout(page);

    // Navigate to app
    await page.goto("/app");

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
