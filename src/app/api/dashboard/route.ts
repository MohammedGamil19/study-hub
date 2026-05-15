import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/dashboard
 *
 * Returns ALL data needed by the dashboard page in a single round-trip:
 * streak, points, subjects, today's tasks, upcoming exams, today's study time.
 *
 * This replaces the N+2 waterfall the dashboard previously used
 * (1 streak + 1 subjects + N×tasks + N×exams + 1 pomodoro).
 */
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const now = new Date();

  const [streakRecord, recentPoints, subjects, todayTasks, upcomingExams, pomodoroSessions] =
    await Promise.all([
      prisma.streakRecord.findUnique({ where: { userId } }),

      prisma.pointTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),

      prisma.subject.findMany({
        where: { userId, isArchived: false },
        select: { id: true, name: true, color: true, icon: true },
        orderBy: { createdAt: "asc" },
      }),

      prisma.task.findMany({
        where: {
          subject: { userId },
          status: { not: "COMPLETED" },
          dueDate: { gte: todayStart, lte: todayEnd },
        },
        include: { subject: { select: { name: true, color: true } } },
      }),

      prisma.exam.findMany({
        where: {
          subject: { userId },
          scheduledAt: { gt: now },
        },
        include: { subject: { select: { name: true } } },
        orderBy: { scheduledAt: "asc" },
        take: 5,
      }),

      prisma.pomodoroSession.findMany({
        where: { userId, type: "STUDY", startedAt: { gte: todayStart } },
        select: { durationMins: true },
      }),
    ]);

  return NextResponse.json({
    streak: streakRecord,
    recentPoints,
    subjects,
    todayTasks: todayTasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      dueDate: t.dueDate,
      subjectId: t.subjectId,
      subjectName: t.subject.name,
      subjectColor: t.subject.color,
    })),
    upcomingExams: upcomingExams.map((e) => ({
      id: e.id,
      title: e.title,
      scheduledAt: e.scheduledAt,
      type: e.type,
      subjectId: e.subjectId,
      subjectName: e.subject.name,
    })),
    totalStudyMins: pomodoroSessions.reduce((sum, s) => sum + s.durationMins, 0),
  });
}
