import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/subjects/[id]/stats
 *
 * Returns aggregated stats for the subject overview page in one query,
 * replacing the 6 individual fetches the page previously fired on mount.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: subjectId } = await params;

  // Verify ownership
  const subject = await prisma.subject.findFirst({
    where: { id: subjectId, userId: session.user.id },
  });
  if (!subject) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [chapters, tasks, lectureCount, reviewCount, examCount, pomodoroSessions] =
    await Promise.all([
      prisma.chapter.findMany({
        where: { subjectId },
        select: { isCompleted: true },
      }),
      prisma.task.findMany({
        where: { subjectId },
        select: { status: true },
      }),
      prisma.lecture.count({ where: { subjectId } }),
      prisma.review.count({ where: { subjectId } }),
      prisma.exam.count({ where: { subjectId } }),
      prisma.pomodoroSession.findMany({
        where: { subjectId, type: "STUDY", startedAt: { gte: todayStart } },
        select: { durationMins: true },
      }),
    ]);

  return NextResponse.json({
    chapters: chapters.length,
    completedChapters: chapters.filter((c) => c.isCompleted).length,
    tasks: tasks.length,
    completedTasks: tasks.filter((t) => t.status === "COMPLETED").length,
    lectures: lectureCount,
    reviews: reviewCount,
    exams: examCount,
    studyMins: pomodoroSessions.reduce((sum, s) => sum + s.durationMins, 0),
  });
}
