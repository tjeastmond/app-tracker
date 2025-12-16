import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "./helpers/auth";

test.describe("Free Tier Limits", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test("user cannot create more than 10 jobs on free tier", async ({ page }) => {
    // Create 10 jobs (the limit)
    for (let i = 1; i <= 10; i++) {
      await page.click('button:has-text("Add Job")');
      await page.fill('[name="company"]', `Company ${i}`);
      await page.fill('[name="role"]', "Engineer");
      await page.selectOption('[name="status"]', "SAVED");
      await page.click('button:has-text("Save")');
    }

    // Try to create 11th job
    await page.click('button:has-text("Add Job")');
    await page.fill('[name="company"]', "Company 11");
    await page.fill('[name="role"]', "Engineer");
    await page.selectOption('[name="status"]', "SAVED");
    await page.click('button:has-text("Save")');

    // Should show error about free tier limit
    await expect(
      page.locator("text=Free tier limit reached")
    ).toBeVisible();
  });

  test("user sees upgrade banner on free tier", async ({ page }) => {
    // Should see upgrade banner or message
    await expect(
      page.locator("text=Upgrade").or(page.locator("text=10 jobs max"))
    ).toBeVisible();
  });

  test("job count is displayed for free tier users", async ({ page }) => {
    // Create a few jobs
    for (let i = 1; i <= 3; i++) {
      await page.click('button:has-text("Add Job")');
      await page.fill('[name="company"]', `Test Company ${i}`);
      await page.fill('[name="role"]', "Engineer");
      await page.selectOption('[name="status"]', "SAVED");
      await page.click('button:has-text("Save")');
    }

    // Should show job count (e.g., "3/10 jobs")
    await expect(page.locator("text=/\\d+\\/10/")).toBeVisible();
  });

  test("deleting job frees up slot for free tier user", async ({ page }) => {
    // Create 10 jobs
    for (let i = 1; i <= 10; i++) {
      await page.click('button:has-text("Add Job")');
      await page.fill('[name="company"]', `Slot Test ${i}`);
      await page.fill('[name="role"]', "Engineer");
      await page.selectOption('[name="status"]', "SAVED");
      await page.click('button:has-text("Save")');
    }

    // Delete one job
    await page.click("text=Slot Test 1");
    await page.click('button:has-text("Delete")');
    
    if (await page.locator('button:has-text("Confirm")').isVisible()) {
      await page.click('button:has-text("Confirm")');
    }

    // Should now be able to create another job
    await page.click('button:has-text("Add Job")');
    await page.fill('[name="company"]', "New Job After Delete");
    await page.fill('[name="role"]', "Engineer");
    await page.selectOption('[name="status"]', "SAVED");
    await page.click('button:has-text("Save")');

    // Verify job was created
    await expect(page.locator("text=New Job After Delete")).toBeVisible();
  });

  test("upgrade CTA is visible when at limit", async ({ page }) => {
    // Create 10 jobs to hit limit
    for (let i = 1; i <= 10; i++) {
      await page.click('button:has-text("Add Job")');
      await page.fill('[name="company"]', `Limit Company ${i}`);
      await page.fill('[name="role"]', "Engineer");
      await page.selectOption('[name="status"]', "SAVED");
      await page.click('button:has-text("Save")');
    }

    // Should prominently show upgrade option
    await expect(
      page.locator('button:has-text("Upgrade")').or(
        page.locator('a:has-text("Upgrade")')
      )
    ).toBeVisible();
  });
});
