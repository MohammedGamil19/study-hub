import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user.isPremium) return NextResponse.json({ error: "Premium required" }, { status: 403 });

  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  const subjectId = req.nextUrl.searchParams.get("subjectId");

  const fromDate = from ? new Date(from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const toDate = to ? new Date(to) : new Date();
  toDate.setHours(23, 59, 59, 999);

  const where: any = { userId: session.user.id, startedAt: { gte: fromDate, lte: toDate }, type: "STUDY" };
  if (subjectId) where.subjectId = subjectId;

  const sessions = await prisma.pomodoroSession.findMany({
    where,
    include: { subject: { select: { name: true, color: true } } },
    orderBy: { startedAt: "asc" },
  });

  // Group by date
  const byDate: Record<string, number> = {};
  const bySubject: Record<string, { name: string; color: string; mins: number }> = {};

  for (const s of sessions) {
    const date = s.startedAt.toISOString().split("T")[0];
    byDate[date] = (byDate[date] || 0) + s.durationMins;
    if (!bySubject[s.subjectId]) {
      bySubject[s.subjectId] = { name: s.subject.name, color: s.subject.color, mins: 0 };
    }
    bySubject[s.subjectId].mins += s.durationMins;
  }

  // Completed tasks
  const taskWhere: any = { subject: { userId: session.user.id }, completedAt: { gte: fromDate, lte: toDate } };
  if (subjectId) taskWhere.subjectId = subjectId;

  const completedTasks = await prisma.task.findMany({
    where: { ...taskWhere, status: "COMPLETED" },
    include: { subject: { select: { name: true, color: true } } },
    orderBy: { completedAt: "asc" },
  });

  const tasksByDate: Record<string, number> = {};
  for (const t of completedTasks) {
    if (t.completedAt) {
      const date = t.completedAt.toISOString().split("T")[0];
      tasksByDate[date] = (tasksByDate[date] || 0) + 1;
    }
  }

  return NextResponse.json({
    studyByDate: Object.entries(byDate).map(([date, mins]) => ({ date, mins })),
    studyBySubject: Object.values(bySubject),
    tasksByDate: Object.entries(tasksByDate).map(([date, count]) => ({ date, count })),
    totalMins: sessions.reduce((s, x) => s + x.durationMins, 0),
    totalTasks: completedTasks.length,
  });
}
