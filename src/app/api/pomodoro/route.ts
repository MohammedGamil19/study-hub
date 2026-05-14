import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardPoints } from "@/lib/points";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { subjectId, durationMins, type, startedAt, endedAt } = await req.json();
  const subject = await prisma.subject.findFirst({ where: { id: subjectId, userId: session.user.id } });
  if (!subject) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const session_ = await prisma.pomodoroSession.create({
    data: { subjectId, userId: session.user.id, durationMins, type: type || "STUDY", startedAt: new Date(startedAt), endedAt: new Date(endedAt) },
  });
  let pointsResult = null;
  if (type === "STUDY" || !type) {
    pointsResult = await awardPoints(session.user.id, "POMODORO_SESSION", session_.id);
  }
  return NextResponse.json({ ...session_, pointsResult }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const subjectId = req.nextUrl.searchParams.get("subjectId");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const where: any = { userId: session.user.id, type: "STUDY", startedAt: { gte: today } };
  if (subjectId) where.subjectId = subjectId;
  const sessions = await prisma.pomodoroSession.findMany({ where, orderBy: { startedAt: "desc" } });
  const totalMins = sessions.reduce((sum, s) => sum + s.durationMins, 0);
  return NextResponse.json({ sessions, totalMins });
}
