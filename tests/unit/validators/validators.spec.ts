import { describe, it, expect } from "vitest";
import {
  JobCreateSchema,
  JobUpdateSchema,
  ResumeVersionCreateSchema,
  ResumeVersionUpdateSchema,
} from "@/lib/validators";

describe("JobCreateSchema", () => {
  it("validates valid job data", () => {
    const validData = {
      company: "Acme Corp",
      role: "Software Engineer",
      status: "SAVED" as const,
    };

    const result = JobCreateSchema.parse(validData);
    expect(result).toEqual(validData);
  });

  it("validates with all optional fields", () => {
    const validData = {
      company: "Acme Corp",
      role: "Software Engineer",
      location: "San Francisco, CA",
      url: "https://acme.com/jobs/123",
      status: "APPLIED" as const,
      appliedDate: "2025-01-15",
      salary: "$150k-$200k",
      notes: "Great team culture",
      resumeVersionId: "123e4567-e89b-12d3-a456-426614174000",
    };

    const result = JobCreateSchema.parse(validData);
    expect(result).toEqual(validData);
  });

  it("rejects missing required fields", () => {
    expect(() => JobCreateSchema.parse({})).toThrow();
    expect(() => JobCreateSchema.parse({ company: "Acme" })).toThrow();
    expect(() => JobCreateSchema.parse({ role: "Engineer" })).toThrow();
  });

  it("rejects invalid status", () => {
    expect(() =>
      JobCreateSchema.parse({
        company: "Acme",
        role: "Engineer",
        status: "INVALID_STATUS",
      })
    ).toThrow();
  });

  it("rejects invalid URL", () => {
    expect(() =>
      JobCreateSchema.parse({
        company: "Acme",
        role: "Engineer",
        status: "SAVED",
        url: "not-a-url",
      })
    ).toThrow();
  });

  it("accepts empty string for URL", () => {
    const result = JobCreateSchema.parse({
      company: "Acme",
      role: "Engineer",
      status: "SAVED",
      url: "",
    });

    expect(result.url).toBe("");
  });

  it("validates all job statuses", () => {
    const statuses = [
      "SAVED",
      "APPLIED",
      "RECRUITER_SCREEN",
      "TECHNICAL",
      "ONSITE",
      "OFFER",
      "REJECTED",
      "GHOSTED",
    ] as const;

    statuses.forEach((status) => {
      const result = JobCreateSchema.parse({
        company: "Acme",
        role: "Engineer",
        status,
      });
      expect(result.status).toBe(status);
    });
  });

  it("enforces max length for company", () => {
    expect(() =>
      JobCreateSchema.parse({
        company: "A".repeat(161),
        role: "Engineer",
        status: "SAVED",
      })
    ).toThrow();
  });
});

describe("JobUpdateSchema", () => {
  it("validates with ID field", () => {
    const validData = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      company: "Acme Corp",
      role: "Software Engineer",
      status: "APPLIED" as const,
    };

    const result = JobUpdateSchema.parse(validData);
    expect(result).toEqual(validData);
  });

  it("rejects invalid UUID format", () => {
    expect(() =>
      JobUpdateSchema.parse({
        id: "not-a-uuid",
        company: "Acme",
        role: "Engineer",
        status: "SAVED",
      })
    ).toThrow();
  });

  it("rejects missing ID", () => {
    expect(() =>
      JobUpdateSchema.parse({
        company: "Acme",
        role: "Engineer",
        status: "SAVED",
      })
    ).toThrow();
  });
});

describe("ResumeVersionCreateSchema", () => {
  it("validates valid resume data", () => {
    const validData = {
      name: "Senior Resume v3",
      url: "https://example.com/resume.pdf",
    };

    const result = ResumeVersionCreateSchema.parse(validData);
    expect(result).toEqual(validData);
  });

  it("rejects missing name", () => {
    expect(() =>
      ResumeVersionCreateSchema.parse({
        url: "https://example.com/resume.pdf",
      })
    ).toThrow();
  });

  it("rejects missing URL", () => {
    expect(() =>
      ResumeVersionCreateSchema.parse({
        name: "Resume",
      })
    ).toThrow();
  });

  it("rejects invalid URL", () => {
    expect(() =>
      ResumeVersionCreateSchema.parse({
        name: "Resume",
        url: "not-a-url",
      })
    ).toThrow();
  });

  it("enforces max length for name", () => {
    expect(() =>
      ResumeVersionCreateSchema.parse({
        name: "A".repeat(101),
        url: "https://example.com/resume.pdf",
      })
    ).toThrow();
  });
});

describe("ResumeVersionUpdateSchema", () => {
  it("validates with ID field", () => {
    const validData = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Updated Resume",
      url: "https://example.com/resume-v2.pdf",
    };

    const result = ResumeVersionUpdateSchema.parse(validData);
    expect(result).toEqual(validData);
  });

  it("rejects invalid UUID format", () => {
    expect(() =>
      ResumeVersionUpdateSchema.parse({
        id: "not-a-uuid",
        name: "Resume",
        url: "https://example.com/resume.pdf",
      })
    ).toThrow();
  });
});
