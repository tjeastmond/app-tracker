import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobApplications, userEntitlements } from "@drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Development-only endpoint to manipulate job lastTouchedAt timestamps
 * for testing the reminder system.
 * 
 * Usage:
 * POST /api/dev/touch-job
 * Body: { jobId: string, daysAgo: number, userId: string }
 */
export async function POST(request: Request) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  try {
    const { jobId, daysAgo, userId } = await request.json();

    if (!jobId || daysAgo === undefined || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: jobId, daysAgo, userId" },
        { status: 400 }
      );
    }

    // Calculate the new timestamp
    const newTimestamp = new Date();
    newTimestamp.setDate(newTimestamp.getDate() - daysAgo);

    // Update the job
    const [updatedJob] = await db
      .update(jobApplications)
      .set({
        lastTouchedAt: newTimestamp,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(jobApplications.id, jobId),
          eq(jobApplications.userId, userId)
        )
      )
      .returning();

    if (!updatedJob) {
      return NextResponse.json(
        { error: "Job not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job: {
        id: updatedJob.id,
        company: updatedJob.company,
        role: updatedJob.role,
        status: updatedJob.status,
        lastTouchedAt: updatedJob.lastTouchedAt,
      },
      message: `Job lastTouchedAt set to ${daysAgo} days ago (${newTimestamp.toISOString()})`,
    });
  } catch (error) {
    console.error("Error updating job timestamp:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Upgrade user to paid plan for testing
 */
export async function PUT(request: Request) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  try {
    const { userId, plan } = await request.json();

    if (!userId || !plan) {
      return NextResponse.json(
        { error: "Missing required fields: userId, plan" },
        { status: 400 }
      );
    }

    if (plan !== "FREE" && plan !== "PAID_LIFETIME") {
      return NextResponse.json(
        { error: "Invalid plan. Must be FREE or PAID_LIFETIME" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(userEntitlements)
      .set({
        plan,
        updatedAt: new Date(),
      })
      .where(eq(userEntitlements.userId, userId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `User plan updated to ${plan}`,
      entitlement: {
        userId: updated.userId,
        plan: updated.plan,
      },
    });
  } catch (error) {
    console.error("Error updating user plan:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
