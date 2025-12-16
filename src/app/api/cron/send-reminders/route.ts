import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reminders, jobApplications, users } from "@drizzle/schema";
import { eq, and, isNull, lte } from "drizzle-orm";
import { Resend } from "resend";
import { env } from "@/lib/env";

const resend = new Resend(env.RESEND_API_KEY);

/**
 * Cron endpoint to send reminder emails for pending reminders.
 * This should be called periodically (e.g., hourly or daily) via Vercel Cron.
 *
 * Queries for reminders that:
 * - Have a triggerAt date <= now
 * - Have not been sent (sentAt is null)
 * - Have not been cancelled (cancelledAt is null)
 */
export async function GET(request: Request) {
  try {
    // Verify this is being called from Vercel Cron
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Find pending reminders that need to be sent
    const pendingReminders = await db
      .select({
        reminderId: reminders.id,
        userId: reminders.userId,
        jobApplicationId: reminders.jobApplicationId,
        triggerAt: reminders.triggerAt,
        email: users.email,
        company: jobApplications.company,
        role: jobApplications.role,
        status: jobApplications.status,
        lastTouchedAt: jobApplications.lastTouchedAt,
      })
      .from(reminders)
      .innerJoin(users, eq(reminders.userId, users.id))
      .innerJoin(jobApplications, eq(reminders.jobApplicationId, jobApplications.id))
      .where(
        and(
          lte(reminders.triggerAt, now),
          isNull(reminders.sentAt),
          isNull(reminders.cancelledAt)
        )
      )
      .limit(100); // Process in batches

    let sentCount = 0;
    const errors: string[] = [];

    for (const reminder of pendingReminders) {
      try {
        const daysSinceTouch = Math.floor(
          (now.getTime() - new Date(reminder.lastTouchedAt).getTime()) /
            (1000 * 60 * 60 * 24)
        );

        // Send email via Resend
        const result = await resend.emails.send({
          from: env.EMAIL_FROM,
          to: reminder.email,
          subject: `Follow-up reminder: ${reminder.company} - ${reminder.role}`,
          html: `
            <h2>Time to follow up!</h2>
            <p>Hi there,</p>
            <p>You haven't updated this job application in ${daysSinceTouch} days:</p>
            <ul>
              <li><strong>Company:</strong> ${reminder.company}</li>
              <li><strong>Role:</strong> ${reminder.role}</li>
              <li><strong>Status:</strong> ${reminder.status.replace(/_/g, " ")}</li>
              <li><strong>Last updated:</strong> ${new Date(reminder.lastTouchedAt).toLocaleDateString()}</li>
            </ul>
            <p>Consider reaching out to the recruiter or checking the status of your application.</p>
            <p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://yourapp.com"}/app" style="display: inline-block; padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">
                View in Job Tracker
              </a>
            </p>
            <p>Good luck!</p>
          `,
        });

        // Check if Resend returned an error
        if (result.error) {
          throw new Error(`Resend API error: ${result.error.message}`);
        }

        // Only mark as sent if Resend succeeded
        if (result.data) {
          await db
            .update(reminders)
            .set({ sentAt: new Date() })
            .where(eq(reminders.id, reminder.reminderId));

          sentCount++;
        } else {
          throw new Error("Resend returned no data or error");
        }
      } catch (error) {
        console.error(`Error sending reminder ${reminder.reminderId}:`, error);
        errors.push(
          `${reminder.reminderId}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
        // Reminder is NOT marked as sent, so it will be retried next time
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      total: pendingReminders.length,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Error sending reminders:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
