import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { submitOfficeWeeklyLog } from "@/lib/services/offices";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { officeId, weekSummary, dailyTasksCarriedOut, challenges, nextWeekPlan } = body;
    if (!officeId || !weekSummary || !dailyTasksCarriedOut) {
      return NextResponse.json({ message: "Missing required log fields" }, { status: 400 });
    }

    const log = await submitOfficeWeeklyLog({
      officeId,
      authorUserId: session.userId,
      weekSummary,
      dailyTasksCarriedOut,
      challenges,
      nextWeekPlan,
    });

    return NextResponse.json({ success: true, log });
  } catch (error: unknown) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Error submitting log" }, { status: 500 });
  }
}
