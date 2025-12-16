import { describe, it, expect, vi, beforeEach } from "vitest";
import { testDb, createTestUser, createPaidTestUser, createTestJob } from "../setup";
import { eq, sql } from "drizzle-orm";
import { jobApplications } from "@drizzle/schema";

// Mock the require-user module
vi.mock("@/lib/require-user", () => ({
  requireAppUserId: vi.fn(),
}));

// Mock the db module to use testDb
vi.mock("@/lib/db", () => ({
  db: testDb,
}));

// Mock Next.js cache revalidation
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Import after mocks are set up
const { requireAppUserId } = await import("@/lib/require-user");
const { createJob, updateJob, deleteJob, listJobs } = await import(
  "@/app/app/actions/job-actions"
);

describe("createJob", () => {
  let testUserId: string;

  beforeEach(async () => {
    const user = await createTestUser();
    testUserId = user.id;
    vi.mocked(requireAppUserId).mockResolvedValue(testUserId);
  });

  it("creates a job with valid data", async () => {
    const jobData = {
      company: "Acme Corp",
      role: "Software Engineer",
      status: "SAVED" as const,
    };

    const job = await createJob(jobData);

    expect(job.company).toBe("Acme Corp");
    expect(job.role).toBe("Software Engineer");
    expect(job.status).toBe("SAVED");
    expect(job.userId).toBe(testUserId);
  });

  it("creates a job with all optional fields", async () => {
    const jobData = {
      company: "Acme Corp",
      role: "Software Engineer",
      location: "San Francisco",
      url: "https://acme.com/jobs/123",
      status: "APPLIED" as const,
      appliedDate: "2025-01-15",
      salary: "$150k-$200k",
      notes: "Great team",
    };

    const job = await createJob(jobData);

    expect(job.location).toBe("San Francisco");
    expect(job.salary).toBe("$150k-$200k");
    expect(job.notes).toBe("Great team");
  });

  it("enforces free tier limit of 10 jobs", async () => {
    // Create 10 jobs (at limit)
    for (let i = 0; i < 10; i++) {
      await createTestJob(testUserId, {
        company: `Company ${i}`,
        role: "Engineer",
      });
    }

    // 11th job should fail
    await expect(
      createJob({
        company: "Company 11",
        role: "Engineer",
        status: "SAVED",
      })
    ).rejects.toThrow("Free tier limit reached");
  });

  it("allows more than 10 jobs for paid users", async () => {
    const paidUser = await createPaidTestUser();
    vi.mocked(requireAppUserId).mockResolvedValue(paidUser.id);

    // Create 10 jobs
    for (let i = 0; i < 10; i++) {
      await createTestJob(paidUser.id);
    }

    // 11th job should succeed for paid user
    const job = await createJob({
      company: "Company 11",
      role: "Engineer",
      status: "SAVED",
    });

    expect(job.company).toBe("Company 11");
  });

  it("rejects invalid input data", async () => {
    await expect(
      createJob({
        company: "Acme",
        // Missing required 'role' field
        status: "SAVED",
      })
    ).rejects.toThrow();
  });
});

describe("updateJob", () => {
  let testUserId: string;

  beforeEach(async () => {
    const user = await createTestUser();
    testUserId = user.id;
    vi.mocked(requireAppUserId).mockResolvedValue(testUserId);
  });

  it("updates an existing job", async () => {
    const job = await createTestJob(testUserId, {
      company: "Original Corp",
      role: "Engineer",
    });

    const updated = await updateJob({
      id: job.id,
      company: "Updated Corp",
      role: "Senior Engineer",
      status: "APPLIED",
    });

    expect(updated.company).toBe("Updated Corp");
    expect(updated.role).toBe("Senior Engineer");
    expect(updated.status).toBe("APPLIED");
  });

  it("updates lastTouchedAt timestamp", async () => {
    const job = await createTestJob(testUserId);
    const originalTimestamp = job.lastTouchedAt;

    // Wait a moment to ensure timestamp changes
    await new Promise((resolve) => setTimeout(resolve, 10));

    const updated = await updateJob({
      id: job.id,
      company: job.company,
      role: job.role,
      status: "APPLIED",
    });

    expect(updated.lastTouchedAt.getTime()).toBeGreaterThan(
      originalTimestamp.getTime()
    );
  });

  it("prevents updating another user's job", async () => {
    const otherUser = await createTestUser();
    const otherJob = await createTestJob(otherUser.id);

    await expect(
      updateJob({
        id: otherJob.id,
        company: "Hacked Corp",
        role: "Engineer",
        status: "SAVED",
      })
    ).rejects.toThrow("Job not found");
  });

  it("throws error for non-existent job", async () => {
    await expect(
      updateJob({
        id: "123e4567-e89b-12d3-a456-426614174000",
        company: "Acme",
        role: "Engineer",
        status: "SAVED",
      })
    ).rejects.toThrow("Job not found");
  });
});

describe("deleteJob", () => {
  let testUserId: string;

  beforeEach(async () => {
    const user = await createTestUser();
    testUserId = user.id;
    vi.mocked(requireAppUserId).mockResolvedValue(testUserId);
  });

  it("deletes an existing job", async () => {
    const job = await createTestJob(testUserId);

    await deleteJob(job.id);

    const deleted = await testDb
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.id, job.id));

    expect(deleted).toHaveLength(0);
  });

  it("prevents deleting another user's job", async () => {
    const otherUser = await createTestUser();
    const otherJob = await createTestJob(otherUser.id);

    await expect(deleteJob(otherJob.id)).rejects.toThrow("Job not found");

    // Verify job still exists
    const stillExists = await testDb
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.id, otherJob.id));

    expect(stillExists).toHaveLength(1);
  });

  it("throws error for non-existent job", async () => {
    await expect(
      deleteJob("123e4567-e89b-12d3-a456-426614174000")
    ).rejects.toThrow("Job not found");
  });
});

describe("listJobs", () => {
  let testUserId: string;

  beforeEach(async () => {
    const user = await createTestUser();
    testUserId = user.id;
    vi.mocked(requireAppUserId).mockResolvedValue(testUserId);
  });

  it("returns user's jobs only", async () => {
    // Create jobs for test user
    await createTestJob(testUserId, { company: "Company A" });
    await createTestJob(testUserId, { company: "Company B" });

    // Create jobs for another user
    const otherUser = await createTestUser();
    await createTestJob(otherUser.id, { company: "Company C" });

    const jobs = await listJobs();

    expect(jobs).toHaveLength(2);
    expect(jobs.every((job) => job.company !== "Company C")).toBe(true);
  });

  it("returns jobs ordered by lastTouchedAt (newest first)", async () => {
    const job1 = await createTestJob(testUserId, { company: "First" });
    
    await new Promise((resolve) => setTimeout(resolve, 10));
    const job2 = await createTestJob(testUserId, { company: "Second" });

    const jobs = await listJobs();

    expect(jobs[0].company).toBe("Second");
    expect(jobs[1].company).toBe("First");
  });

  it("returns empty array when user has no jobs", async () => {
    const jobs = await listJobs();
    expect(jobs).toHaveLength(0);
  });
});
