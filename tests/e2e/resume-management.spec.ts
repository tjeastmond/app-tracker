import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "./helpers/auth";

test.describe("Resume Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test("user can create a new resume version", async ({ page }) => {
    // Open resume dialog
    await page.click('button:has-text("Manage Resumes")');

    // Click add resume
    await page.click('button:has-text("Add Resume")');

    // Fill form
    await page.fill('[name="name"]', "Senior Resume v1");
    await page.fill('[name="url"]', "https://example.com/resume.pdf");

    // Submit
    await page.click('button:has-text("Save")');

    // Verify resume appears in list
    await expect(page.locator("text=Senior Resume v1")).toBeVisible();
  });

  test("user can edit resume version", async ({ page }) => {
    // Create resume first
    await page.click('button:has-text("Manage Resumes")');
    await page.click('button:has-text("Add Resume")');
    await page.fill('[name="name"]', "Original Resume");
    await page.fill('[name="url"]', "https://example.com/v1.pdf");
    await page.click('button:has-text("Save")');

    // Edit resume
    await page.click("text=Original Resume");
    await page.fill('[name="name"]', "Updated Resume");
    await page.fill('[name="url"]', "https://example.com/v2.pdf");
    await page.click('button:has-text("Save")');

    // Verify changes
    await expect(page.locator("text=Updated Resume")).toBeVisible();
    await expect(page.locator("text=Original Resume")).not.toBeVisible();
  });

  test("user can delete unused resume version", async ({ page }) => {
    // Create resume
    await page.click('button:has-text("Manage Resumes")');
    await page.click('button:has-text("Add Resume")');
    await page.fill('[name="name"]', "Delete Me Resume");
    await page.fill('[name="url"]', "https://example.com/delete.pdf");
    await page.click('button:has-text("Save")');

    // Delete resume
    const resumeRow = page.locator("text=Delete Me Resume").locator("..");
    await resumeRow.locator('button:has-text("Delete")').click();

    // Confirm if needed
    if (await page.locator('button:has-text("Confirm")').isVisible()) {
      await page.click('button:has-text("Confirm")');
    }

    // Verify deleted
    await expect(page.locator("text=Delete Me Resume")).not.toBeVisible();
  });

  test("user can link resume to job", async ({ page }) => {
    // Create resume first
    await page.click('button:has-text("Manage Resumes")');
    await page.click('button:has-text("Add Resume")');
    await page.fill('[name="name"]', "Job Link Resume");
    await page.fill('[name="url"]', "https://example.com/resume.pdf");
    await page.click('button:has-text("Save")');
    
    // Close resume dialog
    await page.press("body", "Escape");

    // Create job with resume
    await page.click('button:has-text("Add Job")');
    await page.fill('[name="company"]', "Resume Test Corp");
    await page.fill('[name="role"]', "Engineer");
    await page.selectOption('[name="status"]', "SAVED");
    
    // Select resume
    await page.selectOption('[name="resumeVersionId"]', { label: "Job Link Resume" });
    
    await page.click('button:has-text("Save")');

    // Verify job shows resume link
    await expect(page.locator("text=Resume Test Corp")).toBeVisible();
    await expect(page.locator("text=Job Link Resume")).toBeVisible();
  });

  test("resume form validation requires valid URL", async ({ page }) => {
    await page.click('button:has-text("Manage Resumes")');
    await page.click('button:has-text("Add Resume")');

    await page.fill('[name="name"]', "Test Resume");
    await page.fill('[name="url"]', "not-a-valid-url");

    await page.click('button:has-text("Save")');

    // Should show validation error
    await expect(page.locator("text=Invalid URL")).toBeVisible();
  });

  test("user cannot delete resume linked to jobs", async ({ page }) => {
    // Create resume
    await page.click('button:has-text("Manage Resumes")');
    await page.click('button:has-text("Add Resume")');
    await page.fill('[name="name"]', "Linked Resume");
    await page.fill('[name="url"]', "https://example.com/linked.pdf");
    await page.click('button:has-text("Save")');
    await page.press("body", "Escape");

    // Create job with this resume
    await page.click('button:has-text("Add Job")');
    await page.fill('[name="company"]', "Link Test Corp");
    await page.fill('[name="role"]', "Engineer");
    await page.selectOption('[name="status"]', "SAVED");
    await page.selectOption('[name="resumeVersionId"]', { label: "Linked Resume" });
    await page.click('button:has-text("Save")');

    // Try to delete resume
    await page.click('button:has-text("Manage Resumes")');
    const resumeRow = page.locator("text=Linked Resume").locator("..");
    await resumeRow.locator('button:has-text("Delete")').click();

    // Should show error message
    await expect(
      page.locator("text=Cannot delete resume version that is used by job applications")
    ).toBeVisible();

    // Resume should still exist
    await expect(page.locator("text=Linked Resume")).toBeVisible();
  });
});
