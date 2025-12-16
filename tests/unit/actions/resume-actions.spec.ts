import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  testDb,
  createTestUser,
  createTestResumeVersion,
  createTestJob,
} from "../setup";
import { eq } from "drizzle-orm";
import { resumeVersions } from "@drizzle/schema";

// Mock modules
vi.mock("@/lib/require-user", () => ({
  requireAppUserId: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: testDb,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Import after mocks
const { requireAppUserId } = await import("@/lib/require-user");
const { createResume, updateResume, deleteResume, listResumes } = await import(
  "@/app/app/actions/resume-actions"
);

describe("createResume", () => {
  let testUserId: string;

  beforeEach(async () => {
    const user = await createTestUser();
    testUserId = user.id;
    vi.mocked(requireAppUserId).mockResolvedValue(testUserId);
  });

  it("creates a resume with valid data", async () => {
    const resumeData = {
      name: "Senior Resume v1",
      url: "https://example.com/resume.pdf",
    };

    const resume = await createResume(resumeData);

    expect(resume.name).toBe("Senior Resume v1");
    expect(resume.url).toBe("https://example.com/resume.pdf");
    expect(resume.userId).toBe(testUserId);
  });

  it("rejects invalid URL", async () => {
    await expect(
      createResume({
        name: "Resume",
        url: "not-a-valid-url",
      })
    ).rejects.toThrow();
  });

  it("rejects missing name", async () => {
    await expect(
      createResume({
        url: "https://example.com/resume.pdf",
      })
    ).rejects.toThrow();
  });
});

describe("updateResume", () => {
  let testUserId: string;

  beforeEach(async () => {
    const user = await createTestUser();
    testUserId = user.id;
    vi.mocked(requireAppUserId).mockResolvedValue(testUserId);
  });

  it("updates an existing resume", async () => {
    const resume = await createTestResumeVersion(testUserId, {
      name: "Original Name",
      url: "https://example.com/v1.pdf",
    });

    const updated = await updateResume({
      id: resume.id,
      name: "Updated Name",
      url: "https://example.com/v2.pdf",
    });

    expect(updated.name).toBe("Updated Name");
    expect(updated.url).toBe("https://example.com/v2.pdf");
  });

  it("prevents updating another user's resume", async () => {
    const otherUser = await createTestUser();
    const otherResume = await createTestResumeVersion(otherUser.id);

    await expect(
      updateResume({
        id: otherResume.id,
        name: "Hacked",
        url: "https://example.com/hacked.pdf",
      })
    ).rejects.toThrow("Resume not found");
  });

  it("throws error for non-existent resume", async () => {
    await expect(
      updateResume({
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "Test",
        url: "https://example.com/test.pdf",
      })
    ).rejects.toThrow("Resume not found");
  });
});

describe("deleteResume", () => {
  let testUserId: string;

  beforeEach(async () => {
    const user = await createTestUser();
    testUserId = user.id;
    vi.mocked(requireAppUserId).mockResolvedValue(testUserId);
  });

  it("deletes an unused resume", async () => {
    const resume = await createTestResumeVersion(testUserId);

    await deleteResume(resume.id);

    const deleted = await testDb
      .select()
      .from(resumeVersions)
      .where(eq(resumeVersions.id, resume.id));

    expect(deleted).toHaveLength(0);
  });

  it("prevents deleting a resume used by jobs", async () => {
    const resume = await createTestResumeVersion(testUserId);
    await createTestJob(testUserId, { resumeVersionId: resume.id });

    await expect(deleteResume(resume.id)).rejects.toThrow(
      "Cannot delete resume version that is used by job applications"
    );

    // Verify resume still exists
    const stillExists = await testDb
      .select()
      .from(resumeVersions)
      .where(eq(resumeVersions.id, resume.id));

    expect(stillExists).toHaveLength(1);
  });

  it("prevents deleting another user's resume", async () => {
    const otherUser = await createTestUser();
    const otherResume = await createTestResumeVersion(otherUser.id);

    await expect(deleteResume(otherResume.id)).rejects.toThrow(
      "Resume not found"
    );
  });

  it("throws error for non-existent resume", async () => {
    await expect(
      deleteResume("123e4567-e89b-12d3-a456-426614174000")
    ).rejects.toThrow("Resume not found");
  });
});

describe("listResumes", () => {
  let testUserId: string;

  beforeEach(async () => {
    const user = await createTestUser();
    testUserId = user.id;
    vi.mocked(requireAppUserId).mockResolvedValue(testUserId);
  });

  it("returns user's resumes only", async () => {
    await createTestResumeVersion(testUserId, { name: "Resume A" });
    await createTestResumeVersion(testUserId, { name: "Resume B" });

    const otherUser = await createTestUser();
    await createTestResumeVersion(otherUser.id, { name: "Resume C" });

    const resumes = await listResumes();

    expect(resumes).toHaveLength(2);
    expect(resumes.every((r) => r.name !== "Resume C")).toBe(true);
  });

  it("returns resumes ordered by createdAt (newest first)", async () => {
    await createTestResumeVersion(testUserId, { name: "First" });
    
    await new Promise((resolve) => setTimeout(resolve, 10));
    await createTestResumeVersion(testUserId, { name: "Second" });

    const resumes = await listResumes();

    expect(resumes[0].name).toBe("Second");
    expect(resumes[1].name).toBe("First");
  });

  it("returns empty array when user has no resumes", async () => {
    const resumes = await listResumes();
    expect(resumes).toHaveLength(0);
  });
});
