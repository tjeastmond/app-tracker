import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "./helpers/auth";

test.describe("Job Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test("user can create a new job", async ({ page }) => {
    // Click add job button
    await page.click('button:has-text("Add Job")');

    // Fill out form
    await page.fill('[name="company"]', "Acme Corp");
    await page.fill('[name="role"]', "Software Engineer");
    await page.selectOption('[name="status"]', "SAVED");

    // Submit
    await page.click('button:has-text("Save")');

    // Verify job appears in table
    await expect(page.locator("text=Acme Corp")).toBeVisible();
    await expect(page.locator("text=Software Engineer")).toBeVisible();
  });

  test("user can create job with optional fields", async ({ page }) => {
    await page.click('button:has-text("Add Job")');

    await page.fill('[name="company"]', "TechCo");
    await page.fill('[name="role"]', "Senior Engineer");
    await page.fill('[name="location"]', "San Francisco, CA");
    await page.fill('[name="url"]', "https://techco.com/jobs/123");
    await page.fill('[name="salary"]', "$150k-$200k");
    await page.fill('[name="notes"]', "Great benefits");
    await page.selectOption('[name="status"]', "APPLIED");

    await page.click('button:has-text("Save")');

    // Verify job appears
    await expect(page.locator("text=TechCo")).toBeVisible();
  });

  test("user can edit an existing job", async ({ page }) => {
    // Create a job first
    await page.click('button:has-text("Add Job")');
    await page.fill('[name="company"]', "Original Corp");
    await page.fill('[name="role"]', "Engineer");
    await page.selectOption('[name="status"]', "SAVED");
    await page.click('button:has-text("Save")');

    // Click on the job to edit
    await page.click("text=Original Corp");

    // Edit fields
    await page.fill('[name="company"]', "Updated Corp");
    await page.selectOption('[name="status"]', "APPLIED");

    await page.click('button:has-text("Save")');

    // Verify changes
    await expect(page.locator("text=Updated Corp")).toBeVisible();
    await expect(page.locator("text=Original Corp")).not.toBeVisible();
  });

  test("user can change job status inline", async ({ page }) => {
    // Create a job
    await page.click('button:has-text("Add Job")');
    await page.fill('[name="company"]', "StatusTest Corp");
    await page.fill('[name="role"]', "Engineer");
    await page.selectOption('[name="status"]', "SAVED");
    await page.click('button:has-text("Save")');

    // Find the status dropdown in the table row
    const row = page.locator("tr:has-text('StatusTest Corp')");
    await row.locator('[name="status"]').selectOption("APPLIED");

    // Status should change (verify by checking for status badge/text)
    await expect(row.locator("text=Applied")).toBeVisible();
  });

  test("user can delete a job", async ({ page }) => {
    // Create a job
    await page.click('button:has-text("Add Job")');
    await page.fill('[name="company"]', "Delete Me Corp");
    await page.fill('[name="role"]', "Engineer");
    await page.selectOption('[name="status"]', "SAVED");
    await page.click('button:has-text("Save")');

    // Click on job to open drawer
    await page.click("text=Delete Me Corp");

    // Click delete button
    await page.click('button:has-text("Delete")');

    // Confirm deletion if there's a confirmation dialog
    if (await page.locator('button:has-text("Confirm")').isVisible()) {
      await page.click('button:has-text("Confirm")');
    }

    // Verify job is gone
    await expect(page.locator("text=Delete Me Corp")).not.toBeVisible();
  });

  test("user can search for jobs", async ({ page }) => {
    // Create multiple jobs
    await page.click('button:has-text("Add Job")');
    await page.fill('[name="company"]', "SearchTest A");
    await page.fill('[name="role"]', "Engineer");
    await page.selectOption('[name="status"]', "SAVED");
    await page.click('button:has-text("Save")');

    await page.click('button:has-text("Add Job")');
    await page.fill('[name="company"]', "SearchTest B");
    await page.fill('[name="role"]', "Designer");
    await page.selectOption('[name="status"]', "SAVED");
    await page.click('button:has-text("Save")');

    // Search for specific company
    await page.fill('[placeholder*="Search"]', "SearchTest A");

    // Verify filtered results
    await expect(page.locator("text=SearchTest A")).toBeVisible();
    await expect(page.locator("text=SearchTest B")).not.toBeVisible();
  });

  test("form validation prevents empty submission", async ({ page }) => {
    await page.click('button:has-text("Add Job")');

    // Try to submit without filling required fields
    await page.click('button:has-text("Save")');

    // Should still be on form (drawer open) with validation errors
    await expect(page.locator('[name="company"]')).toBeVisible();
  });
});
