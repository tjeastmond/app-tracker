import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reminders } from "@drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Development-only endpoint to clear all reminders for a user
 * This allows retesting the reminder flow without manually clearing the DB
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
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Missing required field: userId" },
        { status: 400 }
      );
    }

    // Delete all reminders for this user
    const result = await db
      .delete(reminders)
      .where(eq(reminders.userId, userId))
      .returning({ id: reminders.id });

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.length} reminder(s)`,
      count: result.length,
    });
  } catch (error) {
    console.error("Error resetting reminders:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
