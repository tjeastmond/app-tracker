import { NextResponse } from "next/server";
import { generateReminders } from "@/lib/reminder-generator";

/**
 * Cron endpoint to generate reminder records for jobs needing follow-up.
 * This should be called periodically (e.g., daily) via Vercel Cron.
 *
 * The function is idempotent - it won't create duplicate reminders.
 */
export async function GET(request: Request) {
  try {
    // Verify this is being called from Vercel Cron
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await generateReminders();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error generating reminders:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
