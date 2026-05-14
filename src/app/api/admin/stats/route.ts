import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

const ADMIN_EMAIL = "mohamadshogaa7712@gmail.com";

export async function GET() {
  const session = await auth();
  if (session?.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);

  const [
    totalUsers,
    premiumUsers,
    newUsersThisWeek,
    totalSubjects,
    totalChapters,
    completedChapters,
    totalTasks,
    completedTasks,
    totalPomodoro,
    pointsAgg,
    activeSessions,
    allUsers,
    recentPomodoro,
    recentPoints,
    allPomodoroRaw,
    allUsersForChart,
    totalReviews,
    completedReviews,
    totalExams,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isPremium: true } }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.subject.count(),
    prisma.chapter.count(),
    prisma.chapter.count({ where: { isCompleted: true } }),
    prisma.task.count(),
    prisma.task.count({ where: { status: "COMPLETED" } }),
    prisma.pomodoroSession.count(),
    prisma.pointTransaction.aggregate({ _sum: { points: true } }),
    prisma.session.count({ where: { expires: { gt: now } } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        isPremium: true,
        premiumSince: true,
        createdAt: true,
        image: true,
        language: true,
        _count: { select: { subjects: true } },
        streakRecord: {
          select: { currentStreak: true, longestStreak: true, totalPoints: true },
        },
      },
    }),
    prisma.pomodoroSession.findMany({
      take: 12,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        durationMins: true,
        type: true,
        startedAt: true,
        createdAt: true,
        userId: true,
        subject: { select: { name: true, icon: true, color: true } },
      },
    }),
    prisma.pointTransaction.findMany({
      take: 15,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        points: true,
        reason: true,
        createdAt: true,
        multiplier: true,
        user: { select: { email: true, name: true } },
      },
    }),
    prisma.pomodoroSession.findMany({
      select: { userId: true, durationMins: true },
    }),
    prisma.user.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.review.count(),
    prisma.review.count({ where: { status: "COMPLETED" } }),
    prisma.exam.count(),
  ]);

  // Group study mins by user
  const studyMinsByUser: Record<string, number> = {};
  allPomodoroRaw.forEach((p) => {
    studyMinsByUser[p.userId] = (studyMinsByUser[p.userId] || 0) + p.durationMins;
  });

  const totalStudyMins = Object.values(studyMinsByUser).reduce((a, b) => a + b, 0);

  const enrichedUsers = allUsers.map((u) => ({
    ...u,
    studyMins: studyMinsByUser[u.id] || 0,
  }));

  // Build 30-day registration chart
  const registrationChart: { date: string; users: number; cumulative: number }[] = [];
  let cumulative = allUsersForChart.filter(
    (u) => u.createdAt < subDays(now, 29)
  ).length;

  for (let i = 29; i >= 0; i--) {
    const d = subDays(now, i);
    const dateStr = d.toISOString().split("T")[0];
    const count = allUsersForChart.filter(
      (u) => u.createdAt.toISOString().split("T")[0] === dateStr
    ).length;
    cumulative += count;
    registrationChart.push({ date: dateStr, users: count, cumulative });
  }

  // Enrich recent pomodoro with user email
  const userIds = [...new Set(recentPomodoro.map((p) => p.userId))];
  const pomodoroUsers = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, name: true },
  });
  const pomodoroUserMap = Object.fromEntries(pomodoroUsers.map((u) => [u.id, u]));
  const enrichedPomodoro = recentPomodoro.map((p) => ({
    ...p,
    user: pomodoroUserMap[p.userId] || { email: "unknown", name: null },
  }));

  return NextResponse.json({
    stats: {
      totalUsers,
      premiumUsers,
      freeUsers: totalUsers - premiumUsers,
      newUsersThisWeek,
      totalSubjects,
      totalChapters,
      completedChapters,
      totalTasks,
      completedTasks,
      totalPomodoro,
      totalStudyMins,
      totalPoints: pointsAgg._sum.points || 0,
      activeSessions,
      totalReviews,
      completedReviews,
      totalExams,
    },
    users: enrichedUsers,
    recentPomodoro: enrichedPomodoro,
    recentPoints,
    registrationChart,
  });
}
