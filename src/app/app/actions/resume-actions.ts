"use server";

import { requireAppUserId } from "@/lib/require-user";
import { db } from "@/lib/db";
import { resumeVersions, jobApplications } from "@drizzle/schema";
import {
  ResumeVersionCreateSchema,
  ResumeVersionUpdateSchema,
} from "@/lib/validators";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function listResumes() {
  const userId = await requireAppUserId();

  const resumes = await db
    .select()
    .from(resumeVersions)
    .where(eq(resumeVersions.userId, userId))
    .orderBy(desc(resumeVersions.createdAt));

  return resumes;
}

export async function createResume(input: unknown) {
  const userId = await requireAppUserId();
  const data = ResumeVersionCreateSchema.parse(input);

  const [resume] = await db
    .insert(resumeVersions)
    .values({
      userId,
      name: data.name,
      url: data.url,
    })
    .returning();

  revalidatePath("/app");
  return resume;
}

export async function updateResume(input: unknown) {
  const userId = await requireAppUserId();
  const data = ResumeVersionUpdateSchema.parse(input);

  const [resume] = await db
    .update(resumeVersions)
    .set({
      name: data.name,
      url: data.url,
      updatedAt: new Date(),
    })
    .where(
      and(eq(resumeVersions.id, data.id), eq(resumeVersions.userId, userId))
    )
    .returning();

  if (!resume) {
    throw new Error("Resume not found");
  }

  revalidatePath("/app");
  return resume;
}

export async function deleteResume(id: string) {
  const userId = await requireAppUserId();

  // Check if resume is used by any jobs
  const jobsUsingResume = await db
    .select()
    .from(jobApplications)
    .where(
      and(
        eq(jobApplications.resumeVersionId, id),
        eq(jobApplications.userId, userId)
      )
    )
    .limit(1);

  if (jobsUsingResume.length > 0) {
    throw new Error(
      "Cannot delete resume version that is used by job applications"
    );
  }

  const [resume] = await db
    .delete(resumeVersions)
    .where(and(eq(resumeVersions.id, id), eq(resumeVersions.userId, userId)))
    .returning();

  if (!resume) {
    throw new Error("Resume not found");
  }

  revalidatePath("/app");
  return resume;
}
