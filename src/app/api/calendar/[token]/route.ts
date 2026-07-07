import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildVCalendar } from "@/lib/ical";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const profile = await db.profile.findUnique({ where: { calendarToken: token } });
  if (!profile) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const planEntries = await db.planEntry.findMany({
    where: { createdByProfileId: profile.id },
    include: { media: true },
    orderBy: { scheduledAt: "asc" },
  });

  const body = buildVCalendar(planEntries);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
    },
  });
}
