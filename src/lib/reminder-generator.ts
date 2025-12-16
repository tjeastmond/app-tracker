import { db } from "./db";
import {
  jobApplications,
  userSettings,
  reminders,
  userEntitlements,
} from "@drizzle/schema";
import { eq, and, isNull, sql } from "drizzle-orm";

const INTERVIEW_STATUSES = [
  "RECRUITER_SCREEN",
  "TECHNICAL",
  "ONSITE",
] as const;

/**
 * Generates reminder records for jobs that need follow-up.
 * This function is idempotent - it won't create duplicate reminders.
 *
 * Logic:
 * - For APPLIED status: check if (now - lastTouchedAt) >= appliedFollowupDays
 * - For interview statuses: check if (now - lastTouchedAt) >= interviewFollowupDays
 * - Only for users with reminders enabled and paid plan (FREE users don't get reminders)
 * - Don't create reminders if one already exists for that job+type+triggerDate combination
 */
export async function generateReminders() {
  const now = new Date();

  // Get all users with reminders enabled
  const usersWithReminders = await db
    .select({
      userId: userSettings.userId,
      appliedFollowupDays: userSettings.appliedFollowupDays,
      interviewFollowupDays: userSettings.interviewFollowupDays,
      plan: userEntitlements.plan,
    })
    .from(userSettings)
    .innerJoin(userEntitlements, eq(userSettings.userId, userEntitlements.userId))
    .where(
      and(
        sql`${userSettings.remindersEnabled} = 1`,
        // For now, only generate reminders for paid users
        // In the future, we might want to generate but not send for free users
        eq(userEntitlements.plan, "PAID_LIFETIME")
      )
    );

  let totalGenerated = 0;

  for (const user of usersWithReminders) {
    // Find jobs needing follow-up
    const jobsNeedingFollowup = await db
      .select({
        id: jobApplications.id,
        status: jobApplications.status,
        lastTouchedAt: jobApplications.lastTouchedAt,
      })
      .from(jobApplications)
      .where(
        and(
          eq(jobApplications.userId, user.userId),
          // Only consider active statuses (not OFFER, REJECTED, GHOSTED)
          sql`${jobApplications.status} IN ('APPLIED', 'RECRUITER_SCREEN', 'TECHNICAL', 'ONSITE')`
        )
      );

    for (const job of jobsNeedingFollowup) {
      const daysSinceTouch = Math.floor(
        (now.getTime() - new Date(job.lastTouchedAt).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      let needsReminder = false;
      let followupDays = 0;

      if (job.status === "APPLIED") {
        followupDays = user.appliedFollowupDays;
        needsReminder = daysSinceTouch >= followupDays;
      } else if (
        INTERVIEW_STATUSES.includes(
          job.status as (typeof INTERVIEW_STATUSES)[number]
        )
      ) {
        followupDays = user.interviewFollowupDays;
        needsReminder = daysSinceTouch >= followupDays;
      }

      if (needsReminder) {
        // Calculate trigger date (should have been triggered at lastTouchedAt + followupDays)
        const triggerDate = new Date(job.lastTouchedAt);
        triggerDate.setDate(triggerDate.getDate() + followupDays);

        // Check if a reminder already exists for this job
        const existingReminder = await db
          .select({ id: reminders.id })
          .from(reminders)
          .where(
            and(
              eq(reminders.jobApplicationId, job.id),
              eq(reminders.type, "FOLLOW_UP"),
              isNull(reminders.cancelledAt)
            )
          )
          .limit(1);

        // Only create if no existing reminder
        if (existingReminder.length === 0) {
          await db.insert(reminders).values({
            userId: user.userId,
            jobApplicationId: job.id,
            type: "FOLLOW_UP",
            triggerAt: triggerDate,
          });
          totalGenerated++;
        }
      }
    }
  }

  return { generated: totalGenerated, timestamp: now.toISOString() };
}

/**
 * Gets jobs that need follow-up for a specific user.
 * This is used for the "needs follow-up" view in the UI.
 */
export async function getJobsNeedingFollowup(userId: string) {
  const now = new Date();

  // Get user settings
  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  });

  if (!settings) {
    return [];
  }

  // Find jobs needing follow-up
  const jobs = await db
    .select({
      id: jobApplications.id,
      company: jobApplications.company,
      role: jobApplications.role,
      status: jobApplications.status,
      lastTouchedAt: jobApplications.lastTouchedAt,
      appliedDate: jobApplications.appliedDate,
    })
    .from(jobApplications)
    .where(
      and(
        eq(jobApplications.userId, userId),
        sql`${jobApplications.status} IN ('APPLIED', 'RECRUITER_SCREEN', 'TECHNICAL', 'ONSITE')`
      )
    );

  // Filter to only jobs that need follow-up
  const jobsNeedingFollowup = jobs.filter((job) => {
    const daysSinceTouch = Math.floor(
      (now.getTime() - new Date(job.lastTouchedAt).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (job.status === "APPLIED") {
      return daysSinceTouch >= settings.appliedFollowupDays;
    } else if (
      INTERVIEW_STATUSES.includes(
        job.status as (typeof INTERVIEW_STATUSES)[number]
      )
    ) {
      return daysSinceTouch >= settings.interviewFollowupDays;
    }

    return false;
  });

  return jobsNeedingFollowup;
}
