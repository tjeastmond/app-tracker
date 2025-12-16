"use server";

import { requireAppUserId } from "@/lib/require-user";
import { db } from "@/lib/db";
import { jobApplications, resumeVersions, reminders } from "@drizzle/schema";
import { JobCreateSchema, JobUpdateSchema } from "@/lib/validators";
import { eq, and, desc, sql, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getJobsNeedingFollowup as getJobsNeedingFollowupLib } from "@/lib/reminder-generator";
import { isPaidUser } from "@/lib/entitlements";

export async function listJobs() {
  const userId = await requireAppUserId();

  const jobs = await db
    .select({
      id: jobApplications.id,
      company: jobApplications.company,
      role: jobApplications.role,
      location: jobApplications.location,
      url: jobApplications.url,
      status: jobApplications.status,
      appliedDate: jobApplications.appliedDate,
      salary: jobApplications.salary,
      notes: jobApplications.notes,
      resumeVersionId: jobApplications.resumeVersionId,
      lastTouchedAt: jobApplications.lastTouchedAt,
      createdAt: jobApplications.createdAt,
      resumeName: resumeVersions.name,
    })
    .from(jobApplications)
    .leftJoin(
      resumeVersions,
      eq(jobApplications.resumeVersionId, resumeVersions.id)
    )
    .where(eq(jobApplications.userId, userId))
    .orderBy(desc(jobApplications.lastTouchedAt));

  return jobs;
}

export async function createJob(input: unknown) {
  const userId = await requireAppUserId();
  const data = JobCreateSchema.parse(input);

  // Check free tier limit (10 jobs max for free users)
  const isPaid = await isPaidUser(userId);
  
  if (!isPaid) {
    const jobCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(jobApplications)
      .where(eq(jobApplications.userId, userId));

    if (jobCount[0].count >= 10) {
      throw new Error("Free tier limit reached (10 jobs max). Upgrade to add unlimited jobs.");
    }
  }

  const [job] = await db
    .insert(jobApplications)
    .values({
      userId,
      company: data.company,
      role: data.role,
      location: data.location,
      url: data.url,
      status: data.status,
      appliedDate: data.appliedDate ? new Date(data.appliedDate) : null,
      salary: data.salary,
      notes: data.notes,
      resumeVersionId: data.resumeVersionId,
    })
    .returning();

  revalidatePath("/app");
  return job;
}

export async function updateJob(input: unknown) {
  const userId = await requireAppUserId();
  const data = JobUpdateSchema.parse(input);

  const [job] = await db
    .update(jobApplications)
    .set({
      company: data.company,
      role: data.role,
      location: data.location,
      url: data.url,
      status: data.status,
      appliedDate: data.appliedDate ? new Date(data.appliedDate) : null,
      salary: data.salary,
      notes: data.notes,
      resumeVersionId: data.resumeVersionId,
      lastTouchedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(eq(jobApplications.id, data.id), eq(jobApplications.userId, userId))
    )
    .returning();

  if (!job) {
    throw new Error("Job not found");
  }

  revalidatePath("/app");
  return job;
}

export async function deleteJob(id: string) {
  const userId = await requireAppUserId();

  const [job] = await db
    .delete(jobApplications)
    .where(
      and(eq(jobApplications.id, id), eq(jobApplications.userId, userId))
    )
    .returning();

  if (!job) {
    throw new Error("Job not found");
  }

  revalidatePath("/app");
  return job;
}

export async function getJobById(id: string) {
  const userId = await requireAppUserId();

  const job = await db.query.jobApplications.findFirst({
    where: and(
      eq(jobApplications.id, id),
      eq(jobApplications.userId, userId)
    ),
  });

  if (!job) {
    throw new Error("Job not found");
  }

  return job;
}

export async function markJobContacted(jobId: string) {
  const userId = await requireAppUserId();

  // Update lastTouchedAt on the job
  const [job] = await db
    .update(jobApplications)
    .set({
      lastTouchedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(eq(jobApplications.id, jobId), eq(jobApplications.userId, userId))
    )
    .returning();

  if (!job) {
    throw new Error("Job not found");
  }

  // Cancel any pending reminders for this job
  await db
    .update(reminders)
    .set({
      cancelledAt: new Date(),
    })
    .where(
      and(
        eq(reminders.jobApplicationId, jobId),
        eq(reminders.userId, userId),
        isNull(reminders.sentAt),
        isNull(reminders.cancelledAt)
      )
    );

  revalidatePath("/app");
  return job;
}

export async function getJobsNeedingFollowup() {
  const userId = await requireAppUserId();
  return getJobsNeedingFollowupLib(userId);
}
